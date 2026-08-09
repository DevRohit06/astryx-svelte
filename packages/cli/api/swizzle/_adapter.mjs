/**
 * @file swizzle adapter — the single fs + resolution seam the swizzle leaves
 * share.
 *
 * Both leaves need the consumer's `@astryx-svelte/core` package dir and the list
 * of swizzlable component directories: `list` returns the names directly, `copy`
 * uses them for its "component not found" suggestions. Resolving core + listing
 * lives here once so neither leaf re-walks the filesystem. Throws AstryxError
 * (ERR_CORE_NOT_FOUND) when core can't be located.
 *
 * `listComponents` returns **directory names** (`button`, `avatar`, `chat`), not
 * export names, and swizzle is the one command for which that is the right
 * index — it copies a directory. See the long note on `listComponents` in
 * foundation/fs/paths.mjs, and the resolution note in copy/copy.mjs for how an
 * export name (`AvatarStatusDot`) still reaches its directory.
 */

import { findCoreDir, listComponents } from '../../foundation/fs/paths.mjs';
import { ERROR_CODES } from '../../foundation/response/error-codes.mjs';
import { AstryxError } from '../error.mjs';

/**
 * Locate `@astryx-svelte/core` for `cwd` and list its swizzlable component
 * directories.
 * @param {string} cwd
 * @returns {{coreDir: string, components: string[]}}
 */
export function resolveCore(cwd) {
	const coreDir = findCoreDir(cwd);
	if (!coreDir) {
		throw new AstryxError(
			'Could not find @astryx-svelte/core package. Make sure you are inside the design system monorepo or have @astryx-svelte/core installed.',
			[],
			ERROR_CODES.ERR_CORE_NOT_FOUND
		);
	}

	const components = listComponents(coreDir);
	return { coreDir, components };
}
