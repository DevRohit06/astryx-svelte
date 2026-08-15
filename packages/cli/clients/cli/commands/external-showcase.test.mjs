/**
 * @file `findShowcase` / `findRelatedBlocks` against blocks contributed by an
 * external package (one that declares `astryx.blocks` in its package.json).
 *
 * ## Ported case count
 *
 * 5, matching upstream one for one. Two fixture adaptations:
 *
 *   - a block's source is a `.svelte`, not a `.tsx`;
 *   - **no `packages/core` symlink.** Upstream's comment says one is needed by
 *     `findCoreDir`; it is not on this path — block discovery reaches these
 *     packages through `discoverExternalPackages`, which only walks up for
 *     `node_modules` — and dropping it means the suite needs no Windows
 *     privilege. `component-package.test.mjs` made the same call for the same
 *     reason.
 *
 * This is the one place block discovery is exercised end to end today: core
 * ships no block templates (`assets/templates/blocks/` does not exist — see
 * port/todo.md), so an external package is the only real producer, and it is a
 * first-class one rather than a stand-in.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { findShowcase, findRelatedBlocks } from '../../../api/template/template.mjs';

let tmpDir;

function createFixture() {
	// External package with blocks
	const extDir = path.join(tmpDir, 'node_modules', '@test', 'ext');
	const blocksDir = path.join(extDir, 'blocks', 'components');

	// Employee showcase
	const employeeDir = path.join(blocksDir, 'Employee');
	fs.mkdirSync(employeeDir, { recursive: true });
	fs.writeFileSync(
		path.join(employeeDir, 'EmployeeShowcase.doc.mjs'),
		`
export const doc = {
  type: 'block',
  name: 'Employee — Profile Card',
  description: 'Employee profile card with hover preview.',
  isReady: true,
  isShowcase: true,
  aspectRatio: 16 / 9,
  componentsUsed: ['Employee'],
};
`
	);
	fs.writeFileSync(path.join(employeeDir, 'EmployeeShowcase.svelte'), '<div>Employee</div>\n');

	// Diff showcase + example
	const diffDir = path.join(blocksDir, 'Diff');
	fs.mkdirSync(diffDir, { recursive: true });
	fs.writeFileSync(
		path.join(diffDir, 'DiffShowcase.doc.mjs'),
		`
export const doc = {
  type: 'block',
  name: 'Diff — Link with Hover Card',
  description: 'Diff link with automatic hover card preview.',
  isReady: true,
  isShowcase: true,
  aspectRatio: 4 / 3,
  componentsUsed: ['Diff'],
};
`
	);
	fs.writeFileSync(path.join(diffDir, 'DiffShowcase.svelte'), '<div>Diff</div>\n');
	fs.writeFileSync(
		path.join(diffDir, 'DiffStatusBadges.doc.mjs'),
		`
export const doc = {
  type: 'block',
  name: 'Diff — Status Badges',
  description: 'Shows diff status badge variants.',
  isReady: true,
  aspectRatio: 1,
  componentsUsed: ['Diff', 'Badge'],
};
`
	);
	fs.writeFileSync(path.join(diffDir, 'DiffStatusBadges.svelte'), '<div>Diff</div>\n');

	fs.writeFileSync(
		path.join(extDir, 'package.json'),
		JSON.stringify({
			name: '@test/ext',
			astryx: { docs: './src', category: 'Common', blocks: './blocks/components' }
		})
	);

	// Need src dir for docs (even if empty) since discoverExternalPackages checks it
	fs.mkdirSync(path.join(extDir, 'src'), { recursive: true });
}

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(process.cwd(), '.astryx-showcase-test-'));
	createFixture();
});

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('findShowcase() with external packages', () => {
	it('finds showcase from external package by directory name', async () => {
		const result = await findShowcase('Employee', tmpDir);
		expect(result).not.toBeNull();
		expect(result.name).toBe('Employee — Profile Card');
		expect(result.filePath).toContain('EmployeeShowcase.svelte');
	});

	it('finds showcase from external package by componentsUsed', async () => {
		const result = await findShowcase('Diff', tmpDir);
		expect(result).not.toBeNull();
		expect(result.name).toBe('Diff — Link with Hover Card');
	});

	it('returns null for component with no showcase', async () => {
		const result = await findShowcase('NonExistent', tmpDir);
		expect(result).toBeNull();
	});
});

describe('findRelatedBlocks() with external packages', () => {
	it('finds related blocks from external package', async () => {
		const result = await findRelatedBlocks('Diff', tmpDir);
		expect(result).toHaveLength(2);
		const names = result.map((b) => b.dirName).sort();
		expect(names).toEqual(['DiffShowcase', 'DiffStatusBadges']);
	});

	it('finds cross-package component references', async () => {
		const result = await findRelatedBlocks('Badge', tmpDir);
		expect(result.some((b) => b.dirName === 'DiffStatusBadges')).toBe(true);
	});
});
