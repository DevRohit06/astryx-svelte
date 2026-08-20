import { describe, it, expect } from 'vitest';
import { themeDataAttributes, themeProps } from '$lib/internal/theme-props.js';

/**
 * Astryx's `src/utils/themeProps.test.ts`, ported case for case — **10 upstream
 * `it` declarations at v0.4.5, 10 here**, in upstream's order and under
 * upstream's titles. Nothing dropped, nothing added.
 *
 * A **server** project file (`*.test.ts`), as upstream's is: the module is pure
 * string building with no DOM and no component in it, so it never boots
 * Chromium.
 *
 * ## Two translations, neither of them a dropped case
 *
 * **Where the module lives.** Upstream's is `src/utils/themeProps.ts`; this port
 * placed it at `src/lib/internal/theme-props.ts` alongside `naming.ts` and
 * `sx.ts`. That is a recorded, deliberate divergence (see port/todo.md,
 * "Consolidate two homes for one upstream dir"), so the only thing that changes
 * here is the import specifier.
 *
 * **`className` → `class`.** Upstream returns a React prop object, so its key is
 * `className`; Svelte spreads `class` onto an element, so this port's
 * `themeProps` returns `class` and the six assertions that read the key are
 * respelled. The values asserted are upstream's, character for character.
 *
 * Note that the port-specific `theming-targets.test.ts` and
 * `extensible-axes.test.ts` also mention `themeProps` — they are static scans of
 * the *call sites* across the tree, not a port of this suite, and neither
 * asserts anything about what `themeProps()` returns. Nothing was moved.
 */
describe('themeProps', () => {
	it('returns base class for component', () => {
		expect(themeProps('card').class).toBe('astryx-card');
	});

	it('adds variant classes', () => {
		expect(themeProps('button', { variant: 'secondary', size: 'sm' }).class).toBe(
			'astryx-button secondary sm'
		);
	});

	it('prefixes numeric values with prop name', () => {
		expect(themeProps('heading', { level: 1 }).class).toBe('astryx-heading level-1');
	});

	it('skips null and undefined props', () => {
		expect(themeProps('button', { variant: 'primary', size: undefined }).class).toBe(
			'astryx-button primary'
		);
	});

	it('works with no props', () => {
		expect(themeProps('divider').class).toBe('astryx-divider');
	});

	it('handles string numeric values', () => {
		expect(themeProps('heading', { level: '3' }).class).toBe('astryx-heading level-3');
	});

	it('reflects visual props as data attributes', () => {
		expect(themeDataAttributes({ variant: 'secondary', size: 'sm', level: 2 })).toEqual({
			'data-variant': 'secondary',
			'data-size': 'sm',
			'data-level': '2'
		});
	});

	it('kebab-cases data attribute names', () => {
		expect(themeDataAttributes({ listStyle: 'ordered' })).toEqual({
			'data-list-style': 'ordered'
		});
	});

	it('omits nullish data attributes', () => {
		expect(themeDataAttributes({ variant: 'primary', size: null })).toEqual({
			'data-variant': 'primary'
		});
	});

	it('returns class and data attributes together', () => {
		expect(themeProps('button', { variant: 'primary', size: 'sm' })).toEqual({
			class: 'astryx-button primary sm',
			'data-variant': 'primary',
			'data-size': 'sm'
		});
	});
});
