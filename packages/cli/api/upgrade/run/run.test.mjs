/**
 * @file Colocated tests for the upgrade.run leaf — the `--path` scan dir must be
 * confined to cwd (upgrade rewrites source in place with `--apply`, so an
 * escaping or out-of-tree path must be rejected).
 *
 * ## Ported case count
 *
 * Upstream has 3; 3 here, all live. The one fixture change is that `seedProject`
 * also installs an integration contributing a code codemod, so case 1 still
 * reaches a real `upgrade.run` receipt — the core registry is empty, and without
 * a codemod from somewhere the pipeline short-circuits to `upgrade.status`
 * before the case has said anything about running.
 *
 * The two traversal cases need no codemod at all: `assertWithin` runs first, so
 * they reject before any of the pipeline is reached. `os.tmpdir()` is still the
 * out-of-tree absolute path in case 3 — it has to be somewhere genuinely outside
 * the fixture.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { upgrade } from '../upgrade.mjs';

const SLOW = 30_000;

function seedProject(dir) {
	fs.writeFileSync(
		path.join(dir, 'package.json'),
		JSON.stringify({
			name: 'x',
			version: '1.0.0',
			dependencies: { '@astryx-svelte/core': '0.1.8' }
		})
	);
	const core = path.join(dir, 'node_modules', '@astryx-svelte', 'core');
	fs.mkdirSync(core, { recursive: true });
	fs.writeFileSync(
		path.join(core, 'package.json'),
		JSON.stringify({ name: '@astryx-svelte/core', version: '0.1.8' })
	);
	fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
	fs.writeFileSync(path.join(dir, 'src', 'index.ts'), 'const x = 1;\n');

	// The empty core registry means an integration codemod is what makes an
	// `upgrade.run` receipt reachable. See the file header.
	fs.writeFileSync(
		path.join(dir, 'astryx-svelte.config.mjs'),
		`export default { integrations: ['@acme/widgets'] };\n`
	);
	const pkgDir = path.join(dir, 'node_modules', '@acme', 'widgets');
	fs.mkdirSync(path.join(pkgDir, 'codemods', '0.1.8'), { recursive: true });
	fs.writeFileSync(
		path.join(pkgDir, 'package.json'),
		JSON.stringify({ name: '@acme/widgets', version: '1.0.0' })
	);
	fs.writeFileSync(
		path.join(pkgDir, 'astryx-svelte.integration.mjs'),
		`export default { codemods: './codemods' };\n`
	);
	fs.writeFileSync(
		path.join(pkgDir, 'codemods', '0.1.8', 'noop.mjs'),
		`export default {type: 'code', title: 'No-op', transform: () => null};\n`
	);
}

describe('upgrade.run — --path confinement', () => {
	let dir;
	let originalCwd;
	beforeEach(() => {
		originalCwd = process.cwd();
		dir = fs.mkdtempSync(path.join(process.cwd(), '.astryx-upg-path-'));
		seedProject(dir);
	});
	afterEach(() => {
		process.chdir(originalCwd);
		fs.rmSync(dir, { recursive: true, force: true });
	});

	it(
		'accepts a normal in-tree --path (dry run)',
		async () => {
			// Integration specs resolve against process.cwd() (upstream's behavior).
			process.chdir(dir);
			const res = await upgrade({ from: '0.0.1', path: 'src' }, { cwd: dir });
			expect(res.type).toBe('upgrade.run');
		},
		SLOW
	);

	it(
		'rejects a ../-escaping --path with ERR_PATH_TRAVERSAL',
		async () => {
			await expect(
				upgrade({ from: '0.0.1', path: '../../../../etc' }, { cwd: dir })
			).rejects.toMatchObject({ code: 'ERR_PATH_TRAVERSAL' });
		},
		SLOW
	);

	it(
		'rejects an absolute --path outside cwd with ERR_PATH_TRAVERSAL',
		async () => {
			await expect(
				upgrade({ from: '0.0.1', path: os.tmpdir() }, { cwd: dir })
			).rejects.toMatchObject({ code: 'ERR_PATH_TRAVERSAL' });
		},
		SLOW
	);
});
