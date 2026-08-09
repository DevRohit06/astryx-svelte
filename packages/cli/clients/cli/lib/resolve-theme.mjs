/**
 * @file Theme resolution — resolve a theme from config or environment
 *
 * Resolution sources (in priority order):
 * 1. ASTRYX_THEME environment variable
 * 2. astryx.theme field in package.json
 *
 * Resolution strategy for the value:
 * - Starts with `.` or `/` → file path relative to cwd
 * - Starts with `@` → npm package (import)
 * - Otherwise → try `@astryx-svelte/theme-{name}`, then try as bare package name
 *
 * Returns the theme object's `variants` and `fonts` if available,
 * or null if no theme is configured or found.
 *
 * ## Why this is async, and why it reaches for `<pkg>/tokens`
 *
 * Upstream loads a theme with `createRequire()`. Ported verbatim that returns
 * `null` for **every theme this port ships**, and silently — the bare `catch`
 * below turns a resolution failure into "no theme configured". Both loaders
 * fail, for two unrelated reasons, each reproduced rather than reasoned about:
 *
 * - `require()` → `ERR_PACKAGE_PATH_NOT_EXPORTED`. A theme package's
 *   `exports["."]` declares `types`, `svelte` and `import` and no `require`
 *   condition, so resolution fails before Node's require(esm) support is
 *   reached.
 * - `await import()` → `ERR_UNKNOWN_FILE_EXTENSION`. The built entry's first
 *   statement is `import { neutralIconRegistry } from './icons.svelte'`, so the
 *   token object is only reachable through a module plain Node cannot parse.
 *   All eight themes do this; it is the icon-registry design, not one theme's
 *   accident. Upstream's themes are plain token objects and have no analogue.
 *
 * The answer is the `./tokens` subpath every `packages/themes/*` package
 * already publishes for exactly this purpose: the same theme object without
 * `icons`, in a module that imports nothing. It is tried first for a package
 * specifier and the main entry is the fallback, so a third-party theme that
 * ships only `.` still resolves. Nothing here needs the icon registry —
 * `resolveTheme` reads `name`, `variants` and `fonts`.
 *
 * `import()` is async, so `resolveTheme` is too, and its one caller
 * (`clients/cli/commands/component/index.mjs`) awaits it.
 *
 * One deliberate divergence beyond the loader: the "could not resolve"
 * warnings carry the underlying error code. Upstream's message names only the
 * specifier, which is why the two failures above went unnoticed for a whole
 * slice — a package that resolves but throws on evaluation is indistinguishable
 * from one that is not installed.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { importUserModule } from '../../../foundation/fs/module-loader.mjs';

/** The scope this port's themes publish under; the bare-name convention below. */
const THEME_SCOPE = '@astryx-svelte/theme-';

/**
 * Extensions a bare, extensionless file specifier may resolve to, in the order
 * `require()` would have tried them. `.ts` is first because a SvelteKit project
 * is TypeScript by default and `importUserModule` routes it through jiti.
 */
const FILE_EXTENSIONS = ['.ts', '.mjs', '.js', '.cjs'];

/**
 * Resolve a file specifier to an on-disk path, adding an extension or an
 * `index.*` the way `require()` would. `null` when nothing exists.
 * @param {string} resolved absolute path, possibly without an extension
 * @returns {string | null}
 */
function resolveFileCandidate(resolved) {
	if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) return resolved;
	for (const ext of FILE_EXTENSIONS) {
		if (fs.existsSync(resolved + ext)) return resolved + ext;
	}
	for (const ext of FILE_EXTENSIONS) {
		const indexFile = path.join(resolved, `index${ext}`);
		if (fs.existsSync(indexFile)) return indexFile;
	}
	return null;
}

/**
 * The outcome of one load attempt. `mod` is null on failure and `error` carries
 * why, so the caller's warning can name it (see the header).
 * @typedef {{mod: unknown, error: Error | null}} LoadResult
 */

/**
 * Try to load a module, returning the module namespace.
 * Returns `{mod: null, error}` if the module cannot be found or fails to
 * evaluate.
 * @param {string} specifier
 * @param {string} cwd
 * @returns {Promise<LoadResult>}
 */
async function tryLoadModule(specifier, cwd) {
	// For relative/absolute paths, resolve against cwd
	if (specifier.startsWith('.') || specifier.startsWith('/')) {
		const resolved = resolveFileCandidate(path.resolve(cwd, specifier));
		if (!resolved) {
			return { mod: null, error: new Error(`no such file: ${path.resolve(cwd, specifier)}`) };
		}
		try {
			return { mod: await importUserModule(resolved), error: null };
		} catch (err) {
			return { mod: null, error: /** @type {Error} */ (err) };
		}
	}

	// For package specifiers, prefer the plain-data `./tokens` entry (see the
	// header) and fall back to the package's main entry.
	/** @type {Error | null} */
	let firstError = null;
	for (const target of [`${specifier}/tokens`, specifier]) {
		try {
			return { mod: await import(target), error: null };
		} catch (err) {
			firstError ??= /** @type {Error} */ (err);
		}
	}
	return { mod: null, error: firstError };
}

/**
 * Render a load failure for a warning line: the error's `code` when it has one
 * (`ERR_MODULE_NOT_FOUND`, `ERR_UNKNOWN_FILE_EXTENSION`), else its message.
 * @param {Error | null} error
 * @returns {string}
 */
function describeLoadError(error) {
	if (!error) return '';
	const code = /** @type {NodeJS.ErrnoException} */ (error).code;
	return ` (${code || error.message})`;
}

/**
 * Extract theme data from a loaded module.
 * Handles both `module.default` and direct `module` patterns,
 * as well as named exports like `module.theme` or `module.{name}Theme`.
 * @param {any} mod
 * @returns {any}
 */
function extractTheme(mod) {
	if (!mod || typeof mod !== 'object') return null;

	// Check default export
	const obj = mod.default || mod;

	// If it looks like a theme (has name + tokens or variants), use it directly
	if (obj.name && (obj.tokens || obj.variants)) {
		return obj;
	}

	// Check for a `theme` named export
	if (mod.theme && typeof mod.theme === 'object' && mod.theme.name) {
		return mod.theme;
	}

	// Check for any export ending in 'Theme'
	for (const key of Object.keys(mod)) {
		if (key.endsWith('Theme') && typeof mod[key] === 'object' && mod[key]?.name) {
			return mod[key];
		}
	}

	return null;
}

/**
 * Resolve the active Astryx theme from config and environment.
 *
 * @param {string} [cwd] - Working directory (defaults to process.cwd())
 * @returns {Promise<{ variants?: Record<string, string[]>, fonts?: Record<string, string>, name?: string } | null>}
 */
export async function resolveTheme(cwd = process.cwd()) {
	// 1. Determine theme specifier
	let specifier = process.env.ASTRYX_THEME || null;

	if (!specifier) {
		// Read from package.json
		const pkgPath = path.join(cwd, 'package.json');
		if (fs.existsSync(pkgPath)) {
			try {
				const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
				specifier = pkg.astryx?.theme || null;
			} catch {
				// Ignore parse errors
			}
		}
	}

	// `astryx.theme` (package.json) and ASTRYX_THEME are user/third-party
	// controlled and may be any value. Anything that isn't a usable non-empty
	// string means "no theme" — degrade to null rather than crashing on
	// specifier.startsWith(...) below. (Subsumes the empty-string case.)
	if (typeof specifier !== 'string' || specifier.length === 0) {
		return null;
	}

	// 2. Resolve the specifier to a module
	/** @type {LoadResult} */
	let loaded;

	if (specifier.startsWith('.') || specifier.startsWith('/')) {
		// File path
		loaded = await tryLoadModule(specifier, cwd);
		if (!loaded.mod) {
			console.warn(
				`⚠ theme: could not resolve file "${specifier}" from ${cwd}` +
					describeLoadError(loaded.error)
			);
			return null;
		}
	} else if (specifier.startsWith('@')) {
		// Scoped package
		loaded = await tryLoadModule(specifier, cwd);
		if (!loaded.mod) {
			console.warn(
				`⚠ theme: could not resolve package "${specifier}"` + describeLoadError(loaded.error)
			);
			return null;
		}
	} else {
		// Convention: try @astryx-svelte/theme-{name} first, then bare package
		loaded = await tryLoadModule(`${THEME_SCOPE}${specifier}`, cwd);
		if (!loaded.mod) {
			loaded = await tryLoadModule(specifier, cwd);
		}
		if (!loaded.mod) {
			console.warn(
				`⚠ theme: could not resolve "${specifier}" (tried ${THEME_SCOPE}${specifier} and ${specifier})` +
					describeLoadError(loaded.error)
			);
			return null;
		}
	}

	// 3. Extract theme data
	const theme = extractTheme(loaded.mod);
	if (!theme) {
		console.warn(`⚠ theme: loaded "${specifier}" but could not find a theme object`);
		return null;
	}

	return {
		name: theme.name || null,
		variants: theme.variants || null,
		fonts: theme.fonts || null
	};
}
