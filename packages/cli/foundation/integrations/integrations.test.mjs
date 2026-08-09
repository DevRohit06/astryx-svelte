/**
 * @file Colocated tests for integration manifest loading.
 *
 * Ported case for case, 7/7 with no deferrals as of slice 5. "makes
 * integration components discoverable" drives `api/discover/discover.mjs` and
 * stood as `it.todo` until that landed; there was no weaker form worth writing,
 * because the assertion *is* that discovery sees the contributed component.
 *
 * Note the raw case count is the contract, not the runtime count: the
 * `resolvePackageDir` block is a single `it.each` over five specs, so seven
 * source cases report as eleven when run.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Project } from '../config/project.mjs';
import { discover } from '../../api/discover/discover.mjs';
import { loadIntegrations, resolvePackageDir } from './integrations.mjs';

let tmpDir;
let originalCwd;

function writeManifestPackage(dir, { basename = 'astryx-svelte.integration.mjs', body }) {
	const pkgDir = path.join(dir, 'node_modules', '@acme', 'widgets');
	fs.mkdirSync(pkgDir, { recursive: true });
	fs.writeFileSync(
		path.join(pkgDir, 'package.json'),
		JSON.stringify({
			name: '@acme/widgets',
			version: '1.2.3'
		})
	);
	fs.writeFileSync(path.join(pkgDir, basename), body);
	return pkgDir;
}

beforeEach(() => {
	originalCwd = process.cwd();
	tmpDir = fs.mkdtempSync(path.join(process.cwd(), '.astryx-integration-test-'));
	fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'consumer' }));
	fs.writeFileSync(
		path.join(tmpDir, 'astryx-svelte.config.mjs'),
		`export default { integrations: ['@acme/widgets'] };\n`
	);
	process.chdir(tmpDir);
});

afterEach(() => {
	process.chdir(originalCwd);
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('configured integrations', () => {
	it('resolves identity from package.json and contribution roots to absolute paths', async () => {
		const pkgDir = writeManifestPackage(tmpDir, {
			body: `export default {
        components: './docs',
        templates: './blocks',
        codemods: './codemods',
        issuesUrl: 'https://example.com/issues',
      };\n`
		});
		fs.mkdirSync(path.join(pkgDir, 'docs'));
		fs.writeFileSync(
			path.join(pkgDir, 'docs', 'Widget.doc.mjs'),
			`export const doc = {
        name: 'Widget',
        usage: {description: 'Acme widget'},
        props: [],
      };\n`
		);

		const project = await Project.load(tmpDir);
		expect(project.integrations).toEqual(['@acme/widgets']);
		const loaded = project.loadedIntegrations[0];
		// Identity comes from package.json, not the manifest.
		expect(loaded.name).toBe('@acme/widgets');
		expect(loaded.version).toBe('1.2.3');
		expect(loaded.components).toBe(path.join(pkgDir, 'docs'));
		expect(loaded.templates).toBe(path.join(pkgDir, 'blocks'));
		expect(loaded.codemods).toBe(path.join(pkgDir, 'codemods'));
		expect(loaded.issuesUrl).toBe('https://example.com/issues');
	});

	it('makes integration components discoverable', async () => {
		const pkgDir = writeManifestPackage(tmpDir, {
			body: `export default { components: './docs' };\n`
		});
		fs.mkdirSync(path.join(pkgDir, 'docs'));
		fs.writeFileSync(
			path.join(pkgDir, 'docs', 'Widget.doc.mjs'),
			`export const doc = {
        name: 'Widget',
        usage: {description: 'Acme widget'},
        props: [],
      };\n`
		);

		const result = await discover(undefined, {});
		expect(result.type).toBe('discover.list');
		expect(result.data).toEqual([
			expect.objectContaining({
				name: '@acme/widgets',
				category: '@acme/widgets',
				components: ['Widget']
			})
		]);
	});

	it('errors when the package has no conventional root manifest', async () => {
		const pkgDir = path.join(tmpDir, 'node_modules', '@acme', 'widgets');
		fs.mkdirSync(pkgDir, { recursive: true });
		fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({ name: '@acme/widgets' }));
		await expect(loadIntegrations(['@acme/widgets'], { cwd: tmpDir })).rejects.toThrow(
			/no conventional root manifest/
		);
	});

	it('errors when the package has multiple root manifests', async () => {
		const pkgDir = writeManifestPackage(tmpDir, {
			body: `export default {};\n`
		});
		// CommonJS on purpose, as upstream writes it: the case asserts the
		// multiple-manifests throw, which fires during resolution and before any
		// import, so the body is never executed and its module format is moot.
		fs.writeFileSync(path.join(pkgDir, 'astryx-svelte.integration.js'), `module.exports = {};\n`);
		await expect(loadIntegrations(['@acme/widgets'], { cwd: tmpDir })).rejects.toThrow(
			/multiple root manifests/
		);
	});

	it('errors when the package is not installed', async () => {
		await expect(loadIntegrations(['@acme/missing'], { cwd: tmpDir })).rejects.toThrow(
			/Could not find installed integration package/
		);
	});
});

describe('resolvePackageDir — spec must be a bare package name', () => {
	it.each(['../../../etc', 'a/../../b', '/abs/evil', 'foo/..', '..'])(
		'rejects a traversal/absolute spec %s',
		(spec) => {
			expect(() => resolvePackageDir(spec, '/proj')).toThrow(/Invalid|outside node_modules/i);
		}
	);

	it('accepts scoped and plain package names', () => {
		// `path.resolve`, not upstream's `path.join`, and this is a portability
		// correction rather than a change of assertion. `resolvePackageDir` builds
		// its answer with `path.resolve`, which on Windows qualifies a
		// root-relative path with the current drive (`D:\proj\…`) where `path.join`
		// leaves it bare (`\proj\…`). The two agree on POSIX, so upstream's form
		// passes in its CI and on ours, and fails only on a Windows dev machine —
		// a false negative about correct code. Resolving both sides compares the
		// same thing on every platform.
		expect(resolvePackageDir('@acme/x', '/proj')).toBe(
			path.resolve('/proj', 'node_modules', '@acme', 'x')
		);
		expect(resolvePackageDir('lodash', '/proj')).toBe(
			path.resolve('/proj', 'node_modules', 'lodash')
		);
	});
});

describe('a broken integration manifest degrades gracefully (skip + warn)', () => {
	it('does not crash Project.load; other integrations still load and the error surfaces', async () => {
		// tmpDir already has @acme/widgets wired; add a good + bad alongside it.
		const config = `export default { integrations: ['@good/a', '@bad/b'] };\n`;
		fs.writeFileSync(path.join(tmpDir, 'astryx-svelte.config.mjs'), config);
		for (const [name, body] of [
			['@good/a', 'export default {};'],
			['@bad/b', 'throw new Error("boom manifest");']
		]) {
			const dir = path.join(tmpDir, 'node_modules', ...name.split('/'));
			fs.mkdirSync(dir, { recursive: true });
			fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, version: '1.0.0' }));
			fs.writeFileSync(path.join(dir, 'astryx-svelte.integration.mjs'), body);
		}

		const project = await Project.load(tmpDir); // must not throw
		expect(project.loadedIntegrations.map((i) => i.name)).toContain('@good/a');
		const issues = await project.issues();
		expect(issues.some((i) => /boom manifest/.test(i.message))).toBe(true);
	});
});
