/**
 * @file Colocated tests for the template.copy leaf — overwrite safety + path
 * traversal. `template copy` writes files; the API must guard clobber/traversal
 * itself (it's a public surface), not rely on the CLI wrapper.
 *
 * ## Ported case count
 *
 * 4, matching upstream `api/template/copy/copy.test.mjs` one for one.
 *
 * All four are **refixtured** off upstream's packaged `blank` page template
 * onto an integration-contributed page, because this port ships no template
 * assets (TODO.md — deferred). Nothing about what they test changes: a page
 * template scaffolded into a directory, the clobber refusal, the `overwrite`
 * escape hatch and the traversal rejection are properties of the copy leaf, not
 * of which template it copied. Pointed at a template that does not exist they
 * would have failed resolution instead, which is not the same test.
 *
 * The one assertion that had to change value is upstream's `page.tsx`: a
 * SvelteKit route component is `+page.svelte`.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { template } from '../template.mjs';

const SLOW = 30_000;

/**
 * Stand up a consumer project whose one integration contributes a `blank` page
 * template — the counterpart of upstream's packaged `blank`.
 * @param {string} dir
 */
function installBlankTemplate(dir) {
	fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'consumer' }));
	fs.writeFileSync(
		path.join(dir, 'astryx-svelte.config.mjs'),
		`export default { integrations: ['@acme/widgets'] };\n`
	);
	const pkgDir = path.join(dir, 'node_modules', '@acme', 'widgets');
	fs.mkdirSync(path.join(pkgDir, 'templates'), { recursive: true });
	fs.writeFileSync(
		path.join(pkgDir, 'package.json'),
		JSON.stringify({ name: '@acme/widgets', version: '1.0.0' })
	);
	fs.writeFileSync(
		path.join(pkgDir, 'astryx-svelte.integration.mjs'),
		`export default { templates: './templates' };\n`
	);
	fs.writeFileSync(
		path.join(pkgDir, 'templates', 'blank.template.mjs'),
		`export default {type: 'page', name: 'Blank', description: 'Minimal page scaffold'};\n`
	);
	fs.writeFileSync(path.join(pkgDir, 'templates', 'blank.svelte'), '<p>New Page</p>\n');
}

describe('template.copy — overwrite + path safety', () => {
	let dir;
	beforeEach(() => {
		dir = fs.mkdtempSync(path.join(process.cwd(), '.astryx-tmpl-copy-'));
		installBlankTemplate(dir);
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
