import { afterEach, describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './fixtures/power-search-i18n-harness.svelte';
import PowerSearchI18n from './fixtures/power-search-i18n.svelte';
import { __resetLiveRegionsForTest } from '$lib/hooks/use-announce.js';
import type { FieldDefinition } from '$lib/components/power-search/use-power-search-config.svelte.js';
import type { PowerSearchFilter } from '$lib/components/power-search/types.js';
import pseudoCatalog from '$lib/locales/pseudo.json' with { type: 'json' };

/**
 * Ported from Astryx's `i18n/__tests__/e2e-powersearch.test.tsx` at **v0.4.5**,
 * which declares **5** `test` cases in one
 * `describe('PowerSearch × i18n — end to end')`. **5 here**, in upstream's
 * order, with upstream's titles and assertions. **None dropped, none restated.**
 *
 * What the file exists to prove is upstream's list, unchanged: that the shipped
 * default operators look their labels up through `t()` at *render* time rather
 * than baking them into the config object, and that provider `messages` /
 * `overrides` swap them without the config being rebuilt.
 *
 * ## Translations (each is a translation, NOT a dropped case)
 *
 * - **Upstream's `Harness` becomes `fixtures/power-search-i18n-harness.svelte`.**
 *   It is the same component for the same reason — `usePowerSearchConfig` is a
 *   hook and has to run inside a component's init — and it is deliberately not
 *   the existing `power-search-harness.svelte`, which holds `filters` in state.
 *   Upstream's e2e harness is uncontrolled (`onChange={() => {}}`), and none of
 *   these five cases changes a filter.
 * - **`useMemo(() => filters, [filters])` is dropped from the harness**, not
 *   from the suite. It returns the array it was handed and exists to stabilise
 *   React's identity across re-renders; there are no re-renders here.
 * - **`<InternationalizationProvider>{children}</…>` → a second fixture.** A
 *   provider's `children` is a snippet and cannot be written inline in a
 *   `render()` props object, so the three provider cases go through
 *   `fixtures/power-search-i18n.svelte`.
 * - **`render` is async** and always awaited; `screen.getByText` returns a
 *   locator, so `expect(…).toBeInTheDocument()` is `await expect.element(…)
 *   .toBeInTheDocument()`.
 *
 * ## Two environment facts these cases lean on
 *
 * - **`resultCount` is not announced at mount.** `PowerSearch`'s announce
 *   `$effect` skips its first run, so the two `getByText('2 results')`
 *   assertions match the visible span only, and not a second copy sitting in
 *   `useAnnounce`'s live region — which `render()`'s helpers would also see,
 *   since they bind to `document.body`. `__resetLiveRegionsForTest()` in
 *   `afterEach` keeps that true across cases, exactly as
 *   `power-search.svelte.test.ts` does.
 * - **The browser locale is pinned to `en-US`** by `vite.config.ts`, which is
 *   what keeps `@astryx.powersearch.resultCount`'s ICU `{count, number}` from
 *   formatting against the host machine's locale.
 *
 * ## Why the catalogs line up
 *
 * Upstream *generates* `packages/core/locales/pseudo.json` from `en.json` at
 * build time (`scripts/build-pseudo-locale.mjs`) and gitignores it, so the file
 * is absent from the upstream clone; this port vendors it. All fifty
 * `@astryx.powersearch.*` keys are present in both, so the pseudo case reads the
 * same catalog upstream's would.
 */

// Small harness — usePowerSearchConfig is a hook, so tests must render it
// via a component. (See `fixtures/power-search-i18n-harness.svelte`.)

const nameField: FieldDefinition = {
	key: 'name',
	type: 'string',
	label: 'Name'
};

describe('PowerSearch × i18n — end to end', () => {
	afterEach(() => {
		__resetLiveRegionsForTest();
	});

	test('renders English default operator labels with no provider', async () => {
		const filter: PowerSearchFilter = {
			field: 'name',
			operator: 'contains',
			value: { type: 'string', value: 'ada' }
		};
		const screen = await render(Harness, { props: { fieldDefs: [nameField], filters: [filter] } });

		// The token displays field label + `: <operator label>` + value.
		// The `contains` default operator should surface its English label.
		await expect.element(screen.getByText(/Name: contains/i)).toBeInTheDocument();
	});

	test('resultCount uses ICU plural (2 results → "results")', async () => {
		const screen = await render(Harness, { props: { fieldDefs: [nameField], filters: [] } });
		await expect.element(screen.getByText('2 results')).toBeInTheDocument();
	});

	test('pseudo locale wraps default operator labels', async () => {
		const filter: PowerSearchFilter = {
			field: 'name',
			operator: 'contains',
			value: { type: 'string', value: 'ada' }
		};
		const screen = await render(PowerSearchI18n, {
			props: {
				locale: 'pseudo',
				messages: { pseudo: pseudoCatalog },
				fieldDefs: [nameField],
				filters: [filter]
			}
		});

		// Pseudo catalog wraps every en value in ⟦...⟧, so the default label
		// "contains" becomes "⟦çóñţàíñš⟧" — token now shows "Name: ⟦çóñţàíñš⟧ ada"
		// (the field label "Name" is consumer-provided, not translated).
		await expect.element(screen.getByText(/Name:.*⟦.*⟧/)).toBeInTheDocument();
	});

	test('provider overrides translate default operator labels', async () => {
		const filter: PowerSearchFilter = {
			field: 'name',
			operator: 'contains',
			value: { type: 'string', value: 'ada' }
		};
		const screen = await render(PowerSearchI18n, {
			props: {
				locale: 'fr',
				overrides: {
					fr: { '@astryx.powersearch.operator.contains': 'contient' }
				},
				fieldDefs: [nameField],
				filters: [filter]
			}
		});

		await expect.element(screen.getByText(/Name: contient/)).toBeInTheDocument();
	});

	test('resultCount ICU plural swaps under provider overrides', async () => {
		const screen = await render(PowerSearchI18n, {
			props: {
				locale: 'fr',
				overrides: {
					fr: {
						'@astryx.powersearch.resultCount':
							'{count, number} {count, plural, one {résultat} other {résultats}}'
					}
				},
				fieldDefs: [nameField],
				filters: []
			}
		});
		await expect.element(screen.getByText('2 résultats')).toBeInTheDocument();
	});
});
