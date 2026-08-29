import { flushSync } from 'svelte';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import UseCollatorProbe from './fixtures/use-collator-probe.svelte';

/**
 * Ported case-for-case from upstream's `i18n/__tests__/useCollator.test.tsx` at
 * the **0.5.0** pin, which declares **7** `test` cases in one
 * `describe('useCollator')`. **7 here**, in upstream's order, with upstream's
 * titles and assertions. **None dropped.**
 *
 * ## Why the client project
 *
 * `useCollator()` reads Svelte context and memoizes through a `$derived`, so it
 * has to run during a component's initialisation and stay attached to that
 * component's reactive graph. Svelte has no `renderHook`, so the substitute is
 * the probe fixture pair described in `use-collator-probe.svelte`: the provider
 * and the consumer must be *separate components* for the context to cross
 * between them. Collation itself is ICU data, which real Chromium ships in full.
 *
 * ## Translations (each is a translation, NOT a dropped case)
 *
 * - **`result.current` → rendered text.** The hook returns a getter, so
 *   `collator-readout.svelte` renders what the last three assertions of a plain
 *   `renderHook` would read: the sorted order, the sign of a single `compare`,
 *   and a per-instance identity stamp. Reading the DOM also makes these assert
 *   what a consumer observes rather than what the hook happens to hold.
 * - **`expect(result.current).toBe(first)` → the identity stamp.** There is no
 *   `result.current` to compare here, and `render()` returns the *root*
 *   component, so the readout's own instance exports are out of reach. The
 *   fixture's module-scope `WeakMap` turns each collator into a stable number
 *   rendered beside the order, so "the same collator" is "the same text". The
 *   memoization case forces a second read of the getter by changing an input the
 *   collator does not depend on — without that nothing would re-read it, and the
 *   case would pass against a hook that constructed a collator per call.
 * - **`rerender(…)` → a setter on the probe, reached through
 *   `render(...).component`.** A Svelte component is not re-invoked with new
 *   props; its reactive sources change. `flushSync` is `act()`'s counterpart, so
 *   every assertion after one reads settled DOM instead of retrying.
 * - **"options identity changes" is a reassignment of `$state.raw`.** Upstream's
 *   dependency list compares the argument between renders and the case hands it
 *   an equal-but-distinct literal; here the equal-but-distinct literal is
 *   assigned to the reactive source the options getter reads, which is what
 *   invalidates the `$derived`. Same trigger, same expectation.
 */
describe('useCollator', () => {
	test('compares using the en fallback when rendered without a provider', async () => {
		const screen = await render(UseCollatorProbe, {
			props: { hasProvider: false, words: ['a', 'b'] }
		});
		await expect.element(screen.getByTestId('compare')).toHaveTextContent('-1');
	});

	test('orders "ä" before "z" under Swedish, and after "z" under German', async () => {
		const sv = await render(UseCollatorProbe, { props: { locale: 'sv-SE' } });
		const de = await render(UseCollatorProbe, { props: { locale: 'de-DE' } });

		// Scoped by container: upstream's two `renderHook` calls both mount into
		// the same document here, so a page-level locator is a strict-mode
		// violation rather than a failure (`bind-snippet.svelte.test.ts`).
		expect(sv.container.querySelector('[data-testid="order"]')).toHaveTextContent('z,ä');
		expect(de.container.querySelector('[data-testid="order"]')).toHaveTextContent('ä,z');
	});

	test('threads options through to the underlying Intl.Collator (numeric)', async () => {
		const screen = await render(UseCollatorProbe, {
			props: { hasProvider: false, options: { numeric: true }, words: ['item2', 'item10'] }
		});
		await expect.element(screen.getByTestId('order')).toHaveTextContent('item2,item10');
	});

	test('without numeric, orders "item10" before "item2" lexicographically', async () => {
		const screen = await render(UseCollatorProbe, {
			props: { hasProvider: false, words: ['item2', 'item10'] }
		});
		await expect.element(screen.getByTestId('order')).toHaveTextContent('item10,item2');
	});

	test('memoizes the collator when locale and options identity are unchanged', async () => {
		const screen = await render(UseCollatorProbe, {
			props: { locale: 'en', options: { numeric: true } }
		});
		const stamp = screen.getByTestId('stamp');
		await expect.element(stamp).toHaveTextContent('a:');
		const first = stamp.element().textContent!;

		flushSync(() => screen.component.setLabel('b'));
		expect(stamp.element().textContent).toBe(`b${first.slice(1)}`);
	});

	test('rebuilds the collator when options identity changes', async () => {
		const screen = await render(UseCollatorProbe, {
			props: { locale: 'en', options: { numeric: true } }
		});
		const stamp = screen.getByTestId('stamp');
		await expect.element(stamp).toHaveTextContent('a:');
		const first = stamp.element().textContent!;

		flushSync(() => screen.component.setOptions({ numeric: true }));
		expect(stamp.element().textContent).not.toBe(first);
	});

	test('re-renders with a new collator when the provider locale changes', async () => {
		const screen = await render(UseCollatorProbe, { props: { locale: 'sv-SE' } });
		const order = screen.getByTestId('order');
		const stamp = screen.getByTestId('stamp');
		await expect.element(order).toHaveTextContent('z,ä');
		const svStamp = stamp.element().textContent!;

		flushSync(() => screen.component.setLocale('de-DE'));
		expect(order.element().textContent).toBe('ä,z');
		expect(stamp.element().textContent).not.toBe(svStamp);
	});
});
