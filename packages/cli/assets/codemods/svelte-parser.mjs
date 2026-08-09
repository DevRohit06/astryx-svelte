/**
 * @file The codemod runner's parser + dependency gate — this port's replacement
 * for upstream's `ensure-jscodeshift.mjs` and for jscodeshift's role as the
 * thing that reads, and re-reads, a file.
 *
 * ## Why there is no jscodeshift here
 *
 * Upstream's runner is jscodeshift end to end: `j = jscodeshift.withParser(...)`
 * gives a transform its AST, and `j(result)` re-parses the transform's output as
 * the corruption guard. **jscodeshift cannot parse `.svelte`** — the file's top
 * level is markup, not a JavaScript program — so neither half survives the port.
 * The replacement splits the two jobs that were fused in `j`:
 *
 *   - **editing** is `magic-string`, handed to the transform through the api as
 *     {@link import('../../authoring/codemod/type').CodemodTransformApi.magicString};
 *   - **parsing** is `svelte/compiler`'s `parse`, handed over as `parseSvelte`
 *     and used by the runner itself for the re-parse guard.
 *
 * ## What can be validated, and what cannot
 *
 * `svelte/compiler` parses `.svelte`. It also, usefully, parses the *contents*
 * of a `<script>` tag with acorn (and with `acorn-typescript` when the tag says
 * `lang="ts"`), which is what {@link checkSyntax} exploits: a `.ts` / `.js` /
 * `.mjs` / `.cjs` file is syntax-checked by wrapping it in a synthetic script
 * tag and parsing that. Verified against Svelte 5's parser — `const x = ;`
 * throws `js_parse_error` through the wrapper, and a type annotation only parses
 * under `lang="ts"`.
 *
 * The wrapper has exactly one blind spot, and it fails **safe** in the wrong
 * direction rather than the dangerous one: a source containing the literal
 * `</script` would close the synthetic tag early and be reported as a parse
 * failure it is not. So that case is *skipped* rather than reported — a file
 * that cannot be checked is never a file that gets blocked.
 *
 * Anything else (`.css`, `.scss`, `.sass`, `.less`) is unchecked, exactly as
 * upstream leaves it unchecked: there is no parser for it, and inventing a
 * regex validator for CSS is the kind of guess this port does not make.
 */

import { execSync } from 'node:child_process';
import { walk } from 'zimmerframe';
import * as p from './term-log.mjs';
import { detectPackageManager } from '../../foundation/env/package-manager.mjs';

/**
 * Extensions {@link checkSyntax} can actually re-parse. Everything the scan
 * finds outside this set is transformed but not validated, which is the same
 * bargain upstream strikes for its stylesheet extensions.
 */
export const PARSEABLE_EXTENSIONS = ['.svelte', '.ts', '.js', '.mjs', '.cjs'];

/** Extensions whose script content needs the TypeScript-aware acorn plugin. */
const TS_EXTENSIONS = new Set(['.ts', '.mts', '.cts']);

/** @typedef {(source: string, options: {modern: true}) => unknown} SvelteParse */
/** @typedef {import('../../authoring/codemod/type').SvelteWalk} SvelteWalk */

/**
 * Both halves of the compiler surface this runner hands a transform, cached
 * together because they come from one dynamic `import()` and separate caches
 * would mean two.
 *
 * @type {{parse: SvelteParse, walk: SvelteWalk} | undefined}
 */
let cachedCompiler;

/**
 * Resolve the parse + walk pair a transform is handed, or null when `svelte` is
 * not installed. Never throws: the caller decides whether that is fatal.
 *
 * `parse` is `svelte/compiler`'s and stays behind the optional peer. **`walk` is
 * `zimmerframe`'s, imported directly**, and the indirection is not available:
 * `svelte/compiler` still *exports the name* `walk`, but it is a tombstone that
 * throws on call —
 *
 *     'svelte/compiler' no longer exports a `walk` utility —
 *     please import it directly from 'estree-walker' instead
 *
 * — so a `typeof mod.walk === 'function'` check passes and the transform then
 * fails at runtime. That is why `zimmerframe` is a declared dependency here
 * rather than something taken off the compiler namespace. It is 30 KB with no
 * dependencies of its own, and it is the walker **Svelte's own Svelte 4 -> 5
 * codemod uses**: `svelte/src/compiler/migrate/index.js` imports `magic-string`,
 * the parser and `zimmerframe`'s `walk`, which is exactly this trio. The error
 * message's `estree-walker` suggestion is for ESTree trees and is the wrong
 * advice for a Svelte template AST.
 *
 * @returns {Promise<{parse: SvelteParse, walk: SvelteWalk} | null>}
 */
export async function tryLoadSvelteCompiler() {
	if (cachedCompiler) return cachedCompiler;
	try {
		const mod = /** @type {any} */ (await import('svelte/compiler'));
		if (typeof mod.parse !== 'function') return null;
		cachedCompiler = { parse: mod.parse, walk: /** @type {SvelteWalk} */ (walk) };
	} catch {
		return null;
	}
	return cachedCompiler ?? null;
}

/**
 * Resolve `svelte/compiler`'s parser alone, or null when `svelte` is not
 * installed. Kept as its own export because validation needs only the parser —
 * `checkSyntax` runs on every file a codemod touches, including the `.ts` and
 * `.js` ones a walker would have nothing to walk.
 *
 * @returns {Promise<SvelteParse | null>}
 */
export async function tryLoadSvelteParse() {
	return (await tryLoadSvelteCompiler())?.parse ?? null;
}

/**
 * Ensure the codemod parser is available before any transform runs.
 *
 * The shape is upstream's `ensureJscodeshift` — check, then either auto-install
 * on an explicit `--install-deps` opt-in or fail fast with guidance, never
 * prompt. Only the package differs: `svelte` is this runner's parser, and it is
 * an optional peer dependency for exactly the reason jscodeshift was a lazy one
 * upstream — it is needed by `upgrade` and by nothing else on the CLI's import
 * graph.
 *
 * @param {object} [options]
 * @param {boolean} [options.installDeps] Auto-install without prompting.
 * @param {boolean} [options.silent] Suppress human-facing output (for --json).
 * @returns {Promise<boolean>}
 */
export async function ensureSvelteCompiler({ installDeps = false, silent = false } = {}) {
	const log = silent ? { warn() {}, error() {}, step() {}, success() {} } : p.log;
	if (await tryLoadSvelteParse()) return true;

	log.warn('svelte is required to read and validate codemod output but is not installed.');

	if (installDeps) {
		// Explicit opt-in — install without prompting.
		const installed = installSvelte(silent);
		if (!installed) return false;
		// The cache is only populated on success, so this re-import is the check.
		return (await tryLoadSvelteParse()) != null;
	}

	// Non-interactive by default: fail fast with a helpful message instead of
	// prompting (the CLI never blocks on a TTY).
	log.error('Cannot run codemods without svelte. Use --install-deps to auto-install.');
	return false;
}

/**
 * @param {boolean} [silent]
 * @returns {boolean}
 */
function installSvelte(silent = false) {
	const log = silent ? { step() {}, success() {}, error() {} } : p.log;
	const pm = detectPackageManager();
	const cmds = {
		yarn: 'yarn add --dev svelte',
		pnpm: 'pnpm add -D svelte',
		bun: 'bun add -D svelte',
		npm: 'npm install --save-dev svelte',
		npx: 'npm install --save-dev svelte'
	};
	const cmd = cmds[/** @type {keyof typeof cmds} */ (pm)] || cmds.npm;

	try {
		log.step(`Installing svelte via ${pm}...`);
		execSync(cmd, { stdio: 'pipe' });
		log.success('svelte installed.');
		return true;
	} catch (err) {
		log.error(`Failed to install svelte: ${/** @type {any} */ (err).message}`);
		return false;
	}
}

/**
 * Wrap non-Svelte source in a synthetic `<script>` so `svelte/compiler` will
 * run acorn over it. Returns null when the source contains a `</script`
 * sequence, which would terminate the tag early and produce a parse failure
 * that says nothing about the source.
 * @param {string} source
 * @param {string} ext
 * @returns {string | null}
 */
function wrapAsScript(source, ext) {
	if (/<\/script/i.test(source)) return null;
	const lang = TS_EXTENSIONS.has(ext) ? ' lang="ts"' : '';
	return `<script${lang}>\n${source}\n</script>`;
}

/**
 * Re-parse transformed source. This is the port's half of upstream's `j(result)`
 * guard: a codemod that produced something the compiler can no longer read must
 * never reach disk.
 *
 * @param {string} source
 * @param {string} ext file extension, e.g. `.svelte`
 * @param {SvelteParse} parse
 * @returns {{checked: boolean, error?: string}} `checked: false` means no parser
 *   applies to this extension — not that the source is good.
 */
export function checkSyntax(source, ext, parse) {
	if (!PARSEABLE_EXTENSIONS.includes(ext)) return { checked: false };

	const text = ext === '.svelte' ? source : wrapAsScript(source, ext);
	if (text == null) return { checked: false };

	try {
		parse(text, { modern: true });
		return { checked: true };
	} catch (err) {
		return { checked: true, error: String(/** @type {any} */ (err)?.message ?? err) };
	}
}
