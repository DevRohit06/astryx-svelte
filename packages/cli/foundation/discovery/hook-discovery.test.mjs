/**
 * @file Colocated tests for hook-discovery, run against the real
 * `@astryx-svelte/core` source tree plus throwaway fixtures. Pins the category
 * grouping, the missing-src guarding (which differs from component-discovery),
 * and the Levenshtein fuzzy-fallback in findHookDoc.
 *
 * ## Ported case count
 *
 * 9, matching upstream one for one. The only edit is the fixture root:
 * `<core>/src/lib/hooks` and `<core>/src/lib/<dir>` where upstream writes
 * `<core>/src/hooks` and `<core>/src/<Name>` — every source in this port sits
 * one level deeper. The module keeps upstream's `hook` vocabulary on purpose
 * (see its header); only the *command* is renamed to `util`.
 */

import { describe, it, expect, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { discoverHooks, findHookDoc, getAllHookNames } from './hook-discovery.mjs';

const CLI_ROOT = path.resolve(import.meta.dirname, '..', '..');
const REPO = path.resolve(CLI_ROOT, '..', '..');
const CORE = path.join(REPO, 'packages', 'core');
const SLOW = 30_000;

/** @type {string[]} */
const tmpDirs = [];
/** @param {string} prefix @returns {string} */
function mkTmp(prefix) {
	const d = fs.mkdtempSync(path.join(CLI_ROOT, prefix));
	tmpDirs.push(d);
	return d;
}
afterAll(() => {
	for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
});

describe('discoverHooks (real core)', () => {
	it(
		'discovers real hooks grouped by category',
		() => {
			const hooks = discoverHooks(CORE);
			const cats = Object.keys(hooks);
			expect(cats.length).toBeGreaterThan(1);
			if (cats.includes('Other')) expect(cats[cats.length - 1]).toBe('Other');
			const nonOther = cats.filter((c) => c !== 'Other');
			expect([...nonOther].sort((a, b) => a.localeCompare(b))).toEqual(nonOther);
			for (const members of Object.values(hooks)) {
				expect([...members].sort()).toEqual(members);
			}
			const all = getAllHookNames(CORE);
			expect(all).toContain('useMediaQuery');
			expect(all.length).toBeGreaterThan(10);
		},
		SLOW
	);

	it('capitalizes categories and buckets category-less docs into Other', () => {
		const core = mkTmp('.astryx-hd-cat-');
		const hooksDir = path.join(core, 'src', 'lib', 'hooks');
		fs.mkdirSync(hooksDir, { recursive: true });
		fs.writeFileSync(
			path.join(hooksDir, 'useThing.doc.mjs'),
			"export default {\n\tcategory: 'layout'\n};\n"
		);
		fs.writeFileSync(path.join(hooksDir, 'useOrphan.doc.mjs'), 'export default {};\n');
		expect(discoverHooks(core)).toEqual({ Layout: ['useThing'], Other: ['useOrphan'] });
	});

	it('discovers use*.doc.mjs colocated in component directories', () => {
		const core = mkTmp('.astryx-hd-colo-');
		const compDir = path.join(core, 'src', 'lib', 'components', 'resizable');
		fs.mkdirSync(compDir, { recursive: true });
		fs.writeFileSync(
			path.join(compDir, 'useResizable.doc.mjs'),
			"export default {\n\tcategory: 'interaction'\n};\n"
		);
		expect(discoverHooks(core)).toEqual({ Interaction: ['useResizable'] });
	});

	it('returns {} when src/ is missing (guarded with existsSync)', () => {
		const core = mkTmp('.astryx-hd-nosrc-');
		expect(discoverHooks(core)).toEqual({});
		expect(getAllHookNames(core)).toEqual([]);
	});
});

describe('findHookDoc (real core)', () => {
	it(
		'resolves an exact hook name',
		() => {
			expect(findHookDoc(CORE, 'useMediaQuery')).toMatch(/useMediaQuery\.doc\.mjs$/);
		},
		SLOW
	);

	it(
		'resolves a bare (use-prefix-stripped, case-insensitive) name',
		() => {
			expect(findHookDoc(CORE, 'mediaquery')).toMatch(/useMediaQuery\.doc\.mjs$/);
		},
		SLOW
	);

	it('returns null when src/ is missing (guarded)', () => {
		const core = mkTmp('.astryx-fhd-nosrc-');
		expect(findHookDoc(core, 'useFoo')).toBeNull();
	});
});

describe('findHookDoc fuzzy Levenshtein fallback (pinned current behavior)', () => {
	it(
		'auto-resolves a typo within edit distance 3',
		() => {
			expect(getAllHookNames(CORE)).not.toContain('useLayers');
			expect(getAllHookNames(CORE)).toContain('useLayer');
			expect(findHookDoc(CORE, 'useLayers')).toMatch(/useLayer\.doc\.mjs$/);
		},
		SLOW
	);

	it(
		'returns null when the closest hook is farther than distance 3',
		() => {
			expect(findHookDoc(CORE, 'useZzzzzz')).toBeNull();
			expect(findHookDoc(CORE, 'zzzzzzzzzz')).toBeNull();
		},
		SLOW
	);
});
