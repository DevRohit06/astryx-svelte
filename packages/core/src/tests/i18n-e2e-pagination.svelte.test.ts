/** PORTS: i18n/__tests__/e2e-pagination.test.tsx */

import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Pagination from '$lib/components/pagination/pagination.svelte';
import PaginationI18n from './fixtures/pagination-i18n.svelte';
import pseudoCatalog from '$lib/locales/pseudo.json' with { type: 'json' };

/**
 * Ported from Astryx's `i18n/__tests__/e2e-pagination.test.tsx` at the **0.5.0**
 * pin,
 * which declares **5** `test` cases in one
 * `describe('Pagination × i18n — end to end')`. **5 here**, in upstream's order,
 * with upstream's titles and assertions. **None dropped, none restated.**
 *
 * These are integration tests: real component + real provider + real catalog.
 * The unit tests of `resolve()` are `resolve.test.ts`, as upstream's header
 * says.
 *
 * ## Translations (each is a translation, NOT a dropped case)
 *
 * - **`<InternationalizationProvider>{children}</…>` → a fixture.** A provider's
 *   `children` is a snippet and cannot be written inline in a `render()` props
 *   object, so four of the five cases go through
 *   `fixtures/pagination-i18n.svelte`. The first case renders `Pagination`
 *   directly, exactly as upstream's does.
 * - **`render` is async** and always awaited; `screen.getBy*` returns a locator,
 *   so `expect(…).toBeInTheDocument()` is `await expect.element(…)
 *   .toBeInTheDocument()`.
 *
 * ## Why the catalogs line up
 *
 * Upstream *generates* `packages/core/locales/pseudo.json` from `en.json` at
 * build time (`scripts/build-pseudo-locale.mjs`) and gitignores it, so the file
 * is absent from the upstream clone; this port vendors it. Its `en.json` is
 * byte-identical to upstream's at this pin, and the sixteen
 * `@astryx.pagination.*` keys these cases read are present in both, so
 * upstream's literal pseudo strings (`Þàĝíñàţíóñ`, `Ĝó ţó þřéṽíóúš`, …) are
 * kept verbatim.
 *
 * ## Why the client project
 *
 * `Pagination` is a real component with a `Button`/`Icon` tree and an announce
 * effect, not a pure function — this is the *end to end* half of the i18n
 * suite, where `resolve.test.ts` is the pure half and stays in node. The
 * browser's locale is pinned to `en-US` by `vite.config.ts`, which is what keeps
 * the ICU `{count, number}` formatting in the first four cases from following
 * the host machine and lets the fifth prove `de-DE` actually changes it.
 */

describe('Pagination × i18n — end to end', () => {
	test('renders English strings by default (no provider)', async () => {
		const screen = await render(Pagination, {
			props: {
				page: 2,
				totalItems: 100,
				pageSize: 10,
				onChange: () => {},
				variant: 'count'
			}
		});

		// The nav landmark uses the default label "Pagination"
		await expect
			.element(screen.getByRole('navigation', { name: 'Pagination', exact: true }))
			.toBeInTheDocument();

		// Prev/Next buttons carry English aria-labels
		await expect
			.element(screen.getByRole('button', { name: 'Go to previous page', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Go to next page', exact: true }))
			.toBeInTheDocument();

		// The visible count text is "11–20 of 100"
		await expect.element(screen.getByText(/11.20 of 100/)).toBeInTheDocument();
	});

	test('renders pseudo strings when provider locale is pseudo', async () => {
		const screen = await render(PaginationI18n, {
			props: {
				locale: 'pseudo',
				messages: { pseudo: pseudoCatalog },
				page: 2,
				totalItems: 100,
				pageSize: 10,
				onChange: () => {},
				variant: 'count'
			}
		});

		// Nav landmark shows pseudo-translated label
		await expect
			.element(screen.getByRole('navigation', { name: /Þàĝíñàţíóñ/ }))
			.toBeInTheDocument();

		// Prev/Next aria-labels are pseudo-translated
		await expect
			.element(screen.getByRole('button', { name: /Ĝó ţó þřéṽíóúš/ }))
			.toBeInTheDocument();
		await expect.element(screen.getByRole('button', { name: /Ĝó ţó ñéẋţ/ })).toBeInTheDocument();

		// Visible count is pseudo-wrapped; numbers still format
		await expect.element(screen.getByText(/⟦11.20 óƒ 100⟧/)).toBeInTheDocument();
	});

	test('sparse override changes only the overridden key', async () => {
		const screen = await render(PaginationI18n, {
			props: {
				locale: 'fr',
				overrides: {
					fr: { '@astryx.pagination.next': 'Suivant' }
				},
				page: 2,
				totalItems: 100,
				pageSize: 10,
				onChange: () => {}
			}
		});

		// Overridden key: French
		await expect
			.element(screen.getByRole('button', { name: 'Suivant', exact: true }))
			.toBeInTheDocument();

		// NON-overridden keys fall through to English (fr has no other catalog)
		await expect
			.element(screen.getByRole('navigation', { name: 'Pagination', exact: true }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole('button', { name: 'Go to previous page', exact: true }))
			.toBeInTheDocument();
	});

	test('regional locale (pt-BR) falls back to base language (pt)', async () => {
		// pt-BR has one key, pt has another, en fills in the rest.
		// Tests the resolveLocaleChain walking through resolve() end to end.
		const screen = await render(PaginationI18n, {
			props: {
				locale: 'pt-BR',
				messages: {
					'pt-BR': {
						'@astryx.pagination.next': { defaultMessage: 'Próxima (BR)' }
					},
					pt: {
						'@astryx.pagination.previous': { defaultMessage: 'Anterior' }
					}
				},
				page: 2,
				totalItems: 100,
				pageSize: 10,
				onChange: () => {}
			}
		});

		// next: from pt-BR
		await expect
			.element(screen.getByRole('button', { name: 'Próxima (BR)', exact: true }))
			.toBeInTheDocument();

		// previous: from pt (fallback pt-BR → pt)
		await expect
			.element(screen.getByRole('button', { name: 'Anterior', exact: true }))
			.toBeInTheDocument();

		// label: neither pt-BR nor pt has it — falls back to en
		await expect
			.element(screen.getByRole('navigation', { name: 'Pagination', exact: true }))
			.toBeInTheDocument();
	});

	test('ICU number formatting respects the locale', async () => {
		// In de-DE, 1000 formats with "." as the thousands separator.
		const screen = await render(PaginationI18n, {
			props: {
				locale: 'de-DE',
				page: 2,
				totalItems: 10000,
				pageSize: 10,
				onChange: () => {},
				variant: 'count'
			}
		});

		// We didn't provide a de-DE catalog — the string is en's pattern but
		// numbers format under the de-DE locale, so "10000" becomes "10.000".
		// Text is: "11–20 of 10.000"
		// The dash between 11 and 20 is unicode en-dash (–), match loosely
		// by asserting the presence of the German-formatted 10.000.
		await expect.element(screen.getByText(/10\.000/)).toBeInTheDocument();
	});
});
