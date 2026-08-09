import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import UseDirectionProbe from './fixtures/use-direction-probe.svelte';

/**
 * Ported case-for-case from upstream's `i18n/__tests__/useDirection.test.tsx` —
 * 5 cases, 5 here, in upstream's order with its assertions intact.
 *
 * ## Why the client project
 *
 * `useDirection()` reads Svelte context, so it has to run during a component's
 * initialisation. Svelte has no `renderHook`, so the substitute is the probe
 * fixture pair described in `use-direction-probe.svelte`: the provider and the
 * consumer must be *separate components* for the context to cross between them.
 *
 * Upstream's `result.current` is a plain string. Here the hook returns a getter,
 * so the probe renders the value and these read it out of the DOM — which also
 * makes the assertions test what a consumer actually observes.
 */
describe('useDirection', () => {
	test('returns ltr when rendered without a provider', async () => {
		const screen = await render(UseDirectionProbe, { props: { hasProvider: false } });
		await expect.element(screen.getByTestId('direction')).toHaveTextContent('ltr');
	});

	test('returns ltr under an English provider', async () => {
		const screen = await render(UseDirectionProbe, { props: { locale: 'en' } });
		await expect.element(screen.getByTestId('direction')).toHaveTextContent('ltr');
	});

	test('returns rtl under an Arabic provider', async () => {
		const screen = await render(UseDirectionProbe, { props: { locale: 'ar' } });
		await expect.element(screen.getByTestId('direction')).toHaveTextContent('rtl');
	});

	test('explicit dir="rtl" wins over an LTR locale', async () => {
		const screen = await render(UseDirectionProbe, { props: { locale: 'en', dir: 'rtl' } });
		await expect.element(screen.getByTestId('direction')).toHaveTextContent('rtl');
	});

	test('explicit dir="ltr" wins over an RTL locale', async () => {
		const screen = await render(UseDirectionProbe, { props: { locale: 'ar', dir: 'ltr' } });
		await expect.element(screen.getByTestId('direction')).toHaveTextContent('ltr');
	});
});
