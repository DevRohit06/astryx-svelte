/**
 * Compiles every StyleX-bearing module under `src/lib` and returns the rules the
 * plugin emitted, in a stable order.
 *
 * Shared by `build-css.mjs`, which writes them to `dist/astryx.css`, and
 * `compare-upstream-css.mjs`, which diffs them against upstream's published
 * sheet. One compile path, so the stylesheet that ships is the stylesheet that
 * was checked — a second configuration here would let the two drift.
 */

import { transformAsync } from '@babel/core';
import typescriptSyntax from '@babel/plugin-syntax-typescript';
import styleXPlugin from '@stylexjs/babel-plugin';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** `packages/core`. Also the StyleX `rootDir`; see `collectStyleXRules`. */
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Every `.ts` module under `dir`, sorted, excluding declarations.
 *
 * Sorted because the walk order reaches the emitted CSS: StyleX orders rules of
 * equal priority by the order it saw them, so an unsorted `readdirSync` would
 * make the stylesheet depend on the filesystem — the defect that made the docs
 * registries differ between Windows and CI.
 *
 * @param {string} dir
 * @returns {string[]}
 */
function walk(dir) {
	const out = [];
	const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
		a.name < b.name ? -1 : a.name > b.name ? 1 : 0
	);
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walk(full));
		else if (!entry.name.endsWith('.d.ts') && entry.name.endsWith('.ts')) out.push(full);
	}
	return out;
}

/**
 * @returns {Promise<{
 *   rules: Array<[string, { ltr: string, rtl?: string | null, priority: number }]>,
 *   fileCount: number
 * }>}
 * @throws if any module fails to compile — a module that silently drops its
 *   rules is the failure this whole pipeline exists to prevent, so unlike
 *   upstream's script, which warns and carries on, this one stops.
 */
export async function collectStyleXRules() {
	const src = path.join(root, 'src', 'lib');
	const files = walk(src).filter((file) => readFileSync(file, 'utf8').includes('@stylexjs/stylex'));

	/** @type {Array<[string, { ltr: string, rtl?: string | null, priority: number }]>} */
	const rules = [];
	/** @type {string[]} */
	const failures = [];

	for (const file of files) {
		try {
			const { metadata } = await transformAsync(readFileSync(file, 'utf8'), {
				filename: file,
				babelrc: false,
				configFile: false,
				plugins: [
					[typescriptSyntax, { isTSX: false }],
					[
						styleXPlugin,
						{
							dev: false,
							runtimeInjection: false,
							treeshakeCompensation: true,
							// Matches `compare-upstream-classes.mjs`. Atomic classes are
							// content-derived and unaffected, but `defineVars` companion
							// classes are path-derived, and a second root would fork them.
							unstable_moduleResolution: { type: 'commonJS', rootDir: root }
						}
					]
				]
			});
			rules.push(...(metadata?.stylex ?? []));
		} catch (error) {
			failures.push(`  ${path.relative(root, file)}: ${error.message.split('\n')[0]}`);
		}
	}

	if (failures.length > 0) {
		throw new Error(`${failures.length} module(s) failed to compile:\n${failures.join('\n')}`);
	}
	if (rules.length === 0) {
		throw new Error('No StyleX rules found — refusing to treat an empty result as success.');
	}

	return { rules, fileCount: files.length };
}
