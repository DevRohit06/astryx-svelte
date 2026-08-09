/**
 * @file Shared resolution + IO for the util command's leaves.
 *
 * Both the list leaf (util.list) and the single-util leaves (util.detail /
 * util.detail.params) need to (a) locate @astryx-svelte/core and (b) resolve a
 * named util's authored doc. Those two steps live here so each leaf stays a thin
 * projection over a single shared resolver: the leaves shape the `{type, data}`
 * envelope, this adapter does the "find it on disk" work.
 *
 * @input  cwd, util name
 * @output resolved core dir / loaded HookDoc (or a thrown AstryxError)
 * @position api/util/_adapter.mjs — shared by ./list, ./detail, ./detail/params
 */

import { CORE_PACKAGE } from '../../foundation/discovery/component-discovery.mjs';
import { findCoreDir } from '../../foundation/fs/paths.mjs';
import { findHookDoc, getAllHookNames } from '../../foundation/discovery/hook-discovery.mjs';
import { loadDocs } from '../../foundation/discovery/component-loader.mjs';
import { levenshteinDistance } from '../../foundation/text/string-utils.mjs';
import { AstryxError } from '../error.mjs';
import { ERROR_CODES } from '../../foundation/response/error-codes.mjs';

/**
 * Fallback import specifier for a util whose doc authors none.
 *
 * Upstream's is `@astryxdesign/core/hooks`, which is also core's subpath here —
 * but only for the 16 utils that live in `src/lib/hooks`. The other 27 are
 * colocated with a component and reachable from the root barrel alone, and each
 * of those docs authors its own `importPath`, so this constant is the last
 * resort rather than the usual answer.
 */
export const DEFAULT_UTIL_IMPORT = `${CORE_PACKAGE}/hooks`;

/**
 * Locate the @astryx-svelte/core package directory, or throw the same
 * ERR_CORE_NOT_FOUND envelope the flat command threw. Shared by every util leaf.
 * @param {string} cwd
 * @returns {string} Absolute path to the core package directory.
 */
export function resolveCoreDir(cwd) {
	const coreDir = findCoreDir(cwd);
	if (!coreDir) {
		throw new AstryxError(
			`Could not find ${CORE_PACKAGE} package`,
			undefined,
			ERROR_CODES.ERR_CORE_NOT_FOUND
		);
	}
	return coreDir;
}

/**
 * Resolve a single util's authored doc by name, or throw ERR_UNKNOWN_HOOK with
 * fuzzy (levenshtein) suggestions. Shared by the detail and detail.params
 * leaves, which both start from a resolved doc.
 *
 * The error code stays `ERR_UNKNOWN_HOOK`: the `ERR_*` table is append-only and
 * frozen at upstream's 43 entries (slice 1), so the rename cannot mint a code.
 * @param {string} coreDir
 * @param {string} name
 * @param {{zh?: boolean, lang?: string|null}} [opts]
 * @returns {Promise<import('./util.type.mjs').HookDoc>}
 */
export async function resolveUtilDoc(coreDir, name, { zh = false, lang = null } = {}) {
	const docPath = findHookDoc(coreDir, name);

	if (!docPath) {
		// Fuzzy search for suggestions
		const allNames = getAllHookNames(coreDir);
		const needle = name.toLowerCase();
		const suggestions = allNames
			.map((hookName) => ({
				name: hookName,
				distance: levenshteinDistance(needle, hookName.toLowerCase())
			}))
			.filter((m) => m.distance <= 5)
			.sort((a, b) => a.distance - b.distance)
			.slice(0, 5)
			.map((m) => ({ name: m.name, reason: `similar name (distance ${m.distance})` }));

		throw new AstryxError(`No util named "${name}"`, suggestions, ERROR_CODES.ERR_UNKNOWN_HOOK);
	}

	return loadDocs(
		docPath,
		/** @type {{zh?: boolean, dense?: boolean, lang?: string}} */ ({ zh, lang })
	);
}
