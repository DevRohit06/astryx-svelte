/**
 * @file Verifies that `.ts`-authored sources (utils and other functions) are
 * found by `findComponentSource`, so `resolveImportPath` derives a
 * tree-shakeable subpath instead of falling back to the bare package root.
 *
 * Runs against the real packages/core source, not mocks.
 *
 * ## Ported case count
 *
 * 4, matching upstream one for one (the third is a table, five rows here as
 * there). Two adaptations, both from published surface rather than from the
 * discovery algorithm:
 *
 *   - a composable's source is `use-media-query.svelte.ts`, not
 *     `useMediaQuery.ts` — kebab-case files, and the `.svelte.ts` extension a
 *     runes module needs;
 *   - **`useResizable` derives the bare root, and that is correct here.** This
 *     port has no per-component subpath exports: core's `exports` are `.`,
 *     `./theme`, `./theme/define`, `./theme/syntax`, `./hooks`, `./naming`,
 *     `./utils`, `./i18n`, `./locales/*.json` and `./base.css`. A util under
 *     `components/resizable/` therefore has no subpath to derive and the bare
 *     root is where it genuinely lives. The last case keeps its slot with the
 *     assertion that still bites: every derived specifier is either the bare
 *     root or a subpath core actually declares — never a fabricated one, which
 *     is the regression upstream's version was written to catch.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CORE_PACKAGE, findComponentSource, resolveImportPath } from './component-discovery.mjs';
import { findCoreDir } from '../fs/paths.mjs';

// Upstream calls `findCoreDir()` bare. Anchoring the walk at the repo root
// instead keeps this suite immune to a sibling suite's `process.chdir`.
const REPO = path.resolve(import.meta.dirname, '..', '..', '..', '..');

describe('findComponentSource resolves .ts-authored sources', () => {
	const coreDir = findCoreDir(REPO);

	it('finds a util authored as a .ts file (not just .svelte)', () => {
		const src = findComponentSource(coreDir, 'useMediaQuery');
		expect(src).toBeTruthy();
		expect(src.endsWith('use-media-query.svelte.ts')).toBe(true);
	});

	it('still finds a component authored as .svelte', () => {
		const src = findComponentSource(coreDir, 'Button');
		expect(src).toBeTruthy();
		expect(src.endsWith('.svelte')).toBe(true);
	});
});

describe('resolveImportPath reproduces authored util importPaths', () => {
	const coreDir = findCoreDir(REPO);

	// Representative sample of core utils whose sources are `.ts` files. Before
	// the `.ts` fix these fell back to bare `@astryx-svelte/core`; the derived
	// subpath must now match the value each util's doc currently authors.
	// `useResizable` is the exception, and deliberately kept: it lives under
	// `components/resizable/`, which this port publishes no subpath for.
	const cases = [
		['useMediaQuery', `${CORE_PACKAGE}/hooks`],
		['useResizable', CORE_PACKAGE],
		['useTheme', `${CORE_PACKAGE}/theme`],
		['useFocusTrap', `${CORE_PACKAGE}/hooks`],
		['useOverflow', `${CORE_PACKAGE}/hooks`]
	];

	for (const [name, expected] of cases) {
		it(`${name} derives ${expected}`, () => {
			expect(resolveImportPath(coreDir, name)).toBe(expected);
		});
	}

	it('never derives a subpath core does not declare', () => {
		const pkg = JSON.parse(fs.readFileSync(path.join(coreDir, 'package.json'), 'utf-8'));
		const declared = new Set(
			Object.keys(pkg.exports ?? {}).map((k) =>
				k === '.' ? CORE_PACKAGE : `${CORE_PACKAGE}/${k.slice(2)}`
			)
		);
		for (const [name] of cases) {
			expect(declared.has(resolveImportPath(coreDir, name))).toBe(true);
		}
	});
});
