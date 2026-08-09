/**
 * @file util.detail leaf — the full authored doc for one util.
 *
 * Projects the shared util resolver (see ../_adapter.mjs) into the
 * `util.detail` envelope.
 *
 * @input  util name + { cwd, zh, lang }
 * @output UtilDetailResponse ({ type: 'util.detail', data: HookDoc })
 * @position api/util/detail/detail.mjs — dispatched from ../util.mjs
 */

import { resolveCoreDir, resolveUtilDoc } from '../_adapter.mjs';

/**
 * @param {string} name
 * @param {{cwd?: string, zh?: boolean, lang?: string|null}} [options]
 * @returns {Promise<import('../util.type.mjs').UtilDetailResponse>}
 */
export async function detail(name, { cwd = process.cwd(), zh = false, lang = null } = {}) {
	const coreDir = resolveCoreDir(cwd);
	const docs = await resolveUtilDoc(coreDir, name, { zh, lang });
	return { type: 'util.detail', data: docs };
}
