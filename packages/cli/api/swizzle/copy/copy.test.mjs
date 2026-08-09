/**
 * @file Colocated tests for the swizzle.copy leaf — path-safety + overwrite.
 * Ported case-for-case from upstream's `api/swizzle/copy/copy.test.mjs` — 4
 * cases, 4 here.
 *
 * The copy leaf writes files, so the output base AND the component name (which
 * becomes a path segment) must both be confined to cwd.
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { swizzle } from '../swizzle.mjs';

// api/swizzle/copy/ -> up 5 = repo root.
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');
// Transient fixture dirs are named `.astryx-*` by repo convention.
const OUT = '.astryx-swizzle-copy-test';
const SLOW = 30_000;

describe('swizzle.copy — path safety', () => {
	afterEach(() => {
		fs.rmSync(path.join(REPO, OUT), { recursive: true, force: true });
	});

	it(
		'rejects a component name that traverses out of the output base',
		async () => {
			await expect(swizzle('../src', { cwd: REPO, output: './' + OUT })).rejects.toMatchObject({
				code: 'ERR_PATH_TRAVERSAL'
			});
		},
		SLOW
	);

	it(
		'rejects a component name containing a path separator',
		async () => {
			await expect(swizzle('foo/bar', { cwd: REPO, output: './' + OUT })).rejects.toMatchObject({
				code: 'ERR_PATH_TRAVERSAL'
			});
		},
		SLOW
	);

	it(
		'rejects an --output that escapes cwd (relative and absolute)',
		async () => {
			await expect(swizzle('button', { cwd: REPO, output: '../evil' })).rejects.toMatchObject({
				code: 'ERR_PATH_TRAVERSAL'
			});
			await expect(swizzle('button', { cwd: REPO, output: '/tmp/evil' })).rejects.toMatchObject({
				code: 'ERR_PATH_TRAVERSAL'
			});
		},
		SLOW
	);

	it(
		'copies a real component, then refuses to clobber without overwrite',
		async () => {
			const r = await swizzle('button', { cwd: REPO, output: './' + OUT });
			expect(r.type).toBe('swizzle.copy');
			if (r.type !== 'swizzle.copy') return;
			expect(r.data.filesCopied).toBeGreaterThan(0);
			await expect(swizzle('button', { cwd: REPO, output: './' + OUT })).rejects.toMatchObject({
				code: 'ERR_FILE_EXISTS'
			});
			const r2 = await swizzle('button', { cwd: REPO, output: './' + OUT, overwrite: true });
			expect(r2.type === 'swizzle.copy' && r2.data.filesCopied).toBe(r.data.filesCopied);
		},
		SLOW
	);
});
