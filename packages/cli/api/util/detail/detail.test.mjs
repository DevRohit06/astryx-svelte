/**
 * @file Colocated tests for the util.detail leaf, run against the real
 * `@astryx-svelte/core` registry. The list leaf is covered end-to-end by
 * clients/cli/commands/detail-levels.test.mjs; this covers the single-util
 * detail projection (envelope shape + the ERR_UNKNOWN_HOOK fuzzy-suggestion
 * path).
 *
 * ## Ported case count
 *
 * 2, matching upstream's `api/hook/detail/detail.test.mjs` one for one. The
 * envelope is `util.detail` and the message reads "No util named" where
 * upstream says hook; the error CODE stays `ERR_UNKNOWN_HOOK` because the
 * `ERR_*` table is append-only.
 */

import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import { detail } from './detail.mjs';

// api/util/detail/ -> up 5 = repo root (has packages/core, which findCoreDir
// walks to).
const REPO = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');

const SLOW = 30_000;

describe('util.detail leaf', () => {
	it(
		'resolves a real util into a util.detail envelope',
		async () => {
			const res = await detail('useMediaQuery', { cwd: REPO });
			expect(res.type).toBe('util.detail');
			expect(res.data.name).toBe('useMediaQuery');
			// The full authored doc is projected verbatim, so params/returns arrays exist.
			expect(Array.isArray(res.data.params)).toBe(true);
			expect(Array.isArray(res.data.returns)).toBe(true);
		},
		SLOW
	);

	it(
		'throws ERR_UNKNOWN_HOOK with fuzzy suggestions for an unknown util',
		async () => {
			let err;
			try {
				await detail('useNope', { cwd: REPO });
			} catch (e) {
				err = e;
			}
			expect(err).toBeDefined();
			expect(err.code).toBe('ERR_UNKNOWN_HOOK');
			expect(err.message).toBe('No util named "useNope"');
			expect(Array.isArray(err.suggestions)).toBe(true);
		},
		SLOW
	);
});
