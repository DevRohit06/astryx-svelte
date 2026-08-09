/**
 * @file Path-traversal regression tests for `astryx-svelte template <name> <path>`.
 *
 * Drives the template API directly (it owns destination resolution +
 * path-safety enforcement). Spawning the CLI bin is unnecessary because
 * `template()` resolves and writes to disk itself.
 *
 * ## Ported case count
 *
 * 3, matching upstream one for one.
 *
 * All three are **refixtured** off upstream's packaged `blank` template onto an
 * integration-contributed page, because this port ships no template assets
 * (TODO.md). Two of them would otherwise have failed resolution before reaching
 * the guard under test. The third is the more interesting one: upstream already
 * carries an escape hatch — "no page templates packaged in this checkout — skip
 * without failing the suite" — which in this port would fire on **every** run
 * and turn a real regression guard into a permanently green no-op. Giving it a
 * template to find is what keeps it a test. The extension in it moves from
 * `.tsx` to `.svelte` for the same reason `isFilePathArg` gained `.svelte`.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

let tmpDir;
let templateApi;

/**
 * Stand up a consumer project at `dir` whose one integration contributes a
 * `blank` page template.
 * @param {string} dir
 */
function installBlankTemplate(dir) {
	fs.mkdirSync(dir, { recursive: true });
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

beforeEach(async () => {
	tmpDir = fs.mkdtempSync(path.join(process.cwd(), '.astryx-template-paths-'));
	templateApi = (await import('../../../api/template/template.mjs')).template;
});
afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
	vi.restoreAllMocks();
});

describe('template path safety', () => {
	it('rejects targetPath with ../ traversal and writes no file outside cwd', async () => {
		const cwd = path.join(tmpDir, 'project');
		const outside = path.join(tmpDir, 'outside');
		installBlankTemplate(cwd);
		fs.mkdirSync(outside, { recursive: true });

		await expect(templateApi('blank', { targetPath: '../outside/leaked', cwd })).rejects.toThrow(
			/traversal|outside the project root/i
		);

		// Nothing escaped.
		expect(fs.readdirSync(outside)).toEqual([]);
	});

	it('rejects absolute targetPath', async () => {
		const cwd = path.join(tmpDir, 'project');
		installBlankTemplate(cwd);
		const absTarget = path.join(tmpDir, 'absolute-out');

		await expect(templateApi('blank', { targetPath: absTarget, cwd })).rejects.toThrow(
			/absolute paths are not allowed/i
		);

		expect(fs.existsSync(absTarget)).toBe(false);
	});

	it('treats targetPath with .svelte extension as a file, not a directory', async () => {
		const cwd = path.join(tmpDir, 'project');
		installBlankTemplate(cwd);

		// Use a real template name from the discovered set.
		const { discoverTemplates } = await import('../../../api/template/template.mjs');
		const all = await discoverTemplates(cwd);
		const page = all.find((t) => t.type === 'page');
		expect(page).toBeTruthy();

		const result = await templateApi(page.dirName, {
			targetPath: './foo.svelte',
			cwd
		});

		// The file MUST be at ./foo.svelte, not ./foo.svelte/+page.svelte.
		expect(result.type).toBe('template.copy');
		expect(result.data.fileName).toBe('foo.svelte');

		expect(fs.existsSync(path.join(cwd, 'foo.svelte'))).toBe(true);
		expect(fs.statSync(path.join(cwd, 'foo.svelte')).isFile()).toBe(true);
		// The bad-old behavior would have left foo.svelte as a directory.
		expect(fs.statSync(path.join(cwd, 'foo.svelte')).isDirectory()).toBe(false);
	});
});
