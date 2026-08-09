/**
 * @file util.list leaf — list utils grouped by category.
 *
 * Emits ONE `util.list` type across all three detail levels; the depth is
 * carried in `data.detail` ('names' | 'compact' | 'full') and `data.components`
 * holds the grouped map whose entry shape depends on that level.
 *
 * @input  { cwd, category?, detail, zh, lang }
 * @output UtilListResponse ({ type: 'util.list', data: { detail, components } })
 * @position api/util/list/list.mjs — dispatched from ../util.mjs
 */

import { discoverHooks, findHookDoc } from '../../../foundation/discovery/hook-discovery.mjs';
import { loadDocs } from '../../../foundation/discovery/component-loader.mjs';
import { AstryxError } from '../../error.mjs';
import { ERROR_CODES } from '../../../foundation/response/error-codes.mjs';
import { DEFAULT_UTIL_IMPORT, resolveCoreDir } from '../_adapter.mjs';

/**
 * @param {object} [options]
 * @param {string} [options.cwd]
 * @param {string} [options.category] - When set, list only this category.
 * @param {'full'|'compact'|'brief'|'names'} [options.detail] - Anything other than 'compact'/'full' renders names only.
 * @param {boolean} [options.zh]
 * @param {string|null} [options.lang]
 * @returns {Promise<import('../util.type.mjs').UtilListResponse>}
 */
export async function list({
	cwd = process.cwd(),
	category,
	detail = 'names',
	zh = false,
	lang = null
} = {}) {
	const coreDir = resolveCoreDir(cwd);
	const hooks = discoverHooks(coreDir);

	if (category) {
		const match = Object.entries(hooks).find(
			([key]) => key.toLowerCase() === category.toLowerCase()
		);
		if (!match) {
			throw new AstryxError(
				`Unknown category "${category}"`,
				Object.keys(hooks).map((k) => ({ name: k, reason: 'valid category' })),
				ERROR_CODES.ERR_UNKNOWN_CATEGORY
			);
		}

		if (detail === 'compact') {
			/** @type {import('../util.type.mjs').UtilBriefEntry[]} */
			const entries = [];
			for (const hookName of match[1]) {
				entries.push(await briefEntry(coreDir, hookName, { zh, lang }));
			}
			return {
				type: 'util.list',
				data: { detail: 'compact', components: { [match[0]]: entries } }
			};
		}

		if (detail === 'full') {
			/** @type {import('../util.type.mjs').HookDoc[]} */
			const entries = [];
			for (const hookName of match[1]) {
				entries.push(await fullEntry(coreDir, hookName, { zh, lang }));
			}
			return { type: 'util.list', data: { detail: 'full', components: { [match[0]]: entries } } };
		}

		// Default: names only
		return { type: 'util.list', data: { detail: 'names', components: { [match[0]]: match[1] } } };
	}

	// All utils
	if (detail === 'compact') {
		/** @type {Record<string, import('../util.type.mjs').UtilBriefEntry[]>} */
		const result = {};
		for (const [cat, hookNames] of Object.entries(hooks)) {
			result[cat] = [];
			for (const hookName of hookNames) {
				result[cat].push(await briefEntry(coreDir, hookName, { zh, lang }));
			}
		}
		return { type: 'util.list', data: { detail: 'compact', components: result } };
	}

	if (detail === 'full') {
		/** @type {Record<string, import('../util.type.mjs').HookDoc[]>} */
		const result = {};
		for (const [cat, hookNames] of Object.entries(hooks)) {
			result[cat] = [];
			for (const hookName of hookNames) {
				result[cat].push(await fullEntry(coreDir, hookName, { zh, lang }));
			}
		}
		return { type: 'util.list', data: { detail: 'full', components: result } };
	}

	// Default: names only
	return { type: 'util.list', data: { detail: 'names', components: hooks } };
}

/**
 * One `detail: 'compact'` entry. Upstream inlines this branch twice (category
 * and all-utils); the two copies were identical.
 * @param {string} coreDir
 * @param {string} hookName
 * @param {{zh: boolean, lang: string|null}} opts
 * @returns {Promise<import('../util.type.mjs').UtilBriefEntry>}
 */
async function briefEntry(coreDir, hookName, { zh, lang }) {
	const fallback = { name: hookName, description: '', import: DEFAULT_UTIL_IMPORT };
	const docPath = findHookDoc(coreDir, hookName);
	if (!docPath) return fallback;
	try {
		const docs = await loadDocs(
			docPath,
			/** @type {{zh?: boolean, dense?: boolean, lang?: string}} */ ({ zh, lang })
		);
		return {
			name: hookName,
			description: docs.usage?.description || '',
			import: docs.importPath || DEFAULT_UTIL_IMPORT
		};
	} catch {
		return fallback;
	}
}

/**
 * One `detail: 'full'` entry — the whole authored doc, or a name-only stand-in.
 * @param {string} coreDir
 * @param {string} hookName
 * @param {{zh: boolean, lang: string|null}} opts
 * @returns {Promise<import('../util.type.mjs').HookDoc>}
 */
async function fullEntry(coreDir, hookName, { zh, lang }) {
	const stub = /** @type {import('../util.type.mjs').HookDoc} */ ({ name: hookName });
	const docPath = findHookDoc(coreDir, hookName);
	if (!docPath) return stub;
	try {
		return await loadDocs(
			docPath,
			/** @type {{zh?: boolean, dense?: boolean, lang?: string}} */ ({ zh, lang })
		);
	} catch {
		return stub;
	}
}
