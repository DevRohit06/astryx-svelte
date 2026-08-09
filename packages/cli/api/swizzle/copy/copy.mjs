/**
 * @file swizzle.copy leaf — copy a component's source into the consumer project
 * for customization, rewriting escaping relative imports to the OWNER package's
 * public entrypoints.
 *
 * Side-effecting: writes files and returns a `swizzle.copy` receipt describing
 * what it did. Shared core discovery + component listing come from
 * api/swizzle/_adapter.mjs; everything here (owner resolution, the copy, import
 * rewriting, StyleX detection, maintainer feedback) is copy-specific. Errors
 * throw AstryxError (stable code + suggestions). All human prose /
 * package-manager prefixing lives in the CLI renderer.
 *
 * ## Four adaptations, each forced by a measured fact about this port
 *
 * **1. A name is resolved to a directory through the barrel, and the directory
 * is what gets copied.** Upstream's component directories *are* the component
 * names (`src/Button`), so `swizzle Button` is one `existsSync`. Here the
 * directories are kebab-case families and **98 of 191 exported components have
 * no directory of their own** — `AvatarStatusDot` lives in `avatar/` beside
 * `Avatar`. So the argument is matched first against the directory listing
 * (`swizzle avatar`) and then through the export barrel
 * (`swizzle AvatarStatusDot` -> `avatar/`), and either way the *whole family
 * directory* is copied, under its own name: `components/astryx/avatar/`. Naming
 * the output `AvatarStatusDot/` would claim the copy is one component when it is
 * two, and swizzling both siblings would then write the same files twice.
 *
 * **2. The copy is recursive**, where upstream copies only the top-level files
 * of the directory. One core component family (`table/`) has a subdirectory
 * today; a non-recursive copy drops it silently and the swizzled component fails
 * to build with a missing module.
 *
 * **3. Import rewriting resolves the specifier instead of pattern-matching it.**
 * Upstream maps `../<dir>/<x>` -> `<pkg>/<dir>` textually, which is right there
 * because it publishes a subpath per component directory (123 keys). This port
 * publishes **10**, everything else lives on the root barrel, and a component
 * family can nest — so `../../types.js` from `chat/composer/x/` is *inside* the
 * copied directory and must not be touched at all, a case upstream's regex
 * cannot see. Each escaping specifier is therefore resolved to a real file and
 * classified against the owner's actual `package.json#exports` + barrels.
 * Measured over all 585 source files in `src/lib/components`: 792 imports stay
 * inside the copied directory, 1,854 map to a public entrypoint, and **108
 * across 22 distinct modules have no public home at all** (`internal/sx.js`
 * leads with 363 occurrences before type re-exports are counted — see below).
 *
 * **4. A `.svelte` default import becomes a named import.** `import Icon from
 * '../icon/icon.svelte'` has no specifier-only rewrite: the barrel publishes
 * `Icon` as a named export (`export {default as Icon}`), so the *statement*
 * shape has to change. Upstream never hits this because a React component is
 * already imported by name.
 *
 * When an owner package declares **no** `exports` map — the ordinary shape for a
 * third-party integration — every deep path is importable by Node's own rules,
 * so upstream's textual collapse is correct and is what runs. The resolving path
 * applies only to an owner that both declares `exports` and ships `src/lib`,
 * i.e. core.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolveCore } from '../_adapter.mjs';
import {
	assertWithin,
	sanitizeName,
	PathSafetyError
} from '../../../foundation/fs/path-safety.mjs';
import { checkGhCli } from '../_github.mjs';
import { Project } from '../../../foundation/config/project.mjs';
import { DEFAULT_ISSUES_URL } from '../../../foundation/config/project.mjs';
import {
	CORE_PACKAGE,
	findComponentSource,
	findIntegrationComponentDoc,
	findIntegrationComponentSource
} from '../../../foundation/discovery/component-discovery.mjs';
import { ERROR_CODES } from '../../../foundation/response/error-codes.mjs';
import { AstryxError } from '../../error.mjs';

/** Files whose imports are rewritten and which are scanned for StyleX. */
const REWRITABLE_EXT = /\.(?:svelte|ts|mts|js|mjs)$/;

/**
 * A single `export {...} from '...'` statement, value or type. Group 1 is the
 * `type` keyword when present — a type-only re-export still makes the module
 * publicly reachable, which is the whole question here, so unlike
 * component-discovery (which indexes runtime bindings) this keeps it. Counting
 * type re-exports is what takes the unresolvable set from 801 occurrences to
 * 108: `base-props.ts` and `internal/types.ts` are reachable as
 * `import type {BaseProps} from '@astryx-svelte/core'`.
 */
const EXPORT_FROM_RE = /^[^\S\r\n]*export\s+(type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/gm;

/**
 * An `export * from '...'` statement.
 *
 * Both barrel regexes are **line-anchored**, and that is load bearing rather
 * than tidy: core's root barrel documents its own shape in prose — "re-exported
 * at the root as upstream's index does (`export * from './i18n'`)" — and an
 * unanchored pattern reads those comments as code. It did: `theme/index.ts`,
 * `i18n/index.ts` and `utils/index.ts` were all indexed a second time under the
 * ROOT specifier, so `../../styles/tokens.stylex.js` rewrote to
 * `@astryx-svelte/core` instead of `@astryx-svelte/core/theme`. A comment line
 * begins with `//` or ` *`, never with `export`, so anchoring is the whole fix.
 */
const EXPORT_STAR_RE = /^[^\S\r\n]*export\s+\*\s+from\s*['"]([^'"]+)['"]/gm;

/** A `X as Y` clause inside an export list. */
const AS_CLAUSE_RE = /^(\S+)\s+as\s+(\S+)$/;

/**
 * A static default import, optionally with a named clause:
 *   import Icon from '../icon/icon.svelte';
 *   import Button, {type ButtonProps} from '../button/button.svelte';
 */
const DEFAULT_IMPORT_RE =
	/\bimport\s+([A-Za-z_$][\w$]*)\s*(,\s*\{[^}]*\})?\s*from\s*(['"])(\.[^'"]+)\3/g;

/** Any remaining `from '<relative>'` specifier. */
const FROM_SPECIFIER_RE = /(from\s+['"])(\.[^'"]+)(['"])/g;

/** A dynamic `import('<relative>')` specifier. */
const DYNAMIC_IMPORT_RE = /(import\(\s*['"])(\.[^'"]+)(['"])/g;

/** @type {Map<string, PublicSurface|null>} ownerRoot -> memoized surface */
const surfaceCache = new Map();

/**
 * @typedef {object} PublicModule
 * @property {string} specifier the public entrypoint that re-exports this module
 * @property {string|null} defaultAs the name the module's default export is published under
 *
 * @typedef {object} PublicSurface
 * @property {string} srcRoot absolute `<ownerRoot>/src/lib`
 * @property {Array<{pattern: string, subpath: string}>} assets src-relative export patterns
 * @property {Map<string, PublicModule>} modules absolute source path -> entrypoint
 */

/**
 * Resolve a barrel's relative specifier to a real source file. Barrels are
 * TypeScript and import with the emitted `.js` extension, so `./x.svelte.js` has
 * to be tried as `.svelte.ts` too; a bare directory specifier resolves to its
 * `index.ts`. Same candidate ladder as foundation/discovery.
 * @param {string} fromDir
 * @param {string} spec
 * @returns {string | null}
 */
function resolveSpecifier(fromDir, spec) {
	if (!spec.startsWith('.')) return null;
	const base = path.resolve(fromDir, spec);
	const candidates = [
		base,
		base.replace(/\.js$/, '.ts'),
		base.replace(/\.js$/, '.svelte.ts'),
		`${base}.ts`,
		path.join(base, 'index.ts')
	];
	for (const candidate of candidates) {
		try {
			if (fs.statSync(candidate).isFile()) return candidate;
		} catch {
			// next candidate
		}
	}
	return null;
}

/**
 * Index one barrel: every module it re-exports becomes reachable through
 * `specifier`. First writer wins, and callers walk entrypoints shallowest-first,
 * so the root barrel claims a module it shares with a subpath barrel.
 * @param {string} barrelPath
 * @param {string} specifier
 * @param {Map<string, PublicModule>} into
 * @param {number} depth guards `export *` recursion
 */
function indexBarrel(barrelPath, specifier, into, depth = 0) {
	let source;
	try {
		source = fs.readFileSync(barrelPath, 'utf-8');
	} catch {
		return;
	}
	const dir = path.dirname(barrelPath);

	for (const match of source.matchAll(EXPORT_FROM_RE)) {
		const resolved = resolveSpecifier(dir, match[3]);
		if (!resolved) continue;
		let defaultAs = null;
		for (const raw of match[2].split(',')) {
			const clause = raw.trim().replace(/^type\s+/, '');
			if (!clause) continue;
			const aliased = AS_CLAUSE_RE.exec(clause);
			if (aliased && aliased[1] === 'default') defaultAs = aliased[2];
			else if (clause === 'default') defaultAs = 'default';
		}
		const existing = into.get(resolved);
		if (existing) {
			if (!existing.defaultAs && defaultAs) existing.defaultAs = defaultAs;
			continue;
		}
		into.set(resolved, { specifier, defaultAs });
	}

	// `export * from './hooks/index.js'` re-exports a whole barrel. Follow it one
	// level so its members are attributed — the members keep the *inner* barrel's
	// specifier when it is itself an entrypoint, because entrypoints are indexed
	// before the root's stars are followed.
	if (depth >= 1) return;
	for (const match of source.matchAll(EXPORT_STAR_RE)) {
		const resolved = resolveSpecifier(dir, match[1]);
		if (resolved) indexBarrel(resolved, specifier, into, depth + 1);
	}
}

/**
 * Build the owner package's public surface from its `package.json#exports`.
 *
 * Returns null when the owner declares no `exports` map or ships no `src/lib`.
 * Both cases mean the same thing for a rewrite: the public surface is not
 * knowable from here, and Node imposes no subpath restriction, so the caller
 * falls back to upstream's textual collapse.
 *
 * Export targets are `./dist/<x>` and the sources they were built from are
 * `src/lib/<x>` — that is what `svelte-package` does, and core's `files` ships
 * both trees.
 * @param {string} ownerRoot
 * @param {string} ownerPackage
 * @returns {PublicSurface|null}
 */
function publicSurface(ownerRoot, ownerPackage) {
	const key = path.resolve(ownerRoot);
	if (surfaceCache.has(key)) return surfaceCache.get(key) ?? null;

	/** @type {PublicSurface|null} */
	let surface = null;
	const srcRoot = path.join(key, 'src', 'lib');
	/** @type {Record<string, any> | null} */
	let pkg;
	try {
		pkg = JSON.parse(fs.readFileSync(path.join(key, 'package.json'), 'utf-8'));
	} catch {
		pkg = null;
	}

	if (pkg?.exports && fs.existsSync(srcRoot)) {
		/** @type {Array<{pattern: string, subpath: string}>} */
		const assets = [];
		/** @type {Array<{srcPath: string, specifier: string}>} */
		const entrypoints = [];

		for (const [exportKey, value] of Object.entries(pkg.exports)) {
			const target =
				typeof value === 'string'
					? value
					: /** @type {any} */ (
							value?.svelte ??
								/** @type {any} */ (value)?.import ??
								/** @type {any} */ (value)?.default
						);
			if (typeof target !== 'string') continue;
			const srcRel = target.replace(/^\.\/dist\//, '');
			const specifier =
				exportKey === '.' ? ownerPackage : `${ownerPackage}/${exportKey.replace(/^\.\//, '')}`;
			if (/\.(?:js|mjs)$/.test(srcRel) && !srcRel.includes('*')) {
				entrypoints.push({ srcPath: path.join(srcRoot, srcRel), specifier });
			} else {
				assets.push({ pattern: srcRel, subpath: exportKey.replace(/^\.\//, '') });
			}
		}

		// Shallowest entrypoint first, so the root barrel claims anything it and a
		// subpath barrel both re-export.
		entrypoints.sort(
			(a, b) =>
				a.srcPath.split(path.sep).length - b.srcPath.split(path.sep).length ||
				a.srcPath.localeCompare(b.srcPath)
		);

		/** @type {Map<string, PublicModule>} */
		const modules = new Map();
		for (const { srcPath, specifier } of entrypoints) {
			const barrel = resolveSpecifier(path.dirname(srcPath), `./${path.basename(srcPath)}`);
			if (!barrel) continue;
			// The entrypoint module is reachable as itself, not only through what it
			// re-exports: `import {…} from '../../utils/index.js'` targets the barrel
			// directly and must map to `<pkg>/utils`.
			if (!modules.has(barrel)) modules.set(barrel, { specifier, defaultAs: null });
			indexBarrel(barrel, specifier, modules);
		}

		surface = { srcRoot, assets, modules };
	}

	surfaceCache.set(key, surface);
	return surface;
}

/**
 * Discard the memoized public surfaces. Test-only, for a suite that rewrites a
 * fixture package's `exports` between assertions.
 * @returns {void}
 */
export function __resetSwizzleSurfaceCache() {
	surfaceCache.clear();
}

/**
 * Match a src-relative path against an export pattern that may contain one `*`.
 * @param {string} pattern e.g. `locales/*.json`
 * @param {string} relPath e.g. `locales/en.json`
 * @returns {string|null} the resolved subpath tail, or null when it doesn't match
 */
function matchAssetPattern(pattern, relPath) {
	if (!pattern.includes('*')) return pattern === relPath ? relPath : null;
	const [head, tail] = pattern.split('*');
	if (!relPath.startsWith(head) || !relPath.endsWith(tail)) return null;
	if (relPath.length < head.length + tail.length) return null;
	return relPath;
}

/**
 * Upstream's textual collapse: strip every leading `../`, then keep the whole
 * path for an asset file and only the first segment otherwise.
 *
 * This is what runs for an owner whose public surface is not knowable (no
 * `exports` map), which is the ordinary shape of a third-party integration —
 * and it is *correct* there, because without an `exports` map Node lets any deep
 * path be imported.
 * @param {string} importPath
 * @param {string} ownerPackage
 * @returns {string}
 */
function collapseToOwner(importPath, ownerPackage) {
	const rest = importPath.replace(/^(?:\.\.\/)+/, '');
	const parts = rest.split('/');
	const last = parts[parts.length - 1];
	// Asset files are resolved by exact export / wildcard, never a barrel.
	if (/\.(?:json|css)$/.test(last)) return `${ownerPackage}/${rest}`;
	return `${ownerPackage}/${parts[0]}`;
}

/**
 * @typedef {object} RewriteContext
 * @property {string} ownerPackage
 * @property {string} fileDir directory of the file being rewritten
 * @property {string} copiedRoot the directory being copied (imports inside it stay relative)
 * @property {string} ownerRoot the owner package's root directory
 * @property {(spec: string) => void} onUnresolved records a specifier with no public home
 */

/**
 * @typedef {object} ImportTarget
 * @property {'inside'|'rewrite'|'unresolved'} kind
 * @property {string} [specifier] the public specifier to write
 * @property {string|null} [defaultAs] barrel name of the target's default export
 */

/**
 * Classify one relative import specifier.
 * @param {string} spec
 * @param {RewriteContext} ctx
 * @returns {ImportTarget}
 */
function classifyImport(spec, ctx) {
	const abs = path.resolve(ctx.fileDir, spec);
	// Anything under the directory being copied travels with it. This is the case
	// upstream's regex cannot express, and it is live: a nested family member
	// (`chat/composer/x/y.svelte`) reaches its own package with `../../types.js`.
	if (abs === ctx.copiedRoot || abs.startsWith(ctx.copiedRoot + path.sep)) {
		return { kind: 'inside' };
	}

	const surface = publicSurface(ctx.ownerRoot, ctx.ownerPackage);
	if (!surface) {
		return { kind: 'rewrite', specifier: collapseToOwner(spec, ctx.ownerPackage), defaultAs: null };
	}

	const resolved = resolveSpecifier(ctx.fileDir, spec) ?? (fs.existsSync(abs) ? abs : null);
	const relToSrc = resolved
		? path.relative(surface.srcRoot, resolved).split(path.sep).join('/')
		: null;

	if (relToSrc && !relToSrc.startsWith('..')) {
		for (const asset of surface.assets) {
			const hit = matchAssetPattern(asset.pattern, relToSrc);
			if (hit) return { kind: 'rewrite', specifier: `${ctx.ownerPackage}/${hit}`, defaultAs: null };
		}
		const mod = resolved ? surface.modules.get(resolved) : undefined;
		if (mod) {
			return { kind: 'rewrite', specifier: mod.specifier, defaultAs: mod.defaultAs };
		}
	}

	ctx.onUnresolved(spec);
	return { kind: 'unresolved' };
}

/**
 * Rewrite relative imports that point outside the copied directory so they use
 * the OWNER package's public entrypoints. Imports within the copied directory
 * are left untouched, and so is anything the owner does not publish — with the
 * specifier recorded through `ctx.onUnresolved` rather than rewritten into a
 * specifier that would not resolve.
 *
 * e.g. with ownerPackage '@astryx-svelte/core', copying `components/button/`:
 *      '../../i18n/use-translator.svelte.js' -> '@astryx-svelte/core/i18n'
 *      '../../styles/tokens.stylex.js'       -> '@astryx-svelte/core/theme'
 *      '../../base-props.js'                 -> '@astryx-svelte/core'
 *      import Icon from '../icon/icon.svelte'
 *        -> import { Icon } from '@astryx-svelte/core'
 *      './button.stylex.js'                  -> unchanged
 *
 * @param {string} content
 * @param {RewriteContext} ctx
 * @returns {string}
 */
export function rewriteImports(content, ctx) {
	// Pass 1 — default imports whose target is published under a name. The
	// statement shape changes, not just the specifier, so this runs first and the
	// specifier passes below never see these lines.
	let out = content.replace(DEFAULT_IMPORT_RE, (match, local, namedClause, quote, spec) => {
		const target = classifyImport(spec, ctx);
		if (target.kind !== 'rewrite' || !target.defaultAs || target.defaultAs === 'default') {
			return match;
		}
		const named = target.defaultAs === local ? local : `${target.defaultAs} as ${local}`;
		const extra = namedClause ? namedClause.replace(/^\s*,\s*\{/, '').replace(/\}\s*$/, '') : '';
		const clause = extra.trim() ? `{ ${named}, ${extra.trim()} }` : `{ ${named} }`;
		return `import ${clause} from ${quote}${target.specifier}${quote}`;
	});

	/** @param {string} spec @returns {string|null} */
	const specifierFor = (spec) => {
		const target = classifyImport(spec, ctx);
		return target.kind === 'rewrite' ? /** @type {string} */ (target.specifier) : null;
	};

	out = out.replace(FROM_SPECIFIER_RE, (m, prefix, spec, suffix) => {
		const next = specifierFor(spec);
		return next === null ? m : `${prefix}${next}${suffix}`;
	});
	out = out.replace(DYNAMIC_IMPORT_RE, (m, prefix, spec, suffix) => {
		const target = classifyImport(spec, ctx);
		if (target.kind !== 'rewrite') return m;
		// A dynamic import of a `.svelte` module is consumed as `.default`
		// (`{#await import('../tooltip/tooltip.svelte') then {default: Tooltip}}`,
		// which core does twice). The barrel publishes that default under a NAME, so
		// swapping the specifier alone would leave `.default` undefined at runtime —
		// and the await block's destructuring is out of this rewriter's reach.
		// Record it instead of writing something that resolves and then misbehaves.
		if (target.defaultAs) {
			ctx.onUnresolved(spec);
			return m;
		}
		return `${prefix}${target.specifier}${suffix}`;
	});
	return out;
}

/**
 * Build the maintainer feedback note for a swizzled component.
 * @param {string} component
 * @param {string|undefined} issuesUrl
 * @returns {{issuesUrl: string, ghCommand?: string} | null}
 */
function buildFeedback(component, issuesUrl) {
	if (!issuesUrl) return null;
	/** @type {{issuesUrl: string, ghCommand?: string}} */
	const feedback = { issuesUrl };
	const match = issuesUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/issues(?:\/new)?\/?$/);
	if (match && checkGhCli()) {
		const [, owner, repo] = match;
		feedback.ghCommand = `gh issue create --repo ${owner}/${repo} --title "[${component}] Swizzle feedback"`;
	}
	return feedback;
}

/**
 * Load the configured integrations + core issues URL for `cwd`, swallowing any
 * config errors so swizzle never hard-fails on a malformed/absent config.
 * @param {string} cwd
 * @returns {Promise<{loadedIntegrations: import('../../../foundation/integrations/integrations.mjs').LoadedIntegration[], issuesUrl: string|undefined, project: Project|null}>}
 */
async function loadConfigSafely(cwd) {
	try {
		const project = await Project.load(cwd);
		return {
			loadedIntegrations: project.loadedIntegrations,
			issuesUrl: project.config.issuesUrl,
			project
		};
	} catch {
		return { loadedIntegrations: [], issuesUrl: undefined, project: null };
	}
}

/**
 * Resolve the core source directory a component name names.
 *
 * Two steps, in order, and both are needed. The listing is checked before the
 * barrel because a directory name (`avatar`, what `swizzle --list` prints) is a
 * legitimate argument; the barrel then covers every export, including the 98
 * with no directory of their own. The listing is compared as an array rather
 * than probed with `existsSync`, which is case-insensitive on Windows and macOS
 * and would hand back a path whose spelling is not the directory's.
 *
 * @param {string} coreDir
 * @param {string[]} componentDirs directory names from listComponents
 * @param {string} name
 * @returns {string|null} absolute component directory, or null
 */
function resolveCoreComponentDir(coreDir, componentDirs, name) {
	const componentsRoot = path.join(coreDir, 'src', 'lib', 'components');
	if (componentDirs.includes(name)) return path.join(componentsRoot, name);

	const sourcePath = findComponentSource(coreDir, name);
	if (!sourcePath) return null;
	const rel = path.relative(componentsRoot, sourcePath);
	if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
	const topDir = rel.split(path.sep)[0];
	return componentDirs.includes(topDir) ? path.join(componentsRoot, topDir) : null;
}

/**
 * Build the set of OWNER packages that provide a component named `name` across
 * core + every loaded integration.
 * @param {string} coreDir
 * @param {string[]} componentDirs
 * @param {Array<{name: string, components?: string, issuesUrl?: string}>} loadedIntegrations
 * @param {string} name
 * @param {string|undefined} coreIssuesUrl
 * @returns {Array<{package: string, sourceDir: string|null, ownerPackage: string, ownerRoot: string, issuesUrl: string|undefined}>}
 */
function resolveOwners(coreDir, componentDirs, loadedIntegrations, name, coreIssuesUrl) {
	const owners = [];
	const coreComponentDir = resolveCoreComponentDir(coreDir, componentDirs, name);
	if (coreComponentDir) {
		owners.push({
			package: CORE_PACKAGE,
			sourceDir: coreComponentDir,
			ownerPackage: CORE_PACKAGE,
			ownerRoot: coreDir,
			issuesUrl: coreIssuesUrl || DEFAULT_ISSUES_URL
		});
	}
	for (const integration of loadedIntegrations) {
		const docPath = findIntegrationComponentDoc(integration, name);
		if (!docPath) continue;
		const sourcePath = findIntegrationComponentSource(integration, name);
		owners.push({
			package: integration.name,
			sourceDir: sourcePath ? path.dirname(sourcePath) : null,
			ownerPackage: integration.name,
			ownerRoot: /** @type {any} */ (integration).__packageDir ?? path.dirname(docPath),
			issuesUrl: integration.issuesUrl
		});
	}
	return owners;
}

/** @param {string} file */
function isExcludedFromCopy(file) {
	return file.includes('.test.') || file.includes('.doc.') || file === 'README.md';
}

/**
 * List every copyable file under `dir`, as paths relative to `dir` and joined
 * with '/' so the receipt is byte-identical on every platform.
 *
 * Recursive where upstream is flat — see adaptation 2 in the file header.
 * @param {string} dir
 * @returns {string[]}
 */
function collectFiles(dir) {
	/** @type {string[]} */
	const out = [];
	/** @param {string} current @param {string} prefix */
	const walk = (current, prefix) => {
		for (const entry of fs
			.readdirSync(current, { withFileTypes: true })
			.sort((a, b) => a.name.localeCompare(b.name))) {
			if (isExcludedFromCopy(entry.name)) continue;
			const abs = path.join(current, entry.name);
			const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
			if (entry.isDirectory()) walk(abs, rel);
			else if (entry.isFile()) out.push(rel);
		}
	};
	walk(dir, '');
	return out;
}

/**
 * Copy one component's source into the consumer project for customization,
 * rewriting escaping relative imports to the owner package's public entrypoints.
 *
 * @param {string} component component name (`Button`) or directory name (`button`)
 * @param {{cwd?: string, output?: string, package?: string, overwrite?: boolean}} [options]
 * @returns {Promise<import('../swizzle.type.mjs').SwizzleCopyResponse>}
 */
export async function swizzleCopy(component, options = {}) {
	const {
		cwd = process.cwd(),
		output = './components/astryx',
		package: pkg,
		overwrite = false
	} = options;

	const { coreDir, components } = resolveCore(cwd);

	// Upstream strips a leading `XDS` here. That prefix is rename residue from
	// before the Astryx rename — the same class `component/type.ts` carries and
	// TODO.md records — and core exports no `XDS*` name on either side, so the
	// strip is dropped rather than replicated. `swizzle XDSButton` is now an
	// unknown component with suggestions, not a silent alias.
	const name = component;

	// The name becomes a path segment in the output dir, so a name containing
	// `..` or a separator would escape the assertWithin(output) guard. Reject it
	// up front — a real component name is a bare identifier.
	try {
		sanitizeName(name, { label: 'component name' });
	} catch (err) {
		if (err instanceof PathSafetyError) {
			throw new AstryxError(err.message, [], ERROR_CODES.ERR_PATH_TRAVERSAL);
		}
		throw err;
	}

	const { loadedIntegrations, project } = await loadConfigSafely(cwd);
	const coreIssuesUrl = project ? project.issuesUrl({ package: CORE_PACKAGE }) : undefined;
	const allOwners = resolveOwners(coreDir, components, loadedIntegrations, name, coreIssuesUrl);

	if (allOwners.length === 0) {
		throw new AstryxError(
			`Component "${component}" not found.`,
			components.slice(0, 10).map((n) => ({ name: n })),
			ERROR_CODES.ERR_UNKNOWN_COMPONENT
		);
	}

	let owner;
	if (pkg) {
		owner = allOwners.find((o) => o.package === pkg);
		if (!owner) {
			throw new AstryxError(
				`Component "${name}" is not provided by package "${pkg}".`,
				allOwners.map((o) => ({ name: o.package, reason: 'provides this component' })),
				ERROR_CODES.ERR_UNKNOWN_COMPONENT
			);
		}
	} else if (allOwners.length > 1) {
		throw new AstryxError(
			`Component "${name}" is provided by multiple packages. Re-run with --package <pkg> to choose one.`,
			allOwners.map((o) => ({ name: o.package, reason: 'provides this component' })),
			ERROR_CODES.ERR_AMBIGUOUS_COMPONENT
		);
	} else {
		owner = allOwners[0];
	}

	if (!owner.sourceDir || !fs.existsSync(owner.sourceDir)) {
		throw new AstryxError(
			`No source found for "${name}" in package "${owner.package}".`,
			[],
			ERROR_CODES.ERR_NO_SOURCE
		);
	}

	const componentDir = owner.sourceDir;

	// Path-safety: --output must resolve inside cwd.
	let outputBase;
	try {
		outputBase = assertWithin(output, cwd, { label: 'output directory' });
	} catch (err) {
		if (err instanceof PathSafetyError) {
			throw new AstryxError(err.message, [], ERROR_CODES.ERR_PATH_TRAVERSAL);
		}
		throw err;
	}
	// The output is named for the directory that was copied, not for the name the
	// caller typed — `swizzle AvatarStatusDot` lands `avatar/`, because `avatar/`
	// is what it contains. See adaptation 1 in the file header.
	const dirName = path.basename(componentDir);
	const outputDir = path.join(outputBase, dirName);

	// Pre-flight overwrite check before any mkdir/writeFile.
	const sourceFiles = collectFiles(componentDir);
	const existingFiles = sourceFiles.filter((f) => fs.existsSync(path.join(outputDir, f)));
	if (existingFiles.length > 0 && !overwrite) {
		const relOutputForMsg = path.relative(cwd, outputDir) || '.';
		throw new AstryxError(
			`Refusing to overwrite ${existingFiles.length} existing file(s) in ${relOutputForMsg}/. ` +
				`Re-run with --overwrite (or -f) to replace them.`,
			[],
			ERROR_CODES.ERR_FILE_EXISTS
		);
	}

	/** @type {Set<string>} */
	const unresolved = new Set();
	let copied = 0;
	let usesStyleX = false;

	for (const rel of sourceFiles) {
		const srcPath = path.join(componentDir, ...rel.split('/'));
		const destPath = path.join(outputDir, ...rel.split('/'));
		fs.mkdirSync(path.dirname(destPath), { recursive: true });
		if (!REWRITABLE_EXT.test(rel)) {
			fs.copyFileSync(srcPath, destPath);
			copied++;
			continue;
		}
		let content = fs.readFileSync(srcPath, 'utf-8');
		content = rewriteImports(content, {
			ownerPackage: owner.ownerPackage,
			fileDir: path.dirname(srcPath),
			copiedRoot: componentDir,
			ownerRoot: owner.ownerRoot,
			onUnresolved: (spec) => unresolved.add(spec)
		});
		// StyleX can only be imported from a `.ts` module here — the bundler plugin
		// Babel-parses anything importing `@stylexjs/stylex` and would read Svelte
		// markup as JSX — so the `.svelte` files never match and scanning `.ts` is
		// exactly the right question, not an approximation of upstream's.
		if (/\.m?ts$/.test(rel) && content.includes('@stylexjs/stylex')) {
			usesStyleX = true;
		}
		fs.writeFileSync(destPath, content);
		copied++;
	}

	const relOutput = path.relative(cwd, outputDir);
	const feedback = buildFeedback(name, owner.issuesUrl);

	/** @type {import('../swizzle.type.mjs').SwizzleCopyResponse['data']} */
	const data = {
		component: name,
		package: owner.package,
		outputDir: relOutput,
		filesCopied: copied,
		files: sourceFiles,
		usesStyleX,
		unresolvedImports: [...unresolved].sort()
	};
	if (feedback) data.feedback = feedback;
	return { type: 'swizzle.copy', data };
}
