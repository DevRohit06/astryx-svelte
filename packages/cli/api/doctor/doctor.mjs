/**
 * @file Health-check engine for `astryx-svelte doctor`.
 *
 * Runs a series of diagnostic checks against the user's project and
 * environment, returning a structured report. Each check is a small,
 * self-contained function that returns a {@link DoctorCheck} record, so
 * adding a new diagnostic is just appending a function to {@link SYNC_CHECKS}.
 *
 * The engine is intentionally side-effect-free: it only *reads* the
 * filesystem, environment, and package metadata. It never installs, writes,
 * or mutates anything. That makes it safe to run in CI as a gate (exit 1 on
 * any FAIL) and safe for AI agents to invoke with `--json`.
 *
 * Status semantics:
 *   - 'pass' — everything is healthy.
 *   - 'warn' — non-fatal; the setup works but could be improved.
 *   - 'fail' — something is broken and should be fixed (drives exit 1).
 *   - 'info' — purely informational; never affects exit code.
 *
 * Every difference from upstream is an identity string — `@astryx-svelte/core`,
 * `@astryx-svelte/cli`, `@astryx-svelte/theme-*`, `astryx-svelte.config.*` — with
 * one exception worth naming: **`checkPeerDeps` reads whatever core declares**,
 * and core declares `svelte` where upstream declares `react`/`react-dom` *and*
 * `@stylexjs/stylex`. StyleX is a plain `dependency` here, not a peer, so there
 * is nothing for a consumer to install and nothing for this check to report. The
 * check is unchanged; its answer differs because the package graph does.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { MIN_NODE_VERSION, isNodeVersionSupported } from '../../foundation/env/node-version.mjs';
import { CLI_ROOT, findCoreDir } from '../../foundation/fs/paths.mjs';
import { detectPackageManager, getCliInvocation } from '../../foundation/env/package-manager.mjs';
import { findConfigPath, Project } from '../../foundation/config/project.mjs';
import { semverCompare, isValidSemver, satisfiesRange } from '../../foundation/env/semver.mjs';

/** The design-system package this CLI diagnoses. */
const CORE_PACKAGE = '@astryx-svelte/core';
/** This CLI's own package name, for the version-alignment check. */
const CLI_PACKAGE = '@astryx-svelte/cli';
/** npm scope every first-party package (core, cli, themes) lives under. */
const SCOPE = '@astryx-svelte';
/** Prefix of a theme package directory name inside {@link SCOPE}. */
const THEME_PREFIX = 'theme-';
/** The config basename named in every fix string. */
const CONFIG_FILE = 'astryx-svelte.config.mjs';

/**
 * @typedef {'pass'|'warn'|'fail'|'info'} DoctorStatus
 *
 * @typedef {object} DoctorCheck
 * @property {string} id Stable machine-readable id (e.g. 'node-version').
 * @property {string} label Human-readable check name.
 * @property {DoctorStatus} status
 * @property {string} message One-line result summary.
 * @property {string} [fix] Actionable remediation, present when not 'pass'.
 *
 * @typedef {object} DoctorReport
 * @property {DoctorCheck[]} checks
 * @property {{pass: number, warn: number, fail: number, info: number}} summary
 *
 * @typedef {object} DoctorContext
 * @property {string} cwd Directory to diagnose.
 * @property {string} nodeVersion Running Node version.
 * @property {string|null} coreDir Resolved core package directory, or null.
 * @property {string|null} configPath Resolved astryx-svelte.config.* path, or null.
 * @property {string|null} configTheme theme value read from config, or null.
 * @property {Error|null} [configError] Error thrown while resolving the config
 *   path (e.g. multiple config files present), surfaced by checkConfig as a FAIL.
 */

/* -- helpers ----------------------------------------------------------- */

/**
 * Safely read + parse a package.json. Returns null on any failure.
 * @param {string} pkgPath
 * @returns {Record<string, any>|null}
 */
function readPkg(pkgPath) {
	try {
		return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
	} catch {
		return null;
	}
}

/**
 * Read the version of an installed package from a resolved directory.
 * @param {string|null} dir
 * @returns {string|null}
 */
function pkgVersion(dir) {
	if (!dir) return null;
	const pkg = readPkg(path.join(dir, 'package.json'));
	return pkg?.version ?? null;
}

/**
 * Walk up from `startDir` to locate the nearest node_modules directory.
 * @param {string} startDir
 * @returns {string|null}
 */
function findNodeModules(startDir) {
	let dir = startDir;
	for (let i = 0; i < 6; i++) {
		const candidate = path.join(dir, 'node_modules');
		if (fs.existsSync(candidate)) return candidate;
		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}

/**
 * Find every installed @astryx-svelte/theme-* package under node_modules.
 * @param {string} cwd
 * @returns {Array<{name: string, version: string|null}>}
 */
function findThemePackages(cwd) {
	const nm = findNodeModules(cwd);
	/** @type {Array<{name: string, version: string|null}>} */
	const found = [];
	if (!nm) return found;
	const scopeDir = path.join(nm, SCOPE);
	if (!fs.existsSync(scopeDir)) return found;
	let entries;
	try {
		entries = fs.readdirSync(scopeDir, { withFileTypes: true });
	} catch {
		return found;
	}
	for (const entry of entries) {
		if (!entry.name.startsWith(THEME_PREFIX)) continue;
		const dir = path.join(scopeDir, entry.name);
		// pnpm installs packages as symlinks into node_modules/.pnpm, and a
		// symlink dirent reports isDirectory() as false — stat the target instead.
		let isDir = entry.isDirectory();
		if (!isDir && entry.isSymbolicLink()) {
			try {
				isDir = fs.statSync(dir).isDirectory();
			} catch {
				isDir = false;
			}
		}
		if (!isDir) continue;
		const name = `${SCOPE}/${entry.name}`;
		found.push({ name, version: pkgVersion(dir) });
	}
	return found;
}

/**
 * Find an installed package's version by walking `node_modules` up from `cwd`,
 * exactly as Node resolves a bare specifier — but reading `package.json` off
 * disk instead of resolving it.
 *
 * **This replaces upstream's `createRequire().resolve(name, {paths: [cwd]})`,
 * for two reasons.** The first is correctness: upstream needs a second,
 * version-blind probe when a package does not export `./package.json`, so a
 * peer that hides its manifest is reported "present" and never range-checked.
 * Reading the file has no such hole. The second is that `paths` is not
 * honourable under a bundling test runner — Vitest's module runner resolves
 * through Vite, which **ignores `paths`** and answers from the repo's own
 * `node_modules`. That silently turns every hermetic peer-dep fixture into a
 * test of this repo's install: the "missing peer" case found the monorepo's
 * `svelte`, and the "out of range" case found the monorepo's `@stylexjs/stylex`.
 * A check whose fixtures cannot isolate it is a check nothing pins down.
 *
 * pnpm's symlinked `node_modules/<name>` entries resolve through `existsSync`
 * and `readFileSync` like any directory, so the layout needs no special case
 * here (unlike {@link findThemePackages}, which reads *dirents*).
 *
 * @param {string} cwd
 * @param {string} name bare package name, scoped or not
 * @returns {string|null} the installed version, or null when not installed
 */
function findInstalledVersion(cwd, name) {
	let dir = cwd;
	for (let i = 0; i < 8; i++) {
		const pkgPath = path.join(dir, 'node_modules', ...name.split('/'), 'package.json');
		if (fs.existsSync(pkgPath)) {
			return readPkg(pkgPath)?.version ?? null;
		}
		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}

/**
 * Detect whether a theme appears to be wired up via the ASTRYX_THEME env var or
 * an `astryx.theme` field in the nearest package.json. Config-based wiring is
 * handled by the caller (ctx.configTheme). This only inspects static signals.
 *
 * Both signals are real here: `clients/cli/lib/resolve-theme.mjs` reads
 * `process.env.ASTRYX_THEME` then `pkg.astryx?.theme`, in that order. The
 * `astryx` package.json namespace keeps upstream's spelling — the slice-2
 * decision — so this reads the same field name upstream does.
 * @param {string} cwd
 * @returns {{wired: boolean, source: string|null}}
 */
function detectThemeWiring(cwd) {
	if (process.env.ASTRYX_THEME) return { wired: true, source: 'ASTRYX_THEME env var' };
	const nm = findNodeModules(cwd);
	const projectDir = nm ? path.dirname(nm) : cwd;
	const pkg = readPkg(path.join(projectDir, 'package.json'));
	if (pkg?.astryx?.theme) return { wired: true, source: 'package.json astryx.theme' };
	return { wired: false, source: null };
}

/* -- individual checks ------------------------------------------------- */

/**
 * Check 1 — running Node version meets the CLI's minimum.
 * @param {DoctorContext} ctx
 * @returns {DoctorCheck}
 */
export function checkNodeVersion(ctx) {
	const supported = isNodeVersionSupported(ctx.nodeVersion);
	return {
		id: 'node-version',
		label: 'Node.js version',
		status: supported ? 'pass' : 'fail',
		message: supported
			? `Node v${ctx.nodeVersion} meets the minimum (>=${MIN_NODE_VERSION}).`
			: `Node v${ctx.nodeVersion} is below the required minimum (>=${MIN_NODE_VERSION}).`,
		...(supported ? {} : { fix: `Upgrade Node.js to >=${MIN_NODE_VERSION} and re-run.` })
	};
}

/**
 * Check 2 — @astryx-svelte/core is installed and resolvable from the project.
 * @param {DoctorContext} ctx
 * @returns {DoctorCheck}
 */
export function checkCoreInstalled(ctx) {
	const found = Boolean(ctx.coreDir);
	const version = pkgVersion(ctx.coreDir);
	return {
		id: 'core-installed',
		label: `${CORE_PACKAGE} installed`,
		status: found ? 'pass' : 'fail',
		message: found
			? `${CORE_PACKAGE} resolved${version ? ` (v${version})` : ''}.`
			: `${CORE_PACKAGE} could not be resolved from this project.`,
		...(found
			? {}
			: {
					fix: `Install the design system: \`npm install ${CORE_PACKAGE}\` (or yarn/pnpm/bun).`
				})
	};
}

/**
 * Check 3 — installed core is in step with the CLI (major/minor drift).
 * @param {DoctorContext} ctx
 * @returns {DoctorCheck}
 */
export function checkVersionAlignment(ctx) {
	const coreVersion = pkgVersion(ctx.coreDir);
	const cliPkg = readPkg(path.join(CLI_ROOT, 'package.json'));
	const cliVersion = cliPkg?.version ?? null;
	const label = `${CORE_PACKAGE} <-> ${CLI_PACKAGE} alignment`;

	if (!coreVersion || !cliVersion) {
		return {
			id: 'version-alignment',
			label,
			status: 'info',
			message: `Skipped — could not read both ${CORE_PACKAGE} and ${CLI_PACKAGE} versions.`
		};
	}

	// A monorepo/linked install often pins a non-semver range like `workspace:*`
	// or `link:...`. `'workspace:*'.split('.').map(Number)` yields NaN, and
	// `NaN !== cliMajor` is always true — that produced a spurious drift WARN
	// with a `NaN.undefined.x` fix string. If either version isn't real semver,
	// there's nothing to compare: skip.
	if (!isValidSemver(coreVersion) || !isValidSemver(cliVersion)) {
		return {
			id: 'version-alignment',
			label,
			status: 'info',
			message:
				`Skipped — ${CORE_PACKAGE} v${coreVersion} / ${CLI_PACKAGE} ` +
				`v${cliVersion} are not both comparable semver.`
		};
	}

	const [coreMajor, coreMinor] = coreVersion.split('.').map(Number);
	const [cliMajor, cliMinor] = cliVersion.split('.').map(Number);
	const drift = coreMajor !== cliMajor || coreMinor !== cliMinor;

	return {
		id: 'version-alignment',
		label,
		status: drift ? 'warn' : 'pass',
		message: drift
			? `${CORE_PACKAGE} v${coreVersion} drifts from ${CLI_PACKAGE} v${cliVersion} (major/minor mismatch).`
			: `${CORE_PACKAGE} v${coreVersion} is in step with ${CLI_PACKAGE} v${cliVersion}.`,
		...(drift
			? {
					fix:
						semverCompare(cliVersion, coreVersion) > 0
							? `Update ${CORE_PACKAGE} to ${cliMajor}.${cliMinor}.x to match the CLI.`
							: `Update ${CLI_PACKAGE} to ${coreMajor}.${coreMinor}.x to match ${CORE_PACKAGE}.`
				}
			: {})
	};
}

/**
 * Check 4 — at least one @astryx-svelte/theme-* is installed and a theme is wired.
 * @param {DoctorContext} ctx
 * @returns {DoctorCheck}
 */
export function checkThemes(ctx) {
	const themes = findThemePackages(ctx.cwd);
	const wiring = detectThemeWiring(ctx.cwd);
	const hasConfigTheme = Boolean(ctx.configTheme);
	const wired = wiring.wired || hasConfigTheme;

	if (themes.length === 0) {
		return {
			id: 'themes',
			label: 'Theme packages',
			status: 'warn',
			message: `No ${SCOPE}/${THEME_PREFIX}* packages are installed.`,
			fix:
				`Install a theme, e.g. \`npm install ${SCOPE}/theme-neutral\`, then import ` +
				`its CSS or set astryx.theme.`
		};
	}

	const names = themes.map((t) => t.name).join(', ');
	if (!wired) {
		return {
			id: 'themes',
			label: 'Theme packages',
			status: 'warn',
			message: `Theme package(s) installed (${names}) but no theme appears wired.`,
			fix:
				'Wire a theme via the `astryx.theme` field in package.json, the ASTRYX_THEME ' +
				`env var, or your ${CONFIG_FILE}.`
		};
	}

	const source = hasConfigTheme ? `${CONFIG_FILE} theme` : wiring.source;
	return {
		id: 'themes',
		label: 'Theme packages',
		status: 'pass',
		message: `Theme package(s) installed (${names}); wired via ${source}.`
	};
}

/**
 * Check 5 — astryx-svelte.config.* (if present) loads and has a valid shape.
 * @param {DoctorContext} ctx
 * @returns {Promise<DoctorCheck>}
 */
export async function checkConfig(ctx) {
	// A resolution error (e.g. multiple astryx-svelte.config.* files) is exactly
	// the kind of setup problem doctor should report — not crash on.
	if (ctx.configError) {
		return {
			id: 'config',
			label: CONFIG_FILE,
			status: 'fail',
			message: ctx.configError.message,
			fix: 'Keep exactly one astryx-svelte.config.{ts,mjs,js} at your project root.'
		};
	}
	if (!ctx.configPath) {
		return {
			id: 'config',
			label: CONFIG_FILE,
			status: 'info',
			message: `No ${CONFIG_FILE} found — using defaults.`
		};
	}

	// Project.load swallows nothing — it surfaces a genuine load failure — but
	// the config check wants to report a bad default export precisely, so we
	// re-import directly to surface a genuine load failure as a FAIL.
	try {
		const { pathToFileURL } = await import('node:url');
		const mod = await import(pathToFileURL(ctx.configPath).href);
		const config = mod.default;
		if (config !== undefined && (typeof config !== 'object' || config === null)) {
			return {
				id: 'config',
				label: CONFIG_FILE,
				status: 'fail',
				message: `${CONFIG_FILE} default export is not an object (got ${typeof config}).`,
				fix: `Export a default object from ${CONFIG_FILE}, e.g. \`export default { integrations: [] };\`.`
			};
		}
		return {
			id: 'config',
			label: CONFIG_FILE,
			status: 'pass',
			message: `${CONFIG_FILE} loaded cleanly (${
				path.relative(ctx.cwd, ctx.configPath) || ctx.configPath
			}).`
		};
	} catch (err) {
		return {
			id: 'config',
			label: CONFIG_FILE,
			status: 'fail',
			message: `${CONFIG_FILE} failed to load: ${/** @type {any} */ (err).message}`,
			fix: `Fix the syntax/runtime error in ${CONFIG_FILE} so it imports cleanly.`
		};
	}
}

/**
 * Check 6 — agent docs exist and contain the Astryx section markers.
 * @param {DoctorContext} ctx
 * @returns {DoctorCheck}
 */
export function checkAgentDocs(ctx) {
	const candidates = ['AGENTS.md', 'CLAUDE.md', path.join('.claude', 'CLAUDE.md'), '.cursorrules'];
	const present = candidates.filter((rel) => fs.existsSync(path.join(ctx.cwd, rel)));

	if (present.length === 0) {
		return {
			id: 'agent-docs',
			label: 'AI agent docs',
			status: 'info',
			message: 'No agent docs (CLAUDE.md / AGENTS.md / .cursorrules) found.',
			fix: `Generate agent docs with \`${getCliInvocation(ctx.cwd)} init --features agents\`.`
		};
	}

	const withMarkers = present.filter((rel) => {
		try {
			const content = fs.readFileSync(path.join(ctx.cwd, rel), 'utf-8');
			return (
				(content.includes('<!-- ASTRYX:START -->') || content.includes('<!-- XDS:START -->')) &&
				(content.includes('<!-- ASTRYX:END -->') || content.includes('<!-- XDS:END -->'))
			);
		} catch {
			return false;
		}
	});

	if (withMarkers.length === 0) {
		return {
			id: 'agent-docs',
			label: 'AI agent docs',
			status: 'warn',
			message: `Agent docs present (${present.join(', ')}) but no Astryx section markers found.`,
			fix: `Add the Astryx section to your agent docs with \`${getCliInvocation(
				ctx.cwd
			)} init --features agents\`.`
		};
	}

	return {
		id: 'agent-docs',
		label: 'AI agent docs',
		status: 'pass',
		message: `Astryx agent docs section present in ${withMarkers.join(', ')}.`
	};
}

/**
 * Check 7 — core's peer dependencies are satisfied by installed packages.
 * @param {DoctorContext} ctx
 * @returns {DoctorCheck}
 */
export function checkPeerDeps(ctx) {
	const label = `${CORE_PACKAGE} peer dependencies`;
	if (!ctx.coreDir) {
		return {
			id: 'peer-deps',
			label,
			status: 'info',
			message: `Skipped — ${CORE_PACKAGE} is not installed.`
		};
	}

	const corePkg = readPkg(path.join(ctx.coreDir, 'package.json'));
	const peers = corePkg?.peerDependencies ?? {};
	// npm's `peerDependenciesMeta.optional` marks a peer that is only needed by
	// part of the package — core's `./vite` preset needs `vite` and
	// `@stylexjs/unplugin`, and a consumer on another bundler needs neither.
	// Reporting those as missing tells most projects to install two packages
	// they have no use for, which is noise a health check cannot afford: a
	// warning nobody should act on is how the ones that matter stop being read.
	const optional = corePkg?.peerDependenciesMeta ?? {};
	const peerNames = Object.keys(peers).filter((name) => optional[name]?.optional !== true);

	if (peerNames.length === 0) {
		return {
			id: 'peer-deps',
			label,
			status: 'info',
			message: `${CORE_PACKAGE} declares no peer dependencies.`
		};
	}

	const missing = [];
	/** @type {Array<{name: string, want: string, have: string}>} */
	const mismatched = [];
	for (const name of peerNames) {
		const want = peers[name];
		const have = findInstalledVersion(ctx.cwd, name);
		if (have === null) {
			missing.push(`${name}@${want}`);
			continue;
		}
		// Present and version-readable: verify it actually satisfies the range,
		// not just that the package exists (a bare `npm install` can resolve an
		// out-of-range version from a stale consumer range and still "look" fine).
		if (!satisfiesRange(have, want)) {
			mismatched.push({ name, want, have });
		}
	}

	if (missing.length > 0 || mismatched.length > 0) {
		const problems = [];
		if (missing.length) problems.push(`missing: ${missing.join(', ')}`);
		if (mismatched.length) {
			problems.push(
				`out of range: ${mismatched.map((m) => `${m.name}@${m.have} (needs ${m.want})`).join(', ')}`
			);
		}
		// Pin the required range for anything wrong so the hint fixes it even when a
		// stale consumer range would otherwise resolve an incompatible version.
		// Quote targets containing shell metacharacters (e.g. `svelte@>=5.0.0`).
		const quote = (/** @type {string} */ s) => (/[<>|() ]/.test(s) ? `'${s}'` : s);
		const targets = [...missing, ...mismatched.map((m) => `${m.name}@${m.want}`)].map(quote);
		return {
			id: 'peer-deps',
			label,
			status: 'warn',
			message: `Peer dependency issues — ${problems.join('; ')}.`,
			fix: `Install compatible peers: \`npm install ${targets.join(' ')}\`.`
		};
	}

	return {
		id: 'peer-deps',
		label,
		status: 'pass',
		message: `All peer dependencies satisfied (${peerNames.join(', ')}).`
	};
}

/**
 * Check 8 — report the detected package manager (informational).
 * @param {DoctorContext} ctx
 * @returns {DoctorCheck}
 */
export function checkPackageManager(ctx) {
	const pm = detectPackageManager(ctx.cwd);
	const detected = pm !== 'npx';
	return {
		id: 'package-manager',
		label: 'Package manager',
		status: 'info',
		message: detected
			? `Detected package manager: ${pm}.`
			: 'No lockfile detected — defaulting to npm/npx.'
	};
}

/** Vite config filenames, in the order Vite itself resolves them. */
const VITE_CONFIGS = [
	'vite.config.ts',
	'vite.config.js',
	'vite.config.mjs',
	'vite.config.mts',
	'vite.config.cjs'
];

/**
 * Whether the project imports `@astryx-svelte/core/astryx.css` anywhere under
 * `src/`.
 *
 * A text scan, like the rest of this check, and bounded: the engine's contract
 * is to read rather than execute, and `doctor` runs on a developer's machine
 * where an unbounded walk of an arbitrary tree is a hazard of its own. It stops
 * at the first hit, skips `node_modules`, and gives up after `FILE_BUDGET`
 * files — a project whose stylesheet import is past that will simply fall
 * through to the config-based branches below, which is the pre-existing
 * behaviour rather than a wrong answer.
 *
 * @param {string} cwd
 */
function importsPrebuiltStylesheet(cwd) {
	const FILE_BUDGET = 400;
	const EXTENSIONS = new Set(['.svelte', '.ts', '.js', '.css', '.mjs']);
	const roots = ['src', 'app'].map((dir) => path.join(cwd, dir)).filter((p) => fs.existsSync(p));
	let budget = FILE_BUDGET;

	/** @param {string} dir */
	const scan = (dir) => {
		if (budget <= 0) return false;
		let entries;
		try {
			entries = fs.readdirSync(dir, { withFileTypes: true });
		} catch {
			return false;
		}
		for (const entry of entries) {
			if (budget <= 0) return false;
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
				if (scan(full)) return true;
				continue;
			}
			if (!EXTENSIONS.has(path.extname(entry.name))) continue;
			budget--;
			try {
				if (fs.readFileSync(full, 'utf-8').includes('@astryx-svelte/core/astryx.css')) return true;
			} catch {
				// Unreadable file: not evidence either way.
			}
		}
		return false;
	};

	return roots.some((root) => scan(root));
}

/**
 * Check 8 — the components will actually be styled.
 *
 * **The most common way to get this package wrong, and the only one that
 * produces no error at all.** There are two ways to be right, and the check
 * accepts either.
 *
 * The first is the pre-built stylesheet: `core`'s `dist` ships compiled, so
 * importing `@astryx-svelte/core/astryx.css` styles everything with no bundler
 * configuration whatsoever. Finding that import is a pass, and it is tested
 * first — otherwise a correctly configured project would be told it is broken
 * for lacking a compiler it does not need.
 *
 * The second is compiling the package yourself, from the `source` export
 * condition. That needs three things present, two of which exist only because
 * Vite has two separate ways to route a dependency around its own plugin
 * pipeline. The preset (`@astryx-svelte/core/vite`) supplies all three, so
 * finding it is a pass on its own.
 *
 * Deliberately a **text scan**, not an import: a `vite.config.ts` is TypeScript
 * that may import project-local modules and read env vars, and this engine's
 * contract is to read rather than execute. That makes the check honest but not
 * authoritative — it cannot see a config that assembles its plugin list
 * indirectly, which is why a negative result is a `warn` and never a `fail`.
 *
 * @param {DoctorContext} ctx
 * @returns {DoctorCheck}
 */
export function checkStyleXSetup(ctx) {
	const label = 'StyleX compiler wiring';
	const found = VITE_CONFIGS.map((name) => path.join(ctx.cwd, name)).find((p) => fs.existsSync(p));

	if (!found) {
		return {
			id: 'stylex-setup',
			label,
			status: 'info',
			message: 'No vite.config.* found — skipping. This check only covers Vite/SvelteKit.'
		};
	}

	const source = fs.readFileSync(found, 'utf-8');
	const rel = path.relative(ctx.cwd, found) || found;

	// The pre-built stylesheet makes the compiler optional: `core`'s `dist` ships
	// compiled, so a project that imports `astryx.css` is correctly set up with no
	// StyleX wiring at all. Checking the config alone would tell those projects
	// they are broken when they are not.
	if (importsPrebuiltStylesheet(ctx.cwd)) {
		return {
			id: 'stylex-setup',
			label,
			status: 'pass',
			message:
				'This project imports @astryx-svelte/core/astryx.css, so the components are ' +
				'styled from the pre-built stylesheet and need no StyleX wiring.'
		};
	}

	if (/@astryx-svelte\/core\/vite/.test(source)) {
		return {
			id: 'stylex-setup',
			label,
			status: 'pass',
			message: `${rel} uses the astryx() preset, which supplies all three settings.`
		};
	}

	const missing = [];
	if (!/@stylexjs\/unplugin/.test(source)) missing.push('the StyleX plugin');
	if (!/optimizeDeps/.test(source) || !/exclude/.test(source)) missing.push('optimizeDeps.exclude');
	if (!/noExternal/.test(source)) missing.push('ssr.noExternal');

	if (missing.length === 0) {
		return {
			id: 'stylex-setup',
			label,
			status: 'pass',
			message: `${rel} configures StyleX by hand, and all three settings are present.`
		};
	}

	return {
		id: 'stylex-setup',
		label,
		status: 'warn',
		message:
			`${rel} appears to be missing ${missing.join(', ')}. ` +
			'Components would render unstyled, with no error.',
		fix:
			'Replace the hand-rolled StyleX block with the preset:\n' +
			"    import { astryx } from '@astryx-svelte/core/vite';\n" +
			'    export default defineConfig({ plugins: [astryx(), sveltekit()] });'
	};
}

/**
 * Ordered list of synchronous check functions. Append here to add a check.
 * (checkConfig is async and is awaited separately by {@link runChecks}.)
 * @type {Array<(ctx: DoctorContext) => DoctorCheck>}
 */
export const SYNC_CHECKS = [
	checkNodeVersion,
	checkCoreInstalled,
	checkVersionAlignment,
	checkThemes,
	checkAgentDocs,
	checkPeerDeps,
	checkStyleXSetup,
	checkPackageManager
];

/**
 * Run all diagnostic checks and return a structured report.
 *
 * @param {object} [options]
 * @param {string} [options.cwd] Directory to diagnose (default: process.cwd()).
 * @returns {Promise<DoctorReport>}
 */
export async function runChecks(options = {}) {
	const cwd = options.cwd ?? process.cwd();
	const coreDir = findCoreDir(cwd);
	// findConfigPath throws when multiple config files coexist. That's a
	// misconfiguration doctor exists to report — catch it and surface it through
	// checkConfig as a FAIL rather than crashing the whole diagnostic engine.
	let configPath = null;
	let configError = null;
	try {
		configPath = findConfigPath(cwd);
	} catch (err) {
		configError = /** @type {Error} */ (err);
	}

	// Resolve a possible theme key from config (best-effort; never throws).
	let configTheme = null;
	try {
		const project = await Project.load(cwd);
		configTheme = /** @type {{theme?: string}} */ (project.config ?? {}).theme ?? null;
	} catch {
		// Best-effort: a missing/invalid config leaves configTheme null.
	}

	/** @type {DoctorContext} */
	const ctx = {
		cwd,
		nodeVersion: process.versions.node,
		coreDir,
		configPath,
		configTheme,
		configError
	};

	/** @type {DoctorCheck[]} */
	const checks = [];
	// checkConfig is async; run it in its declared slot (after themes).
	for (const fn of SYNC_CHECKS) {
		checks.push(fn(ctx));
		if (fn === checkThemes) {
			checks.push(await checkConfig(ctx));
		}
	}

	const summary = { pass: 0, warn: 0, fail: 0, info: 0 };
	for (const c of checks) summary[c.status] += 1;

	return { checks, summary };
}

/**
 * Programmatic API: run the doctor and return the same envelope shape that
 * `astryx-svelte doctor --json` emits.
 *
 * @param {object} [options]
 * @param {string} [options.cwd]
 * @returns {Promise<{type: 'doctor', data: DoctorReport}>}
 */
export async function doctor(options = {}) {
	const report = await runChecks(options);
	return { type: 'doctor', data: report };
}
