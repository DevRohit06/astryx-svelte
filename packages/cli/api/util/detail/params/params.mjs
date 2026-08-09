/**
 * @file util.detail.params leaf — the parameters table for one util.
 *
 * Reuses the shared util resolver (see ../../_adapter.mjs) and projects just the
 * resolved doc's `params` array into the `util.detail.params` envelope.
 *
 * @input  util name + { cwd, zh, lang }
 * @output UtilDetailParamsResponse ({ type: 'util.detail.params', data: HookParamDoc[] })
 * @position api/util/detail/params/params.mjs — dispatched from ../../util.mjs
 */

import { resolveCoreDir, resolveUtilDoc } from '../../_adapter.mjs';

/**
 * @param {string} name
 * @param {{cwd?: string, zh?: boolean, lang?: string|null}} [options]
 * @returns {Promise<import('../../util.type.mjs').UtilDetailParamsResponse>}
 */
export async function params(name, { cwd = process.cwd(), zh = false, lang = null } = {}) {
	const coreDir = resolveCoreDir(cwd);
	const docs = await resolveUtilDoc(coreDir, name, { zh, lang });
	return { type: 'util.detail.params', data: docs.params || [] };
}
