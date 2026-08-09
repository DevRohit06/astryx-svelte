/**
 * @file Dispatcher-level tests for util() — the argument-shape routing above
 * the list/detail/params leaves. The leaves have their own tests; this pins the
 * router: no name / --list / --category -> util.list, bare name -> util.detail,
 * --params -> util.detail.params, an unknown --category -> ERR_UNKNOWN_CATEGORY,
 * and a non-string name -> a coded ERR_UNKNOWN_HOOK (not a raw TypeError).
 * Runs against the real `@astryx-svelte/core` utils.
 *
 * ## Ported case count
 *
 * 8, matching upstream's `api/hook/hook.test.mjs` one for one. The command and
 * its response types are renamed `hook` -> `util` (Svelte has no hooks; the
 * equivalents are runes composables), and the response types follow. The error
 * CODE does not: `ERR_UNKNOWN_HOOK` stays, because the `ERR_*` table is
 * append-only and frozen at upstream's 43 entries.
 */

import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import { util } from './util.mjs';
import { AstryxError } from '../error.mjs';

const REPO = path.resolve(import.meta.dirname, '..', '..', '..', '..');
const cwd = REPO;
const SLOW = 30_000;

describe('util() dispatcher routing', () => {
	it(
		'no name -> util.list',
		async () => {
			const r = await util(undefined, { cwd });
			expect(r.type).toBe('util.list');
			expect(r.data.components).toBeDefined();
		},
		SLOW
	);

	it(
		'--list -> util.list',
		async () => {
			expect((await util(undefined, { cwd, list: true })).type).toBe('util.list');
		},
		SLOW
	);

	it(
		'--category (known) -> filtered util.list',
		async () => {
			const all = await util(undefined, { cwd });
			const someCategory = Object.keys(all.data.components)[0];
			const r = await util(undefined, { cwd, category: someCategory });
			expect(r.type).toBe('util.list');
			expect(Object.keys(r.data.components)).toEqual([someCategory]);
		},
		SLOW
	);

	it(
		'--category (unknown) -> ERR_UNKNOWN_CATEGORY',
		async () => {
			await expect(
				util(undefined, { cwd, category: 'zzz-not-a-real-category' })
			).rejects.toMatchObject({ code: 'ERR_UNKNOWN_CATEGORY' });
		},
		SLOW
	);

	it(
		'bare name -> util.detail',
		async () => {
			expect((await util('useMediaQuery', { cwd })).type).toBe('util.detail');
		},
		SLOW
	);

	it(
		'--params -> util.detail.params',
		async () => {
			expect((await util('useMediaQuery', { cwd, params: true })).type).toBe('util.detail.params');
		},
		SLOW
	);

	it(
		'a non-string name throws a coded error (not a raw TypeError)',
		async () => {
			for (const bad of [42, {}, [1]]) {
				const err = await util(/** @type {any} */ (bad), { cwd }).catch((e) => e);
				expect(err).toBeInstanceOf(AstryxError);
				expect(err.code).toBe('ERR_UNKNOWN_HOOK');
			}
		},
		SLOW
	);

	it(
		'a non-string category throws a coded error (not a raw TypeError)',
		async () => {
			for (const bad of [123, {}, [1]]) {
				const err = await util(undefined, {
					cwd,
					category: /** @type {any} */ (bad)
				}).catch((e) => e);
				expect(err).toBeInstanceOf(AstryxError);
				expect(err.code).toBe('ERR_UNKNOWN_CATEGORY');
			}
		},
		SLOW
	);
});
