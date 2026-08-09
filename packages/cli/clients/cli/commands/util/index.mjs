/**
 * @file util command — List utils and print util docs
 *
 * Registered as `util` with `hook` as an alias: Svelte has no hooks, and the
 * things this lists are runes-based composables. `aliases` rides in the
 * capability manifest, so an agent that knows upstream's verb still finds it.
 *
 * Global options: --detail full|compact|brief, --lang en|zh
 */

import {
	formatHookFull,
	formatHookCompact,
	formatHookBrief,
	formatHookParams
} from '../../lib/hook-format.mjs';
import { getCliInvocation } from '../../../../foundation/env/package-manager.mjs';
import { jsonOut } from '../../../../foundation/response/json.mjs';
import { emit, section, text, list, records, code } from '../../formatters/index.mjs';
import { cliError } from '../../lib/cli-error.mjs';
import { ERROR_CODES } from '../../../../foundation/response/error-codes.mjs';
import { util as utilApi } from '../../../../api/util/util.mjs';
import { DEFAULT_UTIL_IMPORT } from '../../../../api/util/_adapter.mjs';
import { findRelatedBlocks } from '../../../../api/template/template.mjs';

/**
 * The api layer's util() widens its return, so annotate the command-local
 * result with the precise discriminated union from the colocated
 * api/util/util.type.mjs to get narrowing + typed data.
 *
 * @typedef {(
 *   | import('../../../../api/util/util.type.mjs').UtilListResponse
 *   | import('../../../../api/util/util.type.mjs').UtilDetailResponse
 *   | import('../../../../api/util/util.type.mjs').UtilDetailParamsResponse
 * )} UtilResult
 */

/** @param {import('commander').Command} program */
export function registerUtil(program) {
	program
		.command('util [name]')
		.alias('hook')
		.description('List utils or print util docs')
		.option('--list', 'List all utils grouped by category')
		.option('--category <category>', 'List utils in a specific category')
		.option('--params', 'Print only the parameters table')
		.action(
			/**
			 * @param {string|undefined} name
			 * @param {{list?: boolean, category?: string, params?: boolean}} options
			 */
			async (name, options) => {
				const run = getCliInvocation();
				const zh = program.opts().zh || false;
				const lang = program.opts().lang || null;
				const detailSource = program.getOptionValueSource('detail');
				const isListView = options.list || options.category || !name;
				// Default detail level is full for single-util view, brief for list views.
				let detail = program.opts().detail || 'full';
				if (isListView && detailSource === 'default') detail = 'brief';
				const json = program.opts().json || false;

				const validDetails = ['full', 'compact', 'brief'];
				if (!validDetails.includes(detail)) {
					cliError(`Invalid --detail value "${detail}". Valid levels: ${validDetails.join(', ')}`, {
						code: ERROR_CODES.ERR_INVALID_DETAIL
					});
					return;
				}

				/** @type {UtilResult} */
				let result;
				try {
					result = /** @type {UtilResult} */ (
						await utilApi(name, {
							cwd: process.cwd(),
							list: options.list,
							category: options.category,
							params: options.params,
							detail,
							lang,
							zh
						})
					);
				} catch (e) {
					const err = /** @type {import('../../../../api/error.mjs').AstryxError} */ (e);
					cliError(err.message, { suggestions: err.suggestions, code: err.code });
					return;
				}

				if (json) return jsonOut(result);

				// ── Text output ────────────────────────────────────────────
				switch (result.type) {
					case 'util.list': {
						// One list type across all three detail levels; the depth is carried
						// in result.data.detail and the grouped map in result.data.components.
						if (result.data.detail === 'full') {
							// --detail full — dense per-util docs grouped by category
							// (import block, best practices, full params + returns tables).
							// The whole view is one markdown document: a `## <category>` heading
							// over each category's concatenated util docs.
							const groups = result.data.components;
							/** @type {import('../../formatters/index.mjs').Block[]} */
							const out = [];
							for (const [cat, items] of Object.entries(groups)) {
								const body = items
									.map((item) => formatHookCompact(item, item.importPath || DEFAULT_UTIL_IMPORT))
									.join('\n');
								out.push(code(`## ${cat}\n\n${body}`));
							}
							emit(...out);
							break;
						}

						if (result.data.detail === 'compact') {
							// --detail compact — one record (name + description) per util,
							// grouped by category.
							const groups = result.data.components;
							/** @type {import('../../formatters/index.mjs').Block[]} */
							const out = [];
							for (const [cat, items] of Object.entries(groups)) {
								out.push(section(cat), records(items, { fields: ['name', 'description'] }));
							}
							out.push(text(`Usage: ${run} util <name>`));
							emit(...out);
							break;
						}

						// --detail names (default for list views) — names only, grouped by
						// category.
						const groups = result.data.components;
						if (options.category) {
							const [cat, hookNames] = Object.entries(groups)[0];
							emit(section(`${cat}:`), list(hookNames));
						} else {
							/** @type {import('../../formatters/index.mjs').Block[]} */
							const out = [];
							for (const [category, hookNames] of Object.entries(groups)) {
								out.push(section(category), list(hookNames));
							}
							out.push(text(`Usage: ${run} util <name>`));
							emit(...out);
						}
						break;
					}

					case 'util.detail': {
						const doc =
							detail === 'brief'
								? formatHookBrief(result.data)
								: detail === 'compact'
									? formatHookCompact(result.data, result.data.importPath || DEFAULT_UTIL_IMPORT)
									: formatHookFull(result.data);

						// Show related block templates from relatedComponents.
						const relatedComps = result.data.relatedComponents || [];
						/** @type {import('../../../../api/template/template.mjs').DiscoveredTemplate[]} */
						const allBlocks = [];
						for (const comp of relatedComps) {
							const blocks = await findRelatedBlocks(comp);
							for (const b of blocks) {
								if (!allBlocks.some((existing) => existing.dirName === b.dirName)) {
									allBlocks.push(b);
								}
							}
						}

						emit(
							code(doc),
							allBlocks.length > 0 && section('Related block templates'),
							allBlocks.length > 0 && records(allBlocks, { fields: ['dirName', 'description'] })
						);
						break;
					}

					case 'util.detail.params': {
						emit(code(formatHookParams({ params: result.data, name })));
						break;
					}
				}
			}
		);
}

// Re-export lib functions for external consumers
export {
	discoverHooks,
	findHookDoc,
	getAllHookNames
} from '../../../../foundation/discovery/hook-discovery.mjs';
export { loadDocs } from '../../../../foundation/discovery/component-loader.mjs';
export {
	formatHookFull,
	formatHookCompact,
	formatHookBrief,
	formatHookBriefAll,
	formatHookParams
} from '../../lib/hook-format.mjs';
