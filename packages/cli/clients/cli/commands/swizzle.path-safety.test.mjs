/**
 * @file Path-traversal regression tests for `astryx-svelte swizzle --output`.
 * Ported case-for-case from upstream's
 * `clients/cli/commands/swizzle.path-safety.test.mjs` — 3 cases, 3 here.
 *
 * Runs the CLI in-process with a fake project as cwd and asserts that
 * `--output ../escaped` is rejected with a clear error AND that no file is
 * created outside the project root.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { runCli } from '../../../test-utils/run-cli.mjs';

/**
 * Build a minimal fake project: <root>/project/ contains a
 * node_modules/@astryx-svelte/core with a `src/lib/components/button` directory
 * so findCoreDir + listComponents both succeed, and <root>/outside/ is the
 * would-be traversal target.
 * @param {string} tmpDir
 */
function buildFakeRepo(tmpDir) {
	const project = path.join(tmpDir, 'project');
	const outside = path.join(tmpDir, 'outside');
	const core = path.join(project, 'node_modules', '@astryx-svelte', 'core');
	const buttonDir = path.join(core, 'src', 'lib', 'components', 'button');
	fs.mkdirSync(buttonDir, { recursive: true });
	fs.mkdirSync(outside, { recursive: true });
	fs.writeFileSync(
		path.join(buttonDir, 'button.svelte'),
		`<!-- fake source -->\n<button>hi</button>\n`
	);
	fs.writeFileSync(path.join(core, 'package.json'), '{"name":"@astryx-svelte/core"}');
	return { project, outside };
}

/** @type {string} */
let tmpDir;
beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'astryx-swizzle-paths-'));
});
afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('swizzle path safety', () => {
	it('rejects --output with ../ traversal and writes no file outside root', async () => {
		const { project, outside } = buildFakeRepo(tmpDir);

		const result = await runCli(['swizzle', 'button', '--output', '../outside-project'], project);

		expect(result.code).not.toBe(0);
		expect(result.stderr + result.stdout).toMatch(/traversal|outside the project root/i);

		// Hard check: nothing was written outside the project.
		expect(fs.readdirSync(outside)).toEqual([]);
		const escaped = path.join(tmpDir, 'outside-project');
		expect(fs.existsSync(escaped)).toBe(false);
	});

	it('rejects --output with absolute path', async () => {
		const { project } = buildFakeRepo(tmpDir);
		const absTarget = path.join(tmpDir, 'absolute-target');

		const result = await runCli(['swizzle', 'button', '--output', absTarget], project);

		expect(result.code).not.toBe(0);
		expect(result.stderr + result.stdout).toMatch(/absolute paths are not allowed/i);
		expect(fs.existsSync(absTarget)).toBe(false);
	});

	it('requires --overwrite in non-interactive mode when files already exist', async () => {
		const { project } = buildFakeRepo(tmpDir);
		const outDir = path.join(project, 'components', 'astryx', 'button');
		fs.mkdirSync(outDir, { recursive: true });
		const existingPath = path.join(outDir, 'button.svelte');
		fs.writeFileSync(existingPath, '<!-- my customizations -->\n');

		// Use --json to force non-interactive mode.
		const result = await runCli(['--json', 'swizzle', 'button'], project);

		expect(result.code).not.toBe(0);
		expect(result.stderr + result.stdout).toMatch(/overwrite/i);
		// Existing file unchanged
		expect(fs.readFileSync(existingPath, 'utf-8')).toBe('<!-- my customizations -->\n');
	});
});
