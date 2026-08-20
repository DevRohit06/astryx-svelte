import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { defineTheme } from '$lib/theme/define-theme.js';
import CheckboxIndicator from '$lib/components/indicator/checkbox-indicator.svelte';
import CheckIndicator from '$lib/components/indicator/check-indicator.svelte';
import RadioIndicator from '$lib/components/indicator/radio-indicator.svelte';
import { defaultIndicators, getIndicator } from '$lib/components/indicator/indicator-registry.js';
import type { CoreIndicatorName } from '$lib/components/indicator/indicator-registry.js';
import type { IndicatorName } from '$lib/components/indicator/types.js';
import BrandStar from './fixtures/brand-star-indicator.svelte';

/**
 * Astryx's `Indicator/indicatorRegistry.test.tsx` at **0.4.5**, which declares
 * **6** `it`s. **All 6 are here**, in upstream's order, under upstream's titles
 * and with upstream's assertions. Nothing dropped.
 *
 * Pins the seam between the indicators core ships and the ones other packages
 * add, because that seam used to lie: `defaultIndicators` was typed as a total
 * map over the OPEN `IndicatorName` union, so augmenting `IndicatorMap` made
 * the compiler promise a component for a name nothing had registered, and
 * rendering the `undefined` it actually returned threw.
 *
 * The augmentation below is deliberately real, not a cast — it is exactly what
 * a downstream package writes, and it is what makes `defaultIndicators`
 * failing to cover `'brand-star'` a compile error if anyone re-widens the map.
 * It is written against `$lib/components/indicator/types.js` rather than
 * upstream's `'./types'` because this port publishes no per-component subpath
 * and the tests import through `$lib`; the module it augments is the same one.
 *
 * A **client** file (`*.svelte.test.ts`) where upstream's is a plain suite,
 * because upstream's fifth case renders `BrandStar` and asserts on the DOM it
 * produced. Everything else in the file is registry bookkeeping and would run
 * anywhere.
 *
 * ## One translation, not a dropped case
 *
 * **`BrandStar` is a fixture file**, `fixtures/brand-star-indicator.svelte`,
 * where upstream declares it inline. A Svelte component can only be authored in
 * a `.svelte` file, so a component a test needs is a file the test imports —
 * the same move `icon-nested-theme.svelte` records.
 */

declare module '$lib/components/indicator/types.js' {
	interface IndicatorMap {
		'brand-star': 'singleSelection';
	}
}

describe('defaultIndicators', () => {
	it('covers exactly the core indicator names', () => {
		// A Record over the union, not an array: adding a name to
		// CoreIndicatorName without shipping a default fails to compile here
		// before it can fail at runtime anywhere else.
		const coreNames: Record<CoreIndicatorName, true> = {
			check: true,
			checkbox: true,
			radio: true
		};

		expect(Object.keys(defaultIndicators).sort()).toEqual(Object.keys(coreNames).sort());
		expect(defaultIndicators.check).toBe(CheckIndicator);
		expect(defaultIndicators.checkbox).toBe(CheckboxIndicator);
		expect(defaultIndicators.radio).toBe(RadioIndicator);
	});
});

describe('getIndicator', () => {
	it('resolves a core name to its built-in with no theme', () => {
		expect(getIndicator('check')).toBe(CheckIndicator);
		expect(getIndicator('radio')).toBe(RadioIndicator);
	});

	it('prefers a theme override, by name, across every host', () => {
		const theme = defineTheme({
			name: 'registry-override',
			indicators: { check: RadioIndicator }
		});

		expect(getIndicator('check', theme)).toBe(RadioIndicator);
		// Unmapped names keep their built-in.
		expect(getIndicator('checkbox', theme)).toBe(CheckboxIndicator);
	});

	it('returns undefined for an augmented name no theme supplies', () => {
		// The honest answer: core ships no `brand-star`. The type says
		// `| undefined` for exactly this reason, so a caller writes `?? BrandStar`
		// instead of rendering undefined.
		expect(getIndicator('brand-star')).toBeUndefined();
	});

	it('resolves an augmented name the theme does supply', async () => {
		const theme = defineTheme({
			name: 'brand-star-theme',
			indicators: { 'brand-star': BrandStar }
		});

		const Star = getIndicator('brand-star', theme);
		expect(Star).toBe(BrandStar);

		const screen = await render(BrandStar, { props: { state: 'checked' } });
		expect(screen.container.querySelector('[data-testid="star"]')).toBeInTheDocument();
	});

	it('types a core name as always resolvable and an open name as maybe', () => {
		// Compile-time assertions; the runtime body only keeps them referenced.
		const core = getIndicator('check');
		const open = getIndicator('brand-star' as IndicatorName);

		// @ts-expect-error — an augmented name may have no default; callers must
		// handle undefined rather than render it.
		const mustHandle: NonNullable<typeof open> = open;

		expect(core).toBeDefined();
		expect(mustHandle ?? null).toBeDefined();
	});
});
