/**
 * @file Colocated tests for path resolution.
 *
 * Ported case for case from upstream's suite. Two kinds of change: the
 * installed-package name becomes `@astryx-svelte/core`, and `listComponents`'
 * fixture moves to this port's layout — components under
 * `src/lib/components/<kebab>` rather than upstream's `src/<PascalName>`. That
 * case keeps its upstream name and its assertion (`hooks`/`theme`/`utils` never
 * appear) even though the mechanism changed from a deny-list to a narrower read
 * root; the property under test is the same one.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
	findCoreDir,
	findProjectRoot,
	listComponents,
	discoverExternalPackages
} from './paths.mjs';

let tmpDir;

function makeTmpDir() {
	return fs.mkdtempSync(path.join(os.tmpdir(), 'astryx-paths-test-'));
}

beforeEach(() => {
	tmpDir = makeTmpDir();
});

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('findCoreDir', () => {
	it('finds packages/core walking up directories', () => {
		const coreDir = path.join(tmpDir, 'packages', 'core');
		fs.mkdirSync(coreDir, { recursive: true });

		const nested = path.join(tmpDir, 'sub', 'deep');
		fs.mkdirSync(nested, { recursive: true });

		expect(findCoreDir(nested)).toBe(coreDir);
	});

	it('finds node_modules/@astryx-svelte/core fallback', () => {
		const nmCore = path.join(tmpDir, 'node_modules', '@astryx-svelte', 'core');
		fs.mkdirSync(nmCore, { recursive: true });

		expect(findCoreDir(tmpDir)).toBe(nmCore);
	});

	it('returns null when nothing found', () => {
		expect(findCoreDir(tmpDir)).toBeNull();
	});
});

describe('findProjectRoot', () => {
	it('finds root with workspaces in package.json', () => {
		fs.writeFileSync(
			path.join(tmpDir, 'package.json'),
			JSON.stringify({ name: 'root', workspaces: ['packages/*'] })
		);

		const nested = path.join(tmpDir, 'packages', 'foo');
		fs.mkdirSync(nested, { recursive: true });

		expect(findProjectRoot(nested)).toBe(tmpDir);
	});

	it('returns null when no workspaces found', () => {
		fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'no-workspaces' }));

		expect(findProjectRoot(tmpDir)).toBeNull();
	});
});

describe('discoverExternalPackages', () => {
	it('finds packages with an "astryx" field in package.json', () => {
		const nm = path.join(tmpDir, 'node_modules');
		const extDir = path.join(nm, 'astryx-charts');
		fs.mkdirSync(extDir, { recursive: true });
		fs.writeFileSync(
			path.join(extDir, 'package.json'),
			JSON.stringify({
				name: 'astryx-charts',
				astryx: { docs: './src', category: 'Data Viz' }
			})
		);

		const result = discoverExternalPackages(tmpDir);
		expect(result).toEqual([
			{
				name: 'astryx-charts',
				category: 'Data Viz',
				docsDir: path.join(extDir, 'src'),
				blocksDir: null
			}
		]);
	});

	it('handles scoped packages (@org/pkg)', () => {
		const nm = path.join(tmpDir, 'node_modules');
		const scopedDir = path.join(nm, '@acme', 'astryx-widgets');
		fs.mkdirSync(scopedDir, { recursive: true });
		fs.writeFileSync(
			path.join(scopedDir, 'package.json'),
			JSON.stringify({
				name: '@acme/astryx-widgets',
				astryx: { docs: './lib', category: 'Widgets' }
			})
		);

		const result = discoverExternalPackages(tmpDir);
		expect(result).toEqual([
			{
				name: '@acme/astryx-widgets',
				category: 'Widgets',
				docsDir: path.join(scopedDir, 'lib'),
				blocksDir: null
			}
		]);
	});

	it('skips @astryx-svelte/core', () => {
		const nm = path.join(tmpDir, 'node_modules');
		const coreDir = path.join(nm, '@astryx-svelte', 'core');
		fs.mkdirSync(coreDir, { recursive: true });
		fs.writeFileSync(
			path.join(coreDir, 'package.json'),
			JSON.stringify({
				name: '@astryx-svelte/core',
				astryx: { docs: './src' }
			})
		);

		const result = discoverExternalPackages(tmpDir);
		expect(result).toEqual([]);
	});

	it('skips packages without "astryx" field', () => {
		const nm = path.join(tmpDir, 'node_modules');
		const extDir = path.join(nm, 'some-lib');
		fs.mkdirSync(extDir, { recursive: true });
		fs.writeFileSync(path.join(extDir, 'package.json'), JSON.stringify({ name: 'some-lib' }));

		const result = discoverExternalPackages(tmpDir);
		expect(result).toEqual([]);
	});

	it('defaults category to package name when not specified', () => {
		const nm = path.join(tmpDir, 'node_modules');
		const extDir = path.join(nm, 'my-components');
		fs.mkdirSync(extDir, { recursive: true });
		fs.writeFileSync(
			path.join(extDir, 'package.json'),
			JSON.stringify({
				name: 'my-components',
				astryx: { docs: './docs' }
			})
		);

		const result = discoverExternalPackages(tmpDir);
		expect(result[0].category).toBe('my-components');
	});

	it('returns empty array when no node_modules found', () => {
		const result = discoverExternalPackages(tmpDir);
		expect(result).toEqual([]);
	});

	it('walks up directories to find node_modules', () => {
		const nm = path.join(tmpDir, 'node_modules');
		const extDir = path.join(nm, 'astryx-ext');
		fs.mkdirSync(extDir, { recursive: true });
		fs.writeFileSync(
			path.join(extDir, 'package.json'),
			JSON.stringify({
				name: 'astryx-ext',
				astryx: { docs: './src' }
			})
		);

		const nested = path.join(tmpDir, 'packages', 'app');
		fs.mkdirSync(nested, { recursive: true });

		const result = discoverExternalPackages(nested);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('astryx-ext');
	});

	it('handles invalid JSON in package.json gracefully', () => {
		const nm = path.join(tmpDir, 'node_modules');
		const extDir = path.join(nm, 'bad-json');
		fs.mkdirSync(extDir, { recursive: true });
		fs.writeFileSync(path.join(extDir, 'package.json'), '{not valid json!!!');

		const result = discoverExternalPackages(tmpDir);
		expect(result).toEqual([]);
	});
});

describe('listComponents', () => {
	it('returns sorted component directory names, skipping hooks/theme/utils', () => {
		// Upstream's components are siblings of `hooks`/`theme`/`utils` inside
		// `src`, so it filters them out by name. Ours are one level deeper, in
		// `src/lib/components`, and those three are siblings of `components`
		// rather than of the components — the fixture builds both halves so the
		// assertion still proves the three never appear in the result.
		const libDir = path.join(tmpDir, 'src', 'lib');
		for (const dir of ['button', 'avatar', 'zebra']) {
			fs.mkdirSync(path.join(libDir, 'components', dir), { recursive: true });
		}
		for (const dir of ['hooks', 'theme', 'utils']) {
			fs.mkdirSync(path.join(libDir, dir), { recursive: true });
		}

		const result = listComponents(tmpDir);
		expect(result).toEqual(['avatar', 'button', 'zebra']);
	});

	it('returns empty array when src dir is missing', () => {
		expect(listComponents(tmpDir)).toEqual([]);
	});
});
