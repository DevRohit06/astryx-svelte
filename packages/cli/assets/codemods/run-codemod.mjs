/**
 * @file Shared codemod execution primitives.
 *
 * Both the core registry runner (`runner.mjs` / `api/upgrade`) and the
 * integration runner (`integration-runner.mjs`) execute codemods that follow
 * the unified file-based contract:
 *
 *   (file, api) => string | null | undefined
 *
 * where `file` is `{path, source}` and `api` is
 * `{magicString, parseSvelte, walk, jscodeshift, stats, report}`. Config codemods
 * target the consumer's astryx-svelte.config.* file; code codemods are applied
 * to source files discovered under `--path`, filtered by each codemod's
 * `fileExtensions`.
 *
 * A codemod ENTRY is normalized to a single shape across both callers:
 *
 *   {id, type: 'code' | 'config', codemod: {title, transform, fileExtensions?,
 *    isOptional?}, package, version}
 *
 * Integration discovery emits this shape directly. The core registry stores
 * entries as `{name, transform, meta}`; `runner.mjs` normalizes those to this
 * shape at the boundary (see `runner.mjs`).
 *
 * Both kinds reuse the shared output validation from runner.mjs and surface a
 * transform throw as an error (strictness contract).
 *
 * ## The api a transform receives, and why it is not jscodeshift's
 *
 * Upstream hands each transform `j = jscodeshift.withParser(parser)`. Here it
 * gets `magicString` (the `magic-string` class), `parseSvelte`
 * (`svelte/compiler`'s parser) and `walk` (`zimmerframe`'s), which is the trio
 * that replaces it — the same three Svelte's own migration codemod uses: locate with
 * the parser's byte offsets, splice with `magic-string`, return
 * `s.toString()`. `api.jscodeshift` is present and `undefined` — the field is
 * part of upstream's published authoring contract and removing it would change
 * the shape a third-party codemod is written against, but nothing here
 * populates it. See `svelte-parser.mjs` for what the parser can and cannot read.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import MagicString from 'magic-string';
import * as p from './term-log.mjs';
import { findConfigPath } from '../../foundation/config/project.mjs';
import { validateOutput, IGNORED_DIRS } from './runner.mjs';

/**
 * Extensions a code codemod applies to when it declares no `fileExtensions`.
 *
 * Upstream's default is `['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs']`. This
 * port's is the Svelte spelling of the same idea: `.svelte` first, then the
 * plain-script extensions a SvelteKit project actually contains. `.tsx` / `.jsx`
 * are dropped from the *default* — no Svelte project has them — but they stay in
 * the runner's SCAN set, so a codemod that opts into them by declaring
 * `fileExtensions` still reaches them instead of silently matching nothing.
 */
export const DEFAULT_CODE_EXTENSIONS = ['.svelte', '.ts', '.js', '.mjs', '.cjs'];

/**
 * Recursively find candidate source files in a directory.
 * @param {string} dir
 * @returns {string[]}
 */
export function findSourceFiles(dir) {
	/** @type {string[]} */
	const results = [];
	/** @param {string} currentDir */
	function walk(currentDir) {
		/** @type {import('node:fs').Dirent[]} */
		let entries;
		try {
			entries = fs.readdirSync(currentDir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			const fullPath = path.join(currentDir, entry.name);
			// Never follow symlinks — writing through one would rewrite its target
			// outside the scan tree (e.g. into node_modules or anywhere on disk).
			if (entry.isSymbolicLink()) continue;
			if (entry.isDirectory()) {
				if (IGNORED_DIRS.has(entry.name)) continue;
				walk(fullPath);
			} else {
				results.push(fullPath);
			}
		}
	}
	walk(dir);
	return results.sort();
}

/**
 * No-op log surface for silent (`--json`) mode.
 * @param {boolean} silent
 * @returns {import('../../authoring/codemod/type').CliLog}
 */
export function makeLog(silent) {
	return silent
		? { step() {}, info() {}, success() {}, warn() {}, error() {}, message() {} }
		: p.log;
}

/**
 * Build the `api` argument a transform receives. One place, so the core runner
 * and the integration runner cannot hand out different surfaces.
 *
 * `parse` and `walk` arrive together from `tryLoadSvelteCompiler`, and both are
 * `svelte/compiler`'s. Pairing them with `magic-string` is not this port's
 * invention: it is what Svelte's own Svelte 4 -> 5 codemod does
 * (`svelte/src/compiler/migrate/index.js` imports exactly these three), which
 * is the strongest available evidence that splitting jscodeshift this way is
 * the right shape rather than merely the only one available.
 *
 * @param {import('./svelte-parser.mjs').SvelteParse} parse
 * @param {import('../../authoring/codemod/type').SvelteWalk} walk
 * @returns {import('../../authoring/codemod/type').CodemodTransformApi}
 */
export function createCodemodApi(parse, walk) {
	return {
		magicString: MagicString,
		parseSvelte: parse,
		walk,
		// Upstream's field, deliberately unpopulated — see the file header.
		jscodeshift: undefined,
		stats: () => {},
		report: () => {}
	};
}

/**
 * Apply a config codemod to the consumer's astryx-svelte.config.* file.
 *
 * @param {import('../../authoring/codemod/type').CodemodEntry} entry normalized codemod entry {id, codemod, package}
 * @param {{apply: boolean, log: import('../../authoring/codemod/type').CliLog, parse: import('./svelte-parser.mjs').SvelteParse, walk: import('../../authoring/codemod/type').SvelteWalk}} ctx
 * @returns {import('../../authoring/codemod/type').CodemodRunResult}
 */
export function runConfigCodemod(entry, { apply, log, parse, walk }) {
	const { codemod, id, package: pkg } = entry;
	const name = `${pkg}:${id}`;
	// findConfigPath throws when multiple astryx-svelte.config.* files coexist.
	// Config codemods run FIRST (before the strict project loader), so an uncaught
	// throw here aborts the entire `astryx-svelte upgrade` with an un-coded error —
	// breaking the per-codemod isolation every other failure path honors. Degrade
	// it to a structured error so the run continues and reports it.
	/** @type {string | null} */
	let configPath;
	try {
		configPath = findConfigPath(process.cwd());
	} catch (err) {
		const message = /** @type {any} */ (err).message;
		log.error(`    ✗ astryx-svelte.config.* — ${message}`);
		return {
			filesChanged: 0,
			writtenFiles: [],
			errors: [{ file: 'astryx-svelte.config.*', codemod: name, error: message }]
		};
	}
	if (!configPath) {
		log.info(`  ${codemod.title} — no astryx-svelte.config.* found; skipping.`);
		return { filesChanged: 0, writtenFiles: [], errors: [] };
	}

	const relativePath = path.relative(process.cwd(), configPath);
	try {
		const source = fs.readFileSync(configPath, 'utf-8');
		const ext = path.extname(configPath);
		const result = codemod.transform({ source, path: configPath }, createCodemodApi(parse, walk));

		if (result == null || result === source) {
			return { filesChanged: 0, writtenFiles: [], errors: [] };
		}

		const validation = validateOutput(result, source, { parse, ext });
		if (!validation.valid) {
			log.error(`    ✗ ${relativePath} — ${validation.reason}`);
			return {
				filesChanged: 0,
				writtenFiles: [],
				errors: [{ file: relativePath, codemod: name, error: validation.reason }]
			};
		}

		if (apply) {
			fs.writeFileSync(configPath, result, 'utf-8');
			log.success(`    ✓ ${relativePath}`);
		} else {
			log.warn(`    ~ ${relativePath} (would change)`);
		}
		return {
			filesChanged: 1,
			writtenFiles: apply ? [configPath] : [],
			errors: []
		};
	} catch (err) {
		const message = /** @type {any} */ (err).message;
		log.error(`    ✗ ${relativePath} — ${message}`);
		return {
			filesChanged: 0,
			writtenFiles: [],
			errors: [{ file: relativePath, codemod: name, error: message }]
		};
	}
}

/**
 * Apply a code codemod to discovered source files.
 *
 * @param {import('../../authoring/codemod/type').CodemodEntry} entry normalized codemod entry {id, codemod, package}
 * @param {string[]} files
 * @param {{apply: boolean, log: import('../../authoring/codemod/type').CliLog, parse: import('./svelte-parser.mjs').SvelteParse, walk: import('../../authoring/codemod/type').SvelteWalk}} ctx
 * @returns {import('../../authoring/codemod/type').CodemodRunResult}
 */
export function runCodeCodemod(entry, files, { apply, log, parse, walk }) {
	const { codemod, id, package: pkg } = entry;
	const name = `${pkg}:${id}`;
	const extensions = new Set(codemod.fileExtensions ?? DEFAULT_CODE_EXTENSIONS);

	let filesChanged = 0;
	/** @type {string[]} */
	const writtenFiles = [];
	/** @type {Array<{file: string, codemod: string, error: string}>} */
	const errors = [];

	for (const filePath of files) {
		const ext = path.extname(filePath);
		if (!extensions.has(ext)) continue;

		const relativePath = path.relative(process.cwd(), filePath);
		try {
			const source = fs.readFileSync(filePath, 'utf-8');
			const result = codemod.transform({ source, path: filePath }, createCodemodApi(parse, walk));

			if (result == null || result === source) continue;

			const validation = validateOutput(result, source, { parse, ext });
			if (!validation.valid) {
				log.error(`    ✗ ${relativePath} — ${validation.reason}`);
				errors.push({
					file: relativePath,
					codemod: name,
					error: validation.reason
				});
				continue;
			}

			filesChanged++;
			if (apply) {
				fs.writeFileSync(filePath, result, 'utf-8');
				writtenFiles.push(filePath);
				log.success(`    ✓ ${relativePath}`);
			} else {
				log.warn(`    ~ ${relativePath} (would change)`);
			}
		} catch (err) {
			const message = /** @type {any} */ (err).message;
			log.error(`    ✗ ${relativePath} — ${message}`);
			errors.push({ file: relativePath, codemod: name, error: message });
		}
	}

	return { filesChanged, writtenFiles, errors };
}
