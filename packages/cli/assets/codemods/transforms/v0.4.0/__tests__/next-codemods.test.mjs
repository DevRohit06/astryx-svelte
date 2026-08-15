/**
 * @file Colocated tests for the two v0.4.0 rename codemods.
 *
 * Ported from upstream's `transforms/v0.4.0/__tests__/next-codemods.test.mjs`.
 *
 * ## Ported case count
 *
 * Upstream has 13 — 7 for `rename-dropdown-menu-radio-dot-target`, 6 for
 * `rename-menu-divider-data-types`. **All 13 are here, all live.** Fixtures move
 * from TSX to the shape a Svelte consumer writes: a rendered
 * `<DropdownMenuDivider />` is markup rather than JSX, and the import source is
 * `@astryx-svelte/core` rather than upstream's per-component subpaths.
 *
 * Four cases beyond upstream's are marked `[svelte]` and cover the two surfaces
 * a React consumer does not have — a `class` attribute in markup and a `<style>`
 * block — plus the two decisions those forced: markup *text children* stay out
 * of scope (upstream's `StringLiteral` selector does not match `JSXText`
 * either), and a name rendered as a component in markup is a value even though
 * the import that declares it sits in a different part of the tree.
 */

import { describe, it, expect } from 'vitest';
import MagicString from 'magic-string';
import { walk } from 'zimmerframe';
import renameRadioDot from '../rename-dropdown-menu-radio-dot-target.mjs';
import renameDividerTypes from '../rename-menu-divider-data-types.mjs';

/** The api the runner builds (`assets/codemods/run-codemod.mjs`), minus the logging no-ops. */
async function makeApi() {
	const { parse } = await import('svelte/compiler');
	return {
		magicString: MagicString,
		parseSvelte: parse,
		walk,
		jscodeshift: undefined,
		stats: () => {},
		report: () => {}
	};
}

async function apply(transform, source, path = 'demo.ts') {
	const api = await makeApi();
	return transform({ source, path }, api) ?? source;
}

describe('rename-dropdown-menu-radio-dot-target', () => {
	it('renames the theme target key in a defineTheme components map', async () => {
		const input = `import { defineTheme } from '@astryx-svelte/core/theme';
export const theme = defineTheme({
	name: 'brand',
	components: {
		'dropdown-menu-radio-dot': { base: { backgroundColor: 'var(--color-accent)' } }
	}
});`;
		const output = await apply(renameRadioDot, input);
		expect(output).toContain("'radio-indicator-dot':");
		// The old name survives only inside the TODO comment the rename attaches.
		expect(output).not.toContain("'dropdown-menu-radio-dot':");
	});

	it('warns that the new target is app-wide, not menu-only', async () => {
		const input = `const components = {
	'dropdown-menu-radio-dot': { base: { width: '10px' } }
};`;
		const output = await apply(renameRadioDot, input);
		// The rename cannot preserve scope — there is no menu-only dot element
		// left — so the author has to decide, and must be told.
		expect(output).toContain('TODO(astryx upgrade)');
		expect(output).toContain('EVERY radio dot');
	});

	it('renames the rendered class inside a selector string', async () => {
		const input = `const sel = '.astryx-dropdown-menu-radio-dot';
const nested = '.astryx-dropdown-menu-radio .astryx-dropdown-menu-radio-dot';`;
		const output = await apply(renameRadioDot, input);
		expect(output).toContain("'.astryx-radio-indicator-dot'");
		expect(output).toContain('.astryx-dropdown-menu-radio .astryx-radio-indicator-dot');
	});

	it('renames the class inside a template literal', async () => {
		const input = 'const css = `.astryx-dropdown-menu-radio-dot { background: ${c}; }`;';
		const output = await apply(renameRadioDot, input);
		expect(output).toContain('.astryx-radio-indicator-dot {');
		expect(output).not.toContain('astryx-dropdown-menu-radio-dot');
	});

	it('leaves the surviving dropdown-menu-radio target alone', async () => {
		// Only the DOT target was removed; the circle still carries the
		// menu-specific target, so a theme keyed on it must not be rewritten.
		const input = `const components = {
	'dropdown-menu-radio': { base: { borderWidth: '2px' } }
};`;
		const output = await apply(renameRadioDot, input);
		expect(output).toContain("'dropdown-menu-radio'");
		expect(output).not.toContain('radio-indicator');
		expect(output).not.toContain('TODO(astryx upgrade)');
	});

	it('is a no-op on files that never mention the target', async () => {
		const input = `const components = { button: { base: { fontWeight: '600' } } };`;
		expect(await apply(renameRadioDot, input)).toBe(input);
	});

	it('is idempotent', async () => {
		const input = `const components = {
	'dropdown-menu-radio-dot': { base: { width: '10px' } }
};`;
		const once = await apply(renameRadioDot, input);
		expect(await apply(renameRadioDot, once)).toBe(once);
	});

	it('[svelte] renames the class in a markup class attribute', async () => {
		const input = `<div class="astryx-dropdown-menu-radio-dot"></div>`;
		const output = await apply(renameRadioDot, input, 'Demo.svelte');
		expect(output).toBe(`<div class="astryx-radio-indicator-dot"></div>`);
	});

	it('[svelte] renames the class inside a style block', async () => {
		const input = `<div></div>

<style>
	:global(.astryx-dropdown-menu-radio-dot) {
		background: red;
	}
</style>
`;
		const output = await apply(renameRadioDot, input, 'Demo.svelte');
		expect(output).toContain(':global(.astryx-radio-indicator-dot)');
		expect(output).not.toContain('astryx-dropdown-menu-radio-dot');
	});

	it('[svelte] leaves markup text children alone, as upstream leaves JSXText', async () => {
		const input = `<p>the dropdown-menu-radio-dot target</p>`;
		expect(await apply(renameRadioDot, input, 'Demo.svelte')).toBe(input);
	});
});

describe('rename-menu-divider-data-types', () => {
	it('renames a type-only import and its type references', async () => {
		const input = `import type { DropdownMenuOption, DropdownMenuDivider } from '@astryx-svelte/core';

const rule: DropdownMenuDivider = { type: 'divider' };
const options: DropdownMenuOption[] = [rule];`;
		const output = await apply(renameDividerTypes, input);
		expect(output).toContain('DropdownMenuDividerData');
		expect(output).not.toMatch(/DropdownMenuDivider\b(?!Data)/);
	});

	it('renames the ContextMenu and Breadcrumbs aliases too', async () => {
		const input = `import type { ContextMenuDivider } from '@astryx-svelte/core';
import type { BreadcrumbMenuDivider } from '@astryx-svelte/core';
const a: ContextMenuDivider = { type: 'divider' };
const b: BreadcrumbMenuDivider = { type: 'divider' };`;
		const output = await apply(renameDividerTypes, input);
		expect(output).toContain('ContextMenuDividerData');
		expect(output).toContain('BreadcrumbMenuDividerData');
	});

	it('leaves the new component alone', async () => {
		// Upstream's fixture renders JSX; the Svelte consumer renders markup, which
		// is the whole reason this transform walks the fragment as well as the
		// script.
		const input = `<script lang="ts">
	import { DropdownMenu, DropdownMenuItem, DropdownMenuDivider } from '@astryx-svelte/core';
</script>

<DropdownMenu button={{ label: 'Actions' }}>
	<DropdownMenuItem label="Edit" />
	<DropdownMenuDivider />
</DropdownMenu>
`;
		const output = await apply(renameDividerTypes, input, 'Menu.svelte');
		expect(output).not.toContain('DropdownMenuDividerData');
	});

	it('renames an inline type specifier without touching a sibling value import', async () => {
		const input = `import { DropdownMenu, type DropdownMenuDivider } from '@astryx-svelte/core';
const d: DropdownMenuDivider = { type: 'divider' };`;
		const output = await apply(renameDividerTypes, input);
		expect(output).toContain('type DropdownMenuDividerData');
		expect(output).toContain('const d: DropdownMenuDividerData');
		expect(output).toContain('DropdownMenu,');
	});

	it('preserves an alias', async () => {
		const input = `import type { DropdownMenuDivider as MenuRule } from '@astryx-svelte/core';
const d: MenuRule = { type: 'divider' };`;
		const output = await apply(renameDividerTypes, input);
		expect(output).toContain('DropdownMenuDividerData as MenuRule');
		expect(output).toContain('const d: MenuRule');
	});

	it('ignores a same-named type from another package', async () => {
		const input = `import type { DropdownMenuDivider } from 'some-other-ui';
const d: DropdownMenuDivider = { type: 'divider' };`;
		const output = await apply(renameDividerTypes, input);
		expect(output).not.toContain('DropdownMenuDividerData');
	});

	it('[svelte] renames a type-only import inside a component script', async () => {
		// Without this, every `.svelte` assertion in this file is a no-op check that
		// would pass just as well if the transform never found the import at all.
		const input = `<script lang="ts">
	import type { DropdownMenuDivider } from '@astryx-svelte/core';

	const rule: DropdownMenuDivider = { type: 'divider' };
</script>
`;
		const output = await apply(renameDividerTypes, input, 'Menu.svelte');
		expect(output).toContain('import type { DropdownMenuDividerData }');
		expect(output).toContain('const rule: DropdownMenuDividerData');
	});

	it('[svelte] treats a name rendered in markup as a value, not a type', async () => {
		// The import sits in the script and the render sits in the fragment, so
		// this only works because the walk finishes before any decision is made.
		const input = `<script lang="ts">
	import { DropdownMenuDivider } from '@astryx-svelte/core';
</script>

<DropdownMenuDivider />
`;
		expect(await apply(renameDividerTypes, input, 'Menu.svelte')).toBe(input);
	});
});
