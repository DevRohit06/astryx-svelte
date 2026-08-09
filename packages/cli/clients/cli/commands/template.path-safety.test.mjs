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
 * All three used to be **refixtured** onto an integration-contributed page,
 * because this port shipped no template assets. It ships them now, so all three
 * resolve the packaged `blank` exactly as upstream's do and the fixture is gone
 * — only the project directory it also happened to create is still made here.
 *
 * Removing it was not optional: discovery found the fixture's `blank` *and*
 * core's, and the first two cases failed with `ERR_AMBIGUOUS_TEMPLATE` before
 * ever reaching the guard under test.
 *
 * The third case is the interesting one. Upstream carries an escape hatch —
 * "no page templates packaged in this checkout — skip without failing the
 * suite" — which in this port fired on *every* run while the assets were
 * missing, turning a regression guard into a permanently green no-op. It now
 * finds real core pages, so the hatch is dead code on this side rather than the
 * normal path. The extension in it is `.svelte` rather than upstream's `.tsx`,
 * for the same reason `isFilePathArg` gained `.svelte`.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

let tmpDir;
let templateApi;

/**
 * The consumer project the guards run inside. `blank` itself comes from core's
 * packaged templates, as upstream's does; all this has to do is give `cwd`
 * somewhere to exist, since the path checks resolve against it.
 * @param {string} dir
 */
function makeProject(dir) {
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'consumer' }));
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
		makeProject(cwd);
		fs.mkdirSync(outside, { recursive: true });

		await expect(templateApi('blank', { targetPath: '../outside/leaked', cwd })).rejects.toThrow(
			/traversal|outside the project root/i
		);

		// Nothing escaped.
		expect(fs.readdirSync(outside)).toEqual([]);
	});

	it('rejects absolute targetPath', async () => {
		const cwd = path.join(tmpDir, 'project');
		makeProject(cwd);
		const absTarget = path.join(tmpDir, 'absolute-out');

		await expect(templateApi('blank', { targetPath: absTarget, cwd })).rejects.toThrow(
			/absolute paths are not allowed/i
		);

		expect(fs.existsSync(absTarget)).toBe(false);
	});

	it('treats targetPath with .svelte extension as a file, not a directory', async () => {
		const cwd = path.join(tmpDir, 'project');
		makeProject(cwd);

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
