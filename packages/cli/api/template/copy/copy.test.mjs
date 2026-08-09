/**
 * @file Colocated tests for the template.copy leaf — overwrite safety + path
 * traversal. `template copy` writes files; the API must guard clobber/traversal
 * itself (it's a public surface), not rely on the CLI wrapper.
 *
 * ## Ported case count
 *
 * 4, matching upstream `api/template/copy/copy.test.mjs` one for one.
 *
 * All four used to be **refixtured** onto an integration-contributed page,
 * because this port shipped no template assets. It ships them now:
 * `assets/templates/pages/blank/` is transcribed, so these resolve the packaged
 * core template exactly as upstream's do and the fixture is gone.
 *
 * Removing it was not optional. Discovery found the fixture's `blank` *and*
 * core's, and every case failed with `ERR_AMBIGUOUS_TEMPLATE` — the refixture
 * was self-retiring in the same way `template-integration.test.mjs`'s inverted
 * assertion was, and it retired the same day.
 *
 * The one assertion that had to change value is upstream's `page.tsx`: a
 * SvelteKit route component is `+page.svelte`.
 *
 * The temp dir is `.astryx-*` under the package rather than upstream's
 * `os.tmpdir()`, which is this suite's standing choice — `.gitignore` and the
 * eslint config both carry that glob, so a crashed run leaves nothing tracked.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { template } from '../template.mjs';

const SLOW = 30_000;

describe('template.copy — overwrite + path safety', () => {
	let dir;
	beforeEach(() => {
		dir = fs.mkdtempSync(path.join(process.cwd(), '.astryx-tmpl-copy-'));
	});
	afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

	it(
		'copies a page template into a directory as +page.svelte',
		async () => {
			const res = await template('blank', { targetPath: './dest', cwd: dir });
			expect(res.type).toBe('template.copy');
			expect(fs.existsSync(path.join(dir, 'dest', '+page.svelte'))).toBe(true);
		},
		SLOW
	);

	it(
		'refuses to overwrite an existing file (ERR_FILE_EXISTS), leaving it untouched',
		async () => {
			fs.writeFileSync(path.join(dir, 'mine.svelte'), 'USER CODE');
			await expect(
				template('blank', { targetPath: './mine.svelte', cwd: dir })
			).rejects.toMatchObject({ code: 'ERR_FILE_EXISTS' });
			expect(fs.readFileSync(path.join(dir, 'mine.svelte'), 'utf-8')).toBe('USER CODE');
		},
		SLOW
	);

	it(
		'overwrites when overwrite:true is passed',
		async () => {
			fs.writeFileSync(path.join(dir, 'mine.svelte'), 'USER CODE');
			const res = await template('blank', {
				targetPath: './mine.svelte',
				overwrite: true,
				cwd: dir
			});
			expect(res.type).toBe('template.copy');
			expect(fs.readFileSync(path.join(dir, 'mine.svelte'), 'utf-8')).not.toBe('USER CODE');
		},
		SLOW
	);

	it(
		'rejects a traversal target and writes nothing outside cwd',
		async () => {
			await expect(
				template('blank', { targetPath: '../escape.svelte', cwd: dir })
			).rejects.toMatchObject({ code: 'ERR_PATH_TRAVERSAL' });
			expect(fs.existsSync(path.join(dir, '..', 'escape.svelte'))).toBe(false);
		},
		SLOW
	);
});
