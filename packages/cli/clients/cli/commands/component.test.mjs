/**
 * @file Tests for the discovery/search surface the `component` command
 * re-exports (`./component/index.mjs` is what agent-docs, doc generation and
 * these suites import from).
 *
 * ## Ported case count
 *
 * 43, matching upstream one for one. Every case survives; the fixtures move,
 * because upstream's discovery is a path probe and this port's is an index
 * read (see `foundation/discovery/component-discovery.mjs`'s header):
 *
 *   - fixture cores are `src/lib/<dir>/<Name>.doc.mjs`, not
 *     `src/<Name>/XDS<Name>.tsx`, and a component is discovered when its **doc**
 *     exists;
 *   - `findComponentSource` follows the **source barrel**, so its four fixtures
 *     ship an `index.ts` instead of a conventionally-named file;
 *   - the two XDS-prefix-migration cases have no prefix to migrate here. They
 *     keep their slots pointed at the equivalent hazards this port really has:
 *     a source file whose name does not match its export (`button.svelte` →
 *     `Button`), and two exports sharing one directory (`Avatar` and
 *     `AvatarStatusDot` both under `avatar/`) — the shape that made
 *     name → directory not a function in the first place.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
	discoverComponents,
	discoverExternalComponentsGrouped,
	findExternalComponentDoc,
	findComponentReadme,
	findComponentSource,
	levenshteinDistance,
	findClosestComponents
} from './component/index.mjs';
import { __resetDiscoveryCache } from '../../../foundation/discovery/component-discovery.mjs';

const CLI_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const CORE = path.resolve(CLI_ROOT, '..', 'core');

let tmpDir;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(CLI_ROOT, '.astryx-component-test-'));
});

afterEach(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
	__resetDiscoveryCache();
});

/**
 * Write a file, creating its directory.
 * @param {string} file
 * @param {string} content
 */
function write(file, content) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, content);
}

/** The source root every fixture core writes into. */
function srcLib() {
	return path.join(tmpDir, 'src', 'lib');
}

describe('discoverComponents', () => {
	it('reads group from .doc.mjs and groups components', () => {
		const srcDir = srcLib();

		// Button with group: 'Buttons'
		write(
			path.join(srcDir, 'button', 'Button.doc.mjs'),
			"export const docs = {\n  name: 'Button',\n  group: 'Buttons',\n};"
		);

		// IconButton with group: 'Buttons'
		write(
			path.join(srcDir, 'icon-button', 'IconButton.doc.mjs'),
			"export const docs = {\n  name: 'IconButton',\n  group: 'Buttons',\n};"
		);

		// Avatar with no group
		write(path.join(srcDir, 'avatar', 'Avatar.doc.mjs'), "export const docs = {name: 'Avatar'};");

		const result = discoverComponents(tmpDir);

		expect(result).toEqual({
			Avatar: ['Avatar'],
			Buttons: ['Button', 'IconButton']
		});
	});

	it('sorts groups and ungrouped components alphabetically', () => {
		const srcDir = srcLib();

		write(path.join(srcDir, 'zebra', 'Zebra.doc.mjs'), "export const docs = {name: 'Zebra'};");
		write(path.join(srcDir, 'alpha', 'Alpha.doc.mjs'), "export const docs = {name: 'Alpha'};");
		write(
			path.join(srcDir, 'middle', 'Middle.doc.mjs'),
			"export const docs = {\n  name: 'Middle',\n  group: 'Inputs',\n};"
		);

		const result = discoverComponents(tmpDir);
		const keys = Object.keys(result);

		expect(keys).toEqual(['Alpha', 'Inputs', 'Zebra']);
	});

	it('skips test files', () => {
		const srcDir = srcLib();
		const buttonDir = path.join(srcDir, 'button');
		write(path.join(buttonDir, 'button.svelte'), '');
		write(path.join(buttonDir, 'button.test.ts'), '');
		// A doc parked under __tests__ is a fixture, not a published component.
		write(path.join(buttonDir, '__tests__', 'Ghost.doc.mjs'), 'export const docs = {};');
		write(path.join(buttonDir, 'Button.doc.mjs'), "export const docs = {name: 'Button'};");

		const result = discoverComponents(tmpDir);
		expect(result).toEqual({ Button: ['Button'] });
	});

	it('skips components without a .doc.mjs file', () => {
		const srcDir = srcLib();
		write(path.join(srcDir, 'custom-widget', 'custom-widget.svelte'), '');

		const result = discoverComponents(tmpDir);
		expect(result).toEqual({});
	});

	it('skips hooks/utils directories', () => {
		const srcDir = srcLib();
		write(
			path.join(srcDir, 'hooks', 'UseThing.doc.mjs'),
			"export const docs = {name: 'UseThing'};"
		);
		write(
			path.join(srcDir, 'utils', 'Formatter.doc.mjs'),
			"export const docs = {name: 'Formatter'};"
		);

		const result = discoverComponents(tmpDir);
		expect(result).toEqual({});
	});

	// Upstream's XDS-prefix migration case. There is no prefix here; the hazard
	// this port has instead is that the source file is kebab-case and never
	// matches its export name, so discovery must key off the doc alone.
	it('discovers a component whose source filename does not match its export', () => {
		const srcDir = srcLib();
		const buttonDir = path.join(srcDir, 'button');
		write(path.join(buttonDir, 'button.svelte'), '');
		write(path.join(buttonDir, 'Button.doc.mjs'), "export const docs = {name: 'Button'};");

		const result = discoverComponents(tmpDir);
		expect(result).toEqual({ Button: ['Button'] });
	});

	// Upstream's "mix of prefixed and bare" case. The equivalent mix here is one
	// export with a directory of its own and one sharing a sibling's — the shape
	// that makes name → directory not a function.
	it('discovers a mix of own-directory and co-located components', () => {
		const srcDir = srcLib();

		const avatarDir = path.join(srcDir, 'avatar');
		write(path.join(avatarDir, 'avatar.svelte'), '');
		write(path.join(avatarDir, 'avatar-status-dot.svelte'), '');
		write(path.join(avatarDir, 'Avatar.doc.mjs'), "export const docs = {name: 'Avatar'};");
		write(
			path.join(avatarDir, 'AvatarStatusDot.doc.mjs'),
			"export const docs = {name: 'AvatarStatusDot'};"
		);

		const cardDir = path.join(srcDir, 'card');
		write(path.join(cardDir, 'card.svelte'), '');
		write(path.join(cardDir, 'Card.doc.mjs'), "export const docs = {name: 'Card'};");

		const result = discoverComponents(tmpDir);
		expect(result).toEqual({
			Avatar: ['Avatar'],
			AvatarStatusDot: ['AvatarStatusDot'],
			Card: ['Card']
		});
	});

	it('does not surface bare PascalCase helper files without a doc', () => {
		const srcDir = srcLib();
		const overlayDir = path.join(srcDir, 'overlay');
		// Real component (documented) + an internal helper (no doc).
		write(path.join(overlayDir, 'overlay.svelte'), '');
		write(path.join(overlayDir, 'OverlayScrim.svelte'), '');
		write(path.join(overlayDir, 'Overlay.doc.mjs'), "export const docs = {name: 'Overlay'};");

		const result = discoverComponents(tmpDir);
		// OverlayScrim has no doc, so it must NOT be surfaced as a component.
		expect(result).toEqual({ Overlay: ['Overlay'] });
	});

	it('finds the source file for both same-named and aliased exports', () => {
		const srcDir = srcLib();

		const buttonDir = path.join(srcDir, 'button');
		write(path.join(buttonDir, 'button.svelte'), '<!-- button -->');
		write(path.join(buttonDir, 'Button.doc.mjs'), "export const docs = {name: 'Button'};");

		const menuDir = path.join(srcDir, 'dropdown-menu');
		write(path.join(menuDir, 'dropdown-menu-item.svelte'), '<!-- item -->');

		// The barrel is the index: `BreadcrumbMenuItem` is an ALIAS of a file
		// named for something else entirely, which no filename rule can resolve.
		write(
			path.join(srcDir, 'index.ts'),
			[
				"export { default as Button } from './button/button.svelte';",
				"export { default as BreadcrumbMenuItem } from './dropdown-menu/dropdown-menu-item.svelte';",
				''
			].join('\n')
		);

		expect(findComponentSource(tmpDir, 'Button')).toBe(path.join(buttonDir, 'button.svelte'));
		expect(findComponentSource(tmpDir, 'BreadcrumbMenuItem')).toBe(
			path.join(menuDir, 'dropdown-menu-item.svelte')
		);
	});
});

describe('findComponentReadme', () => {
	it('finds direct .doc.mjs: src/lib/{dir}/{Name}.doc.mjs', () => {
		const compDir = path.join(srcLib(), 'button');
		write(path.join(compDir, 'Button.doc.mjs'), 'export const docs = {}');

		const result = findComponentReadme(tmpDir, 'Button');
		expect(result).toBe(path.join(compDir, 'Button.doc.mjs'));
	});

	it('finds nested .doc.mjs: src/lib/*/{dir}/{Name}.doc.mjs', () => {
		const nestedDir = path.join(srcLib(), 'layout', 'container');
		write(path.join(nestedDir, 'Container.doc.mjs'), 'export const docs = {}');

		const result = findComponentReadme(tmpDir, 'Container');
		expect(result).toBe(path.join(nestedDir, 'Container.doc.mjs'));
	});

	it('finds parent .doc.mjs for sub-components', () => {
		const srcDir = srcLib();
		const stackDir = path.join(srcDir, 'stack');
		write(path.join(stackDir, 'stack-item.svelte'), '');
		write(path.join(stackDir, 'Stack.doc.mjs'), 'export const docs = {}');
		// StackItem is exported but undocumented; the barrel says where it lives
		// and the walk up finds the directory's doc.
		write(
			path.join(srcDir, 'index.ts'),
			"export { default as StackItem } from './stack/stack-item.svelte';\n"
		);

		const result = findComponentReadme(tmpDir, 'StackItem');
		expect(result).toBe(path.join(stackDir, 'Stack.doc.mjs'));
	});

	it('ignores README.md files', () => {
		const compDir = path.join(srcLib(), 'button');
		write(path.join(compDir, 'README.md'), '# Button');

		const result = findComponentReadme(tmpDir, 'Button');
		expect(result).toBeNull();
	});

	it('returns null when no doc found', () => {
		fs.mkdirSync(srcLib(), { recursive: true });
		expect(findComponentReadme(tmpDir, 'NonExistent')).toBeNull();
	});
});

describe('findComponentSource', () => {
	it('finds direct source: src/lib/{dir}/{file}.svelte', () => {
		const srcDir = srcLib();
		const compDir = path.join(srcDir, 'button');
		write(path.join(compDir, 'button.svelte'), '');
		write(
			path.join(srcDir, 'index.ts'),
			"export { default as Button } from './button/button.svelte';\n"
		);

		const result = findComponentSource(tmpDir, 'Button');
		expect(result).toBe(path.join(compDir, 'button.svelte'));
	});

	it('finds nested source: src/lib/{dir}/{dir}/{file}.svelte', () => {
		const srcDir = srcLib();
		const nestedDir = path.join(srcDir, 'layout', 'inner');
		write(path.join(nestedDir, 'layout.svelte'), '');
		write(
			path.join(srcDir, 'index.ts'),
			"export { default as Layout } from './layout/inner/layout.svelte';\n"
		);

		const result = findComponentSource(tmpDir, 'Layout');
		expect(result).toBe(path.join(nestedDir, 'layout.svelte'));
	});

	it('finds a .ts-authored source through a subpath barrel', () => {
		// Upstream's "deep fallback" — the deepest place its path probe still
		// looked. The equivalent reach here is a SECOND barrel: core publishes
		// nine subpaths, and a util reachable only from `hooks/index.ts` must
		// resolve just as a component on the root barrel does.
		const srcDir = srcLib();
		const hooksDir = path.join(srcDir, 'hooks');
		write(path.join(hooksDir, 'use-media-query.svelte.ts'), '');
		write(
			path.join(hooksDir, 'index.ts'),
			"export { useMediaQuery } from './use-media-query.svelte.js';\n"
		);

		const result = findComponentSource(tmpDir, 'useMediaQuery');
		expect(result).toBe(path.join(hooksDir, 'use-media-query.svelte.ts'));
	});

	it('returns null when source not found', () => {
		fs.mkdirSync(srcLib(), { recursive: true });
		expect(findComponentSource(tmpDir, 'NonExistent')).toBeNull();
	});
});

describe('levenshteinDistance', () => {
	it('returns 0 for identical strings', () => {
		expect(levenshteinDistance('button', 'button')).toBe(0);
	});

	it('returns correct distance for single edit', () => {
		expect(levenshteinDistance('button', 'buton')).toBe(1);
	});

	it('returns correct distance for multiple edits', () => {
		expect(levenshteinDistance('button', 'butan')).toBe(2);
	});

	it('handles empty strings', () => {
		expect(levenshteinDistance('', 'abc')).toBe(3);
		expect(levenshteinDistance('abc', '')).toBe(3);
		expect(levenshteinDistance('', '')).toBe(0);
	});

	it('handles completely different strings', () => {
		expect(levenshteinDistance('abc', 'xyz')).toBe(3);
	});
});

describe('findClosestComponents', () => {
	const components = {
		Action: ['Button', 'CloseButton', 'Link'],
		Form: ['TextInput', 'CheckboxInput', 'Switch'],
		Display: ['Avatar', 'Badge', 'Text']
	};

	it('finds exact match (distance 0)', () => {
		const matches = findClosestComponents('Button', components);
		expect(matches[0]).toEqual({ name: 'Button', distance: 0 });
	});

	it('finds close match for misspelling', () => {
		const matches = findClosestComponents('buton', components);
		expect(matches.length).toBeGreaterThan(0);
		expect(matches[0].name).toBe('Button');
		expect(matches[0].distance).toBe(1);
	});

	it('is case-insensitive', () => {
		const matches = findClosestComponents('BUTTON', components);
		expect(matches[0]).toEqual({ name: 'Button', distance: 0 });
	});

	it('returns empty array for no close matches', () => {
		const matches = findClosestComponents('zzzzzzzzz', components);
		expect(matches).toEqual([]);
	});

	it('returns multiple matches when ambiguous', () => {
		// "Butten" is close to "Button" (distance 1) and could be near others.
		const matches = findClosestComponents('Butten', components);
		expect(matches.length).toBeGreaterThanOrEqual(1);
		expect(matches[0].name).toBe('Button');
		// With maxDistance=3, "Badge" (distance 5) won't match,
		// but let's verify multiple matches with a wider net.
		const wideMatches = findClosestComponents('Butten', components, 5);
		expect(wideMatches.length).toBeGreaterThan(1);
	});

	it('respects maxDistance parameter', () => {
		const matches = findClosestComponents('buton', components, 0);
		expect(matches).toEqual([]);
	});
});

describe('discoverExternalComponentsGrouped', () => {
	it('reads group: from doc files and groups components', () => {
		const docsDir = path.join(tmpDir, 'src');

		write(
			path.join(docsDir, 'AppShell', 'AppShell.doc.mjs'),
			"export const docs = {\n  name: 'AppShell',\n  group: 'App Chrome',\n};"
		);
		write(
			path.join(docsDir, 'SideNav', 'SideNav.doc.mjs'),
			"export const docs = {\n  name: 'SideNav',\n  group: 'App Chrome',\n};"
		);
		write(path.join(docsDir, 'Diff', 'Diff.doc.mjs'), "export const docs = {\n  name: 'Diff',\n};");

		const result = discoverExternalComponentsGrouped(docsDir);
		expect(result).toEqual({
			'App Chrome': ['AppShell', 'SideNav'],
			Diff: ['Diff']
		});
	});

	it('returns empty object for nonexistent directory', () => {
		const result = discoverExternalComponentsGrouped(path.join(tmpDir, 'nope'));
		expect(result).toEqual({});
	});

	it('skips hidden components', () => {
		const docsDir = path.join(tmpDir, 'src');
		write(
			path.join(docsDir, 'Internal', 'Internal.doc.mjs'),
			"export const docs = {\n  name: 'Internal',\n  hidden: true,\n};"
		);
		write(path.join(docsDir, 'Visible.doc.mjs'), "export const docs = {\n  name: 'Visible',\n};");

		const result = discoverExternalComponentsGrouped(docsDir);
		expect(result).toEqual({ Visible: ['Visible'] });
	});

	it('sorts groups and ungrouped alphabetically', () => {
		const docsDir = path.join(tmpDir, 'src');

		write(
			path.join(docsDir, 'Zebra', 'Zebra.doc.mjs'),
			"export const docs = {\n  name: 'Zebra',\n  group: 'Animals',\n};"
		);
		write(
			path.join(docsDir, 'Alpha', 'Alpha.doc.mjs'),
			"export const docs = {\n  name: 'Alpha',\n};"
		);
		write(
			path.join(docsDir, 'Bear', 'Bear.doc.mjs'),
			"export const docs = {\n  name: 'Bear',\n  group: 'Animals',\n};"
		);

		const result = discoverExternalComponentsGrouped(docsDir);
		const keys = Object.keys(result);
		expect(keys).toEqual(['Alpha', 'Animals']);
		expect(result['Animals']).toEqual(['Bear', 'Zebra']);
	});
});

describe('findExternalComponentDoc', () => {
	it('finds a doc file by component name', () => {
		const docsDir = path.join(tmpDir, 'src');
		const docPath = path.join(docsDir, 'Employee', 'EmployeeHoverCard.doc.mjs');
		write(docPath, '');

		const result = findExternalComponentDoc(docsDir, 'EmployeeHoverCard');
		expect(result).toBe(docPath);
	});

	it('searches nested directories', () => {
		const docsDir = path.join(tmpDir, 'src');
		const docPath = path.join(docsDir, 'nested', 'deep', 'DeepThing.doc.mjs');
		write(docPath, '');

		const result = findExternalComponentDoc(docsDir, 'DeepThing');
		expect(result).toBe(docPath);
	});

	it('returns null when component not found', () => {
		const docsDir = path.join(tmpDir, 'src');
		fs.mkdirSync(docsDir, { recursive: true });

		const result = findExternalComponentDoc(docsDir, 'NonExistent');
		expect(result).toBeNull();
	});

	it('returns null for nonexistent directory', () => {
		const result = findExternalComponentDoc(path.join(tmpDir, 'nope'), 'Foo');
		expect(result).toBeNull();
	});

	it('skips node_modules and __tests__', () => {
		const docsDir = path.join(tmpDir, 'src');
		write(path.join(docsDir, 'node_modules', 'dep', 'Hidden.doc.mjs'), '');

		const result = findExternalComponentDoc(docsDir, 'Hidden');
		expect(result).toBeNull();
	});
});

describe('searchComponents', () => {
	it('finds Collapsible when searching "accordion"', async () => {
		const { searchComponents, discoverComponents } = await import('./component/index.mjs');
		const components = discoverComponents(CORE);
		const results = await searchComponents('accordion', CORE, components);
		expect(results.length).toBeGreaterThan(0);
		expect(results[0].name).toBe('Collapsible');
		expect(results[0].score).toBe(90);
	});

	it('finds Dialog when searching "modal"', async () => {
		const { searchComponents, discoverComponents } = await import('./component/index.mjs');
		const components = discoverComponents(CORE);
		const results = await searchComponents('modal', CORE, components);
		const dialog = results.find((r) => r.name === 'Dialog');
		expect(dialog).toBeDefined();
		expect(dialog.score).toBe(90);
	});

	it('returns multiple matches for ambiguous terms like "select"', async () => {
		const { searchComponents, discoverComponents } = await import('./component/index.mjs');
		const components = discoverComponents(CORE);
		const results = await searchComponents('select', CORE, components);
		const top90 = results.filter((r) => r.score === 90);
		expect(top90.length).toBeGreaterThan(1);
		const names = top90.map((r) => r.name);
		expect(names).toContain('Selector');
	});

	it('finds exact name matches with score 100', async () => {
		const { searchComponents, discoverComponents } = await import('./component/index.mjs');
		const components = discoverComponents(CORE);
		const results = await searchComponents('Button', CORE, components);
		expect(results[0].name).toBe('Button');
		expect(results[0].score).toBe(100);
	});

	it('returns empty array for complete gibberish', async () => {
		const { searchComponents, discoverComponents } = await import('./component/index.mjs');
		const components = discoverComponents(CORE);
		const results = await searchComponents('zzzzzzzzzzz', CORE, components);
		expect(results.length).toBe(0);
	});
});
