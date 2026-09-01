/** PORTS: i18n/__tests__/useLocale.test.tsx */

import { flushSync } from 'svelte';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import UseLocaleProbe from './fixtures/use-locale-probe.svelte';

/**
 * Ported case-for-case from upstream's `i18n/__tests__/useLocale.test.tsx` at
 * the **0.5.0** pin, which declares **3** `test` cases in one
 * `describe('useLocale')`. **3 here**, in upstream's order, with upstream's
 * titles and assertions. **None dropped.**
 *
 * ## Why the client project
 *
 * `useLocale()` reads Svelte context, so it has to run during a component's
 * initialisation. Svelte has no `renderHook`, so the substitute is the probe
 * fixture pair described in `use-locale-probe.svelte`: the provider and the
 * consumer must be *separate components* for the context to cross between them.
 *
 * ## Translations (each is a translation, NOT a dropped case)
 *
 * - **`result.current` → rendered text.** Upstream's is a plain string; here the
 *   hook returns a getter, so the probe renders the value and these read it out
 *   of the DOM — which also makes the assertions test what a consumer actually
 *   observes. `use-direction.svelte.test.ts` does the same for the sibling hook.
 * - **`rerender(<Provider locale="ja-JP">…)` → `component.setLocale('ja-JP')`.**
 *   A Svelte component is not re-invoked with new props; its reactive sources
 *   change. `flushSync` is `act()`'s counterpart, so the assertion after it
 *   reads settled DOM rather than a retry.
 */
describe('useLocale', () => {
	test('returns en when rendered without a provider', async () => {
		const screen = await render(UseLocaleProbe, { props: { hasProvider: false } });
		await expect.element(screen.getByTestId('locale')).toHaveTextContent('en');
	});

	test('returns the provider locale', async () => {
		const screen = await render(UseLocaleProbe, { props: { locale: 'fr' } });
		await expect.element(screen.getByTestId('locale')).toHaveTextContent('fr');
	});

	test('re-renders with the new locale when the provider locale changes', async () => {
		const screen = await render(UseLocaleProbe, { props: { locale: 'en' } });
		const locale = screen.getByTestId('locale');
		await expect.element(locale).toHaveTextContent('en');

		flushSync(() => screen.component.setLocale('ja-JP'));
		expect(locale.element().textContent).toBe('ja-JP');
	});
});
