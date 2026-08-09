/**
 * @file Validates that every CLI-discoverable component produces a correct
 * import hint — one that names a specifier `@astryx-svelte/core`'s
 * `package.json#exports` actually declares.
 *
 * This guards against:
 * - Import paths pointing to non-existent exports
 * - Case mismatches (Theme vs theme)
 * - Group names leaking as import paths
 * - resolveImportPath regressions
 *
 * Runs against the real packages/core source, not mocks.
 *
 * ## Ported case count
 *
 * 6 `it(` literals, matching upstream one for one. **The premise of the first
 * one is inverted, and deliberately.** Upstream asserts every component
 * resolves to a subpath and *never* to the bare package root, because it
 * publishes a subpath per component. This port publishes ONE component barrel:
 * core's exports are `.`, `./theme`, `./theme/define`, `./theme/syntax`,
 * `./hooks`, `./naming`, `./utils`, `./i18n`, `./locales/*.json`, `./base.css`,
 * so the bare root is where `Button` genuinely lives and 162 of 166 discovered
 * components resolve to it. The case keeps its slot with the assertion that
 * still catches the regression it was written for: the derived specifier must
 * be one core declares — never a fabricated subpath, and never a group name.
 *
 * The other five port with only the identity strings changed (plus the source
 * root, `<core>/src/lib` rather than `<core>/src`), and the `--detail brief`
 * table asserts the exact `← from '…'` cell so a wrong subpath cannot pass on a
 * prefix match.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolveImportPath, discoverComponents, findComponentSource } from './component/index.mjs';
import { CORE_PACKAGE } from '../../../foundation/discovery/component-discovery.mjs';
import { findCoreDir } from '../../../foundation/fs/paths.mjs';
import { runCli } from '../../../test-utils/run-cli.mjs';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');

describe('import hint correctness', () => {
	const coreDir = findCoreDir(REPO_ROOT);
	const pkg = JSON.parse(fs.readFileSync(path.join(coreDir, 'package.json'), 'utf-8'));
	const validExports = new Set(
		Object.keys(pkg.exports || {})
			.filter((k) => k !== '.' && k !== './package.json')
			.map((k) => k.replace('./', ''))
	);

	const componentMap = discoverComponents(coreDir);

	// Collect all individual component names (non-group)
	const individualComponents = [];
	for (const members of Object.values(componentMap)) {
		for (const member of members) {
			individualComponents.push(member);
		}
	}

	describe('every component resolves to a specifier core declares', () => {
		for (const name of individualComponents) {
			it(`${name} resolves to the core barrel or a declared subpath`, () => {
				const importPath = resolveImportPath(coreDir, name);

				// Must never be empty
				expect(importPath).toBeTruthy();

				// The bare root is a correct answer here (one component barrel);
				// anything else must be a subpath package.json actually exports.
				if (importPath !== CORE_PACKAGE) {
					const subpath = importPath.replace(`${CORE_PACKAGE}/`, '');
					expect(validExports.has(subpath)).toBe(true);
				}
			});
		}
	});

	describe('import hint case matches package.json exports exactly', () => {
		for (const name of individualComponents) {
			it(`${name} import path has correct casing`, () => {
				const importPath = resolveImportPath(coreDir, name);
				if (importPath === CORE_PACKAGE) return; // skip bare root

				const subpath = importPath.replace(`${CORE_PACKAGE}/`, '');

				// Must be an exact (case-sensitive) match to an export key
				const exportKeys = Object.keys(pkg.exports || {}).map((k) => k.replace('./', ''));
				expect(exportKeys).toContain(subpath);
			});
		}
	});

	describe('CLI --detail brief shows correct import path', () => {
		// A representative set across the patterns this port really has: the
		// component barrel, the theme subpath, and the i18n subpath.
		const representative = [
			{ name: 'Button', expected: CORE_PACKAGE },
			{ name: 'Theme', expected: `${CORE_PACKAGE}/theme` },
			{ name: 'CheckboxInput', expected: CORE_PACKAGE },
			{ name: 'Table', expected: CORE_PACKAGE },
			{ name: 'TextInput', expected: CORE_PACKAGE },
			{ name: 'Layout', expected: CORE_PACKAGE },
			{ name: 'MediaTheme', expected: `${CORE_PACKAGE}/theme` },
			{ name: 'Card', expected: CORE_PACKAGE },
			{ name: 'SyntaxTheme', expected: `${CORE_PACKAGE}/theme` },
			{ name: 'TabList', expected: CORE_PACKAGE }
		];

		for (const { name, expected } of representative) {
			it(`astryx-svelte component ${name} --detail brief shows ${expected}`, async () => {
				const result = await runCli(['component', name, '--detail', 'brief'], REPO_ROOT);
				expect(result.code).toBe(0);
				// Exact cell, so a longer subpath cannot satisfy a bare-root expectation.
				expect(result.stdout).toContain(`← from '${expected}'`);
			});
		}
	});

	describe('CLI --detail full shows import hint', () => {
		const representative = ['Button', 'Theme', 'Table', 'CheckboxInput'];

		for (const name of representative) {
			it(`astryx-svelte component ${name} (full) includes import statement`, async () => {
				const result = await runCli(['component', name], REPO_ROOT);
				expect(result.code).toBe(0);
				// The full view prints: **Import:** `import {X} from '...';`
				expect(result.stdout).toMatch(/import\s*\{/);
				expect(result.stdout).toContain(CORE_PACKAGE);
			});
		}
	});

	describe('group names do NOT resolve to incorrect import paths', () => {
		const groups = ['Checkbox', 'Radio', 'Chat', 'Tabs', 'Resizable', 'Utilities'];

		for (const group of groups) {
			it(`group "${group}" does not produce a subpath import`, () => {
				// Groups should either fail to find a source file (returning the bare
				// root) or correctly return the group-level export if one exists.
				const importPath = resolveImportPath(coreDir, group);
				if (importPath !== CORE_PACKAGE) {
					const subpath = importPath.replace(`${CORE_PACKAGE}/`, '');
					expect(validExports.has(subpath)).toBe(true);
				}
			});
		}
	});

	describe('import path matches actual source file location', () => {
		for (const name of individualComponents) {
			it(`${name} import path leads to its source directory`, () => {
				const source = findComponentSource(coreDir, name);
				if (!source) return; // some sub-components don't have direct source

				const importPath = resolveImportPath(coreDir, name);
				if (importPath === CORE_PACKAGE) return;

				const subpath = importPath.replace(`${CORE_PACKAGE}/`, '');
				// Every source here sits one level deeper than upstream's.
				const srcDir = path.join(coreDir, 'src', 'lib');
				const relToSrc = path.relative(srcDir, source);
				const topDir = relToSrc.split(path.sep)[0];

				// The import subpath should match the top-level source directory
				// (case-insensitive check since theme/Theme is valid).
				expect(subpath.toLowerCase()).toBe(topDir.toLowerCase());
			});
		}
	});
});
