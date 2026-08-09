/**
 * @file Colocated tests for the util.detail.params leaf, run against the real
 * `@astryx-svelte/core` registry. Covers the params projection (just the
 * resolved doc's params array) and the shared ERR_UNKNOWN_HOOK path.
 *
 * ## Ported case count
 *
 * 2, matching upstream's `api/hook/detail/params/params.test.mjs` one for one;
 * only the envelope name changes (`hook.detail.params` -> `util.detail.params`).
 */

import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import { params } from './params.mjs';

// api/util/detail/params/ -> up 6 = repo root (has packages/core).
const REPO = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..');

const SLOW = 30_000;

describe('util.detail.params leaf', () => {
	it(
		'projects only the params array into a util.detail.params envelope',
		async () => {
			const res = await params('useMediaQuery', { cwd: REPO });
			expect(res.type).toBe('util.detail.params');
			expect(Array.isArray(res.data)).toBe(true);
			// useMediaQuery takes a single `query` parameter.
			expect(res.data[0].name).toBe('query');
		},
		SLOW
	);

	it(
		'throws ERR_UNKNOWN_HOOK for an unknown util',
		async () => {
			let err;
			try {
				await params('useNope', { cwd: REPO });
			} catch (e) {
				err = e;
			}
			expect(err).toBeDefined();
			expect(err.code).toBe('ERR_UNKNOWN_HOOK');
			expect(Array.isArray(err.suggestions)).toBe(true);
		},
		SLOW
	);
});
