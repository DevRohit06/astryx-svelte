/**
 * @file Codemod runner — the `magic-string` + `svelte/compiler` engine.
 *
 * Orchestrates running transforms against source files: dry-run previews, file
 * writing, summary reporting, and output validation so a broken transform never
 * reaches disk.
 *
 * ## This runner is written, not translated
 *
 * Upstream's runner is jscodeshift end to end, and jscodeshift **cannot parse
 * `.svelte`** — the file's top level is markup, so `j(source)` fails on the
 * first tag. There is no adapter that fixes that; the tool is wrong for the
 * input. So the two jobs jscodeshift did are split (see `svelte-parser.mjs`):
 * `magic-string` edits, `svelte/compiler` parses. Everything *around* those two
 * — the scan, the per-file isolation, the dry-run/apply split, the optional-
 * codemod deferral, the summary lines, the `{totalFilesChanged, …}` receipt —
 * is upstream's and unchanged, because none of it depended on which parser sat
 * in the middle.
 *
 * Three deliberate divergences, each of which would be a silent behaviour change
 * if it went unrecorded:
 *
 * 1. **`fixDirectiveCorruption` is dropped.** Upstream applies it to every
 *    transform result: a regex that collapses `'use client';;` back to
 *    `'use client';`. Its own comment names the cause — "jscodeshift has a known
 *    bug where `toSource()` double-prints the semicolon on directive
 *    prologues". There is no `toSource()` here. `magic-string` splices the
 *    original buffer rather than re-printing an AST, so the defect has no way to
 *    occur, and keeping the fix would mean silently rewriting output a transform
 *    deliberately produced.
 * 2. **`.svelte-kit` joins `IGNORED_DIRS`.** SvelteKit's generated tree contains
 *    copies of route source; rewriting those is rewriting build output, which is
 *    exactly what the existing entries exist to prevent. `.next` is kept rather
 *    than swapped out, on the same reasoning slice 2 used for `isFilePathArg`:
 *    the set only decides *skip or descend*, so a stale entry costs nothing and
 *    removing one can only lose coverage.
 * 3. **`.svelte` joins the scan extensions and `.tsx` / `.jsx` stay.** A
 *    `fileExtensions`-declaring codemod filters the list this scan produces, so
 *    an extension missing here makes such a codemod match *nothing*, silently.
 *    Adding is free; pruning is not.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as p from './term-log.mjs';
import { humanLog } from '../../foundation/response/json.mjs';
import { createCodemodApi, runConfigCodemod, DEFAULT_CODE_EXTENSIONS } from './run-codemod.mjs';
import { checkSyntax } from './svelte-parser.mjs';

// Known corruption patterns that indicate a broken transform.
// Each entry: [regex, human-readable description]
/** @type {Array<[RegExp, string]>} */
const CORRUPTION_PATTERNS = [
	[/\[native code\]/g, '[native code] injection (prototype pollution in identifier map)'],
	[/function \w+\(\) \{ \[native code\] \}/g, 'native function toString() leak']
];

/**
 * Directories a source scan must never descend into: dependencies, VCS, and
 * generated build output (codemods rewrite source, not artifacts).
 */
const IGNORED_DIRS = new Set([
	'node_modules',
	'.git',
	'dist',
	'build',
	'out',
	'.next',
	'.svelte-kit',
	'coverage'
]);
export { IGNORED_DIRS };

/**
 * Extensions the source scan collects. `.svelte` is this port's addition;
 * `.tsx` / `.jsx` are upstream's and kept — see divergence 3 in the header.
 */
const SCAN_EXTENSIONS = new Set([
	'.svelte',
	'.tsx',
	'.ts',
	'.jsx',
	'.js',
	'.mjs',
	'.cjs',
	'.css',
	'.scss',
	'.sass',
	'.less'
]);

/**
 * Recursively find all source files in a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function findSourceFiles(dir) {
	/** @type {string[]} */
	const results = [];

	/** @param {string} currentDir */
	function descend(currentDir) {
		/** @type {import('node:fs').Dirent[]} */
		let entries;
		try {
			entries = fs.readdirSync(currentDir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			const fullPath = path.join(currentDir, entry.name);
			// Never follow symlinks: readFileSync/writeFileSync would traverse a
			// symlinked file and rewrite its target OUTSIDE the scan tree (e.g. into
			// node_modules or anywhere on disk). A codemod must only edit real files
			// it reaches directly under the scanned path.
			if (entry.isSymbolicLink()) continue;
			if (entry.isDirectory()) {
				// Skip dependency, VCS, and generated-output dirs — codemods rewrite
				// source, not build artifacts.
				if (IGNORED_DIRS.has(entry.name)) continue;
				descend(fullPath);
			} else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
				results.push(fullPath);
			}
		}
	}

	descend(dir);
	return results.sort();
}

/**
 * Validate transform output before writing to disk.
 *
 * Checks:
 * 1. The output can be re-parsed (no syntax corruption). `svelte/compiler` reads
 *    `.svelte` directly and `.ts`/`.js`/`.mjs`/`.cjs` through a synthetic script
 *    tag; see `svelte-parser.mjs`. An extension with no parser is skipped, as
 *    upstream skips its stylesheet extensions.
 * 2. No known corruption patterns are present that weren't in the original.
 *
 * @param {string} result The transformed source code.
 * @param {string} source The original source code.
 * @param {{parse: import('./svelte-parser.mjs').SvelteParse, ext: string}} ctx
 * @returns {{valid: true} | {valid: false, reason: string}}
 */
export function validateOutput(result, source, { parse, ext }) {
	// Check 1: re-parse the output — catches syntax-breaking corruption.
	const syntax = checkSyntax(result, ext, parse);
	if (syntax.error) {
		return {
			valid: false,
			reason: `transform produced unparseable output: ${syntax.error}`
		};
	}

	// Check 2: known corruption patterns (only flag new ones, not pre-existing).
	for (const [pattern, description] of CORRUPTION_PATTERNS) {
		const resultMatches = result.match(pattern);
		const sourceMatches = source.match(pattern);
		const resultCount = resultMatches ? resultMatches.length : 0;
		const sourceCount = sourceMatches ? sourceMatches.length : 0;
		if (resultCount > sourceCount) {
			const delta = resultCount - sourceCount;
			return {
				valid: false,
				reason: `detected corruption: ${description} (${delta} new occurrence${delta > 1 ? 's' : ''})`
			};
		}
	}

	return { valid: true };
}

/**
 * Normalize a core registry transform entry to the unified codemod entry shape
 * consumed by the shared runner (`run-codemod.mjs`).
 *
 * Core registry entries are stored as `{name, transform, meta, optional}`.
 * The shared runner — the same one integration codemods use — operates on
 * `{id, type, codemod: {title, transform, fileExtensions?, isOptional?},
 * package, version}`.
 *
 * CONVENTION — how a core registry entry signals it is a CONFIG codemod:
 * set `meta.codemodType === 'config'` on the entry (the default is a 'code'
 * codemod). A config codemod runs against the consumer's astryx-svelte.config.*
 * file via the unified `(file, api)` contract; a code codemod runs against
 * discovered source files. Any future core config codemod must set
 * `meta.codemodType = 'config'` and author its transform with the same
 * `(file, api) => string | null | undefined` contract used by a `type: 'config'`
 * codemod.
 *
 * @param {import('./registry.mjs').CoreTransformEntry} transformEntry
 * @param {string} version
 * @returns {import('../../authoring/codemod/type').CodemodEntry}
 */
function toUnifiedEntry(transformEntry, version) {
	const { name, transform, meta, optional } = transformEntry;
	const type = meta?.codemodType === 'config' ? 'config' : 'code';
	return {
		id: name,
		type,
		codemod: {
			title: meta.title,
			transform,
			fileExtensions: meta.fileExtensions,
			isOptional: !!optional
		},
		package: 'core',
		version
	};
}

/**
 * Run codemods against source files.
 *
 * @param {import('./registry.mjs').CoreVersionManifest[]} versionManifests
 * @param {object} options
 * @param {boolean} options.apply Write changes to disk.
 * @param {string} options.path Source directory to scan.
 * @param {string} [options.codemod] Run only this specific transform.
 * @param {Set<string>} [options.skipCodemods] Transform names to exclude.
 * @param {import('./svelte-parser.mjs').SvelteParse} options.parse
 * @param {import('../../authoring/codemod/type').SvelteWalk} options.walk
 * @param {boolean} [options.silent] Suppress all human-facing output (for --json).
 * @returns {Promise<import('./registry.mjs').CoreCodemodRunSummary | {ok: false, reason: string, resolvedPath: string}>}
 */
export async function runCodemods(
	versionManifests,
	{ apply, path: srcPath, codemod, skipCodemods, parse, walk, silent = false }
) {
	// No-op stub object so silent mode skips log output entirely without
	// littering the body with `if (!silent)` guards.
	const log = silent
		? { step() {}, info() {}, success() {}, warn() {}, error() {}, message() {} }
		: p.log;
	const writeBlank = () => {
		if (!silent) humanLog('');
	};

	const resolvedPath = path.resolve(srcPath);

	// Config codemods target the consumer's astryx-svelte.config.* and never read
	// source files, so a missing --path should not block them. Only hard-fail
	// on a missing source path when there is at least one CODE codemod to run.
	const hasCodeCodemod = versionManifests.some(({ transforms }) =>
		transforms.some((t) => t.meta?.codemodType !== 'config')
	);
	const sourcePathExists = fs.existsSync(resolvedPath);

	if (!sourcePathExists && hasCodeCodemod) {
		log.error(`Source path not found: ${resolvedPath}`);
		return { ok: false, reason: 'source_path_missing', resolvedPath };
	}

	/** @type {string[]} */
	let files = [];
	if (sourcePathExists) {
		log.step(`Scanning ${resolvedPath} for source files...`);
		files = findSourceFiles(resolvedPath);
		if (files.length === 0) {
			log.warn('No source files found.');
		} else {
			log.info(`Found ${files.length} source file${files.length === 1 ? '' : 's'}`);
		}
	}

	let totalFilesChanged = 0;
	let totalTransformsApplied = 0;
	let totalValidationBlocked = 0;
	/** @type {Array<{file: string, codemod: string, error: string}>} */
	const errors = [];
	/** @type {string[]} */
	const writtenFiles = [];
	/** @type {Array<{name: string, meta: import('./registry.mjs').CoreTransformMeta, version: string}>} */
	const skippedOptional = [];
	for (const { version, transforms } of versionManifests) {
		log.step(`Applying v${version} codemods...`);

		for (const transformEntry of transforms) {
			// Filter by codemod name if specified
			if (codemod && transformEntry.name !== codemod) continue;
			// Exclude explicitly skipped codemods (by transform name).
			if (skipCodemods?.has(transformEntry.name)) continue;

			const { name, transform, meta, optional } = transformEntry;
			const transformExtensions = new Set(meta.fileExtensions ?? DEFAULT_CODE_EXTENSIONS);

			// Skip optional codemods unless explicitly requested via --codemod
			if (optional && !codemod) {
				skippedOptional.push({ name, meta, version });
				continue;
			}

			log.info(`  ${meta.title}`);

			// Config codemods are routed through the SAME shared runner that
			// integration config codemods use: the transform follows the unified
			// `(file, api)` contract and targets the consumer's astryx-svelte.config.*.
			// A core entry signals "config" via `meta.codemodType === 'config'`
			// (see toUnifiedEntry).
			if (meta?.codemodType === 'config') {
				const result = runConfigCodemod(toUnifiedEntry(transformEntry, version), {
					apply,
					log,
					parse,
					walk
				});
				if (result.errors.length > 0) {
					errors.push(...result.errors);
				} else if (result.filesChanged > 0) {
					totalFilesChanged += result.filesChanged;
					totalTransformsApplied += result.filesChanged;
					writtenFiles.push(...result.writtenFiles);
				}
				continue;
			}

			let filesChanged = 0;

			for (const filePath of files) {
				const relativePath = path.relative(process.cwd(), filePath);

				try {
					const ext = path.extname(filePath);
					if (!transformExtensions.has(ext)) {
						continue;
					}

					const source = fs.readFileSync(filePath, 'utf-8');
					const file = { source, path: filePath };

					const result = transform(file, createCodemodApi(parse, walk));

					if (result != null && result !== source) {
						// Validate output before writing
						const validation = validateOutput(result, source, { parse, ext });
						if (!validation.valid) {
							totalValidationBlocked++;
							log.error(`    ✗ ${relativePath} — ${validation.reason}`);
							errors.push({
								file: relativePath,
								codemod: name,
								error: validation.reason
							});
							continue;
						}

						filesChanged++;
						totalFilesChanged++;
						totalTransformsApplied++;

						if (apply) {
							fs.writeFileSync(filePath, result, 'utf-8');
							writtenFiles.push(filePath);
							log.success(`    ✓ ${relativePath}`);
						} else {
							log.warn(`    ~ ${relativePath} (would change)`);
						}
					}
				} catch (err) {
					const message = /** @type {any} */ (err).message;
					log.error(`    ✗ ${relativePath} — ${message}`);
					errors.push({ file: relativePath, codemod: name, error: message });
				}
			}

			if (filesChanged > 0) {
				const verb = apply ? 'Updated' : 'Would update';
				log.info(`  ${verb} ${filesChanged} file${filesChanged === 1 ? '' : 's'}`);
			}
		}
	}

	// Summary
	writeBlank();

	if (errors.length > 0) {
		log.error(`${errors.length} error${errors.length === 1 ? '' : 's'} during codemods:`);
		for (const { file, codemod: cm, error } of errors) {
			log.error(`  ${cm} → ${file}: ${error}`);
		}
	}

	if (totalValidationBlocked > 0) {
		log.warn(
			`${totalValidationBlocked} file${totalValidationBlocked === 1 ? ' was' : 's were'} blocked by validation — no changes written to ${totalValidationBlocked === 1 ? 'that file' : 'those files'}.`
		);
		log.info('This means a codemod produced invalid output. Please report this as a bug.');
	}

	if (totalFilesChanged === 0 && errors.length === 0) {
		log.success('No changes needed — your code is already up to date!');
	} else if (apply) {
		log.success(
			`Done! Applied ${totalTransformsApplied} change${totalTransformsApplied === 1 ? '' : 's'} across ${totalFilesChanged} file${totalFilesChanged === 1 ? '' : 's'}.`
		);
		if (errors.length > 0) {
			log.warn('Some files had errors — review them manually.');
		}
		log.info('Run your type checker and tests to verify the changes.');
	} else {
		log.warn(
			`Found ${totalTransformsApplied} change${totalTransformsApplied === 1 ? '' : 's'} across ${totalFilesChanged} file${totalFilesChanged === 1 ? '' : 's'}.`
		);
		log.info('Run with --apply to write changes to disk.');
	}

	// Report skipped optional codemods so the user knows they exist
	if (skippedOptional.length > 0) {
		writeBlank();
		log.message(
			`${skippedOptional.length} optional codemod${skippedOptional.length === 1 ? '' : 's'} available:`
		);
		for (const { name, meta } of skippedOptional) {
			log.info(`  ${name} — ${meta.title}`);
			if (meta.description) {
				log.info(`    ${meta.description}`);
			}
			log.info(`    Run: astryx-svelte upgrade --codemod ${name} --path <dir> --apply`);
		}
	}

	return {
		totalFilesChanged,
		totalTransformsApplied,
		totalValidationBlocked,
		writtenFiles,
		errors,
		skippedOptional
	};
}
