/**
 * @file Assert that `@astryx-svelte/core` publishes the sources this CLI reads.
 *
 * Three commands read core's **source**, not its build output: `component
 * --source` prints it, `swizzle` copies it into the user's project, and the
 * agent-docs writer quotes it. All three resolve core through
 * `findCoreDir()`, which in an installed project lands on
 * `node_modules/@astryx-svelte/core` — so they work only if the published
 * tarball actually contains `src/`.
 *
 * Nothing in the type system says it does. `package.json#files` is a plain
 * array of globs; trimming it to `["dist"]` is a one-line edit that looks like
 * a size optimisation, passes every existing check, and breaks those three
 * commands **only for installed users** — never in this monorepo, where
 * `findCoreDir` finds `packages/core` on disk and reads the working tree. That
 * is the exact shape of a bug that ships.
 *
 * So this asserts against what npm would really publish (`npm pack
 * --dry-run`), which honours `files`, its negations and `.npmignore` together,
 * rather than against the `files` array read literally — the array is the
 * input to the question, not the answer.
 *
 * Runs as `pnpm -F @astryx-svelte/cli test:core-src`, wired into the package's
 * `test` script the way `packages/core` wires `test:parity` and
 * `packages/themes/neutral` wires `test:parity` / `test:icons`.
 *
 * Requires core to have been built (`pnpm -r build`) — `dist/` is packed too,
 * and this deliberately runs `npm pack` with `--ignore-scripts` rather than
 * letting it fire core's `prepack` and rebuild the package as a side effect of
 * a test.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { findCoreDir, listComponents } from '../foundation/fs/paths.mjs';

/**
 * @param {string} msg
 * @returns {never} declared so every `fail(...)` call site narrows what follows
 *   — without it `core` stays `string | null` for the rest of the file.
 */
function fail(msg) {
	console.error(`\n  core-src assertion FAILED\n\n${msg}\n`);
	process.exit(1);
}

const coreDir = findCoreDir(process.cwd());
if (!coreDir) {
	// Loudly, not silently — the same rule both fidelity oracles follow. A
	// missing core must fail the run, never turn the check into a no-op that
	// still reports green.
	fail(
		'Could not locate @astryx-svelte/core.\n' +
			'findCoreDir() walked up from ' +
			process.cwd() +
			' and found neither packages/core nor node_modules/@astryx-svelte/core.'
	);
}

// Re-bound after the null check so the narrowing survives into `walk()` below.
// TypeScript hoists a function declaration above the guard, so inside its body
// `coreDir` is still `string | null` however the guard is written.
const core = coreDir;

if (!fs.existsSync(path.join(core, 'dist'))) {
	fail(`${core} has no dist/. Run \`pnpm -r build\` before this check.`);
}

const PACK_ARGS = ['pack', '--dry-run', '--json', '--ignore-scripts'];
// Inlined at both call sites rather than hoisted into one shared object:
// `ExecFileSyncOptions` and `ExecSyncOptions` disagree on `shell`
// (`string | boolean` vs `string`), so a single annotated constant cannot
// satisfy both overloads and an un-annotated one satisfies neither.
const RUN = /** @type {const} */ ({
	cwd: core,
	encoding: 'utf-8',
	maxBuffer: 64 * 1024 * 1024
});

/**
 * Two spawn paths, for one Windows-specific reason: npm there is a `.cmd`
 * shim, and since the CVE-2024-27980 fix Node refuses to spawn a `.cmd`
 * without a shell — `spawnSync npm.cmd EINVAL`, with no hint as to why.
 * Passing `shell: true` to `execFileSync` fixes that but earns DEP0190,
 * because an args array through a shell is concatenated rather than escaped.
 *
 * So: POSIX takes `execFileSync` with an args array and no shell at all, which
 * is the form with no injection surface; Windows takes a single command string
 * built only from the module-level literals above. Nothing user-supplied,
 * nothing from argv and nothing from the filesystem reaches either — `cwd`
 * carries the only variable, and it is passed as an option, never interpolated.
 *
 * @returns {string}
 */
function runNpmPack() {
	const stdio = /** @type {const} */ (['ignore', 'pipe', 'ignore']);
	if (process.platform !== 'win32') {
		return execFileSync('npm', PACK_ARGS, { ...RUN, stdio: [...stdio] });
	}
	return execSync(`npm ${PACK_ARGS.join(' ')}`, { ...RUN, stdio: [...stdio] });
}

/** @type {Array<{files?: Array<{path: string}>}>} */
let packed;
try {
	packed = JSON.parse(runNpmPack());
} catch (err) {
	fail(
		`\`npm pack --dry-run\` failed in ${core}:\n` +
			(err instanceof Error ? err.message : String(err))
	);
}

/** Every path npm would publish, with forward slashes (npm normalises these). */
const files = new Set((packed[0]?.files ?? []).map((f) => f.path));
if (files.size === 0) {
	fail(`\`npm pack --dry-run\` reported no files for ${core}.`);
}

/** @type {string[]} */
const problems = [];

// 1. Every source file in the working tree's `src/lib` must be in the tarball.
//
//    Stated as a set comparison rather than as "each component dir ships
//    `<name>.svelte`", because that second form is simply false: `chat/`,
//    `nav-menu/` and `resizable/` are family directories whose members are all
//    differently named, and `nav-item/` holds a single shared `.stylex.ts` and
//    no component at all. A rule that assumes a same-named root file fails on
//    four directories today and would fail on every family added later.
//
//    Test and spec files are excluded because `files` deliberately excludes
//    them — asserting they ship would invert the check.
const SKIP = /\.(test|spec)\.[^/]+$/;
/** @param {string} dir @returns {string[]} paths relative to core, slash-separated */
function walk(dir) {
	/** @type {string[]} */
	const out = [];
	for (const entry of fs.readdirSync(path.join(core, dir), { withFileTypes: true })) {
		const rel = `${dir}/${entry.name}`;
		if (entry.isDirectory()) out.push(...walk(rel));
		else if (!SKIP.test(rel)) out.push(rel);
	}
	return out;
}

const components = listComponents(core);
if (components.length === 0) {
	fail(`listComponents(${core}) found no component directories — the layout has moved.`);
}

const onDisk = walk('src/lib');
const notPacked = onDisk.filter((p) => !files.has(p));
if (notPacked.length > 0) {
	problems.push(
		`${notPacked.length} of ${onDisk.length} files under src/lib are not in the tarball:\n` +
			notPacked
				.slice(0, 15)
				.map((p) => `    ${p}`)
				.join('\n') +
			(notPacked.length > 15 ? `\n    … and ${notPacked.length - 15} more` : '')
	);
}

// 2. The barrel and the base props module — agent-docs and `component` resolve
//    import paths through them.
for (const required of ['src/lib/index.ts', 'src/lib/base-props.ts']) {
	if (!files.has(required)) problems.push(`missing from the tarball: ${required}`);
}

// 3. dist/ must ship too. The docs pipeline reads prop *types* out of
//    `dist/**/*.d.ts` (CLAUDE.md, "The docs site"), and `component` will do the
//    same rather than re-deriving types from source.
for (const required of ['dist/index.js', 'dist/index.d.ts']) {
	if (!files.has(required)) problems.push(`missing from the tarball: ${required}`);
}

// 4. The negations in `files` must still hold. A test file inside the tarball
//    means the denylist has drifted — the same failure `packages/core`'s
//    lint rule guards against on the other side.
const leakedTests = [...files].filter((p) => /\.(test|spec)\.[^/]+$/.test(p));
if (leakedTests.length > 0) {
	problems.push(
		`${leakedTests.length} test/spec file(s) leaked into the tarball:\n` +
			leakedTests
				.slice(0, 10)
				.map((p) => `    ${p}`)
				.join('\n') +
			(leakedTests.length > 10 ? `\n    … and ${leakedTests.length - 10} more` : '')
	);
}

// 5. `src/` is published for `swizzle` and friends, which read `src/lib` and
//    nothing else. Everything beside it under `src/` is this repo's own
//    workbench, and it shipped for the whole pre-release life of the package:
//    248 test fixtures (none matching the `*.test.*` denylist above, so rule 4
//    saw nothing) and 35 demo routes, one of which imports
//    `../../../themes/neutral/dist/` — a relative path that resolves inside
//    this monorepo and points outside the tarball anywhere else.
const NON_LIB_SRC = /^src\/(?!lib\/)/;
const leakedNonLib = [...files].filter((p) => NON_LIB_SRC.test(p) && !p.endsWith('.d.ts'));
if (leakedNonLib.length > 0) {
	problems.push(
		`${leakedNonLib.length} file(s) under src/ but outside src/lib leaked into the tarball:\n` +
			leakedNonLib
				.slice(0, 10)
				.map((p) => `    ${p}`)
				.join('\n') +
			(leakedNonLib.length > 10 ? `\n    … and ${leakedNonLib.length - 10} more` : '')
	);
}

if (problems.length > 0) {
	fail(
		problems.map((p) => `  - ${p}`).join('\n\n') +
			'\n\n' +
			'  `component --source`, `swizzle` and the agent-docs writer read these\n' +
			"  paths out of an installed @astryx-svelte/core. Fix packages/core's\n" +
			'  `files` field rather than working around it here.'
	);
}

const srcCount = [...files].filter((p) => p.startsWith('src/')).length;
console.log(
	`  core ships src/  ${components.length} components, ${srcCount} src files, ` +
		`${files.size} total — @astryx-svelte/core`
);
