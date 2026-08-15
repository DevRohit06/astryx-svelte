import { describe, expect, it, vi, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Probe from './fixtures/container-reveal-probe.svelte';
import ManyProbe from './fixtures/container-reveal-many-probe.svelte';

/**
 * Upstream's `hooks/useContainerReveal.test.tsx`, ported case for case — all 6.
 *
 * `renderHook` becomes the probe fixture and `result.current` its instance
 * export. `className` becomes `class` throughout: the hook returns Svelte
 * attribute names, which is the whole of the translation on the return shape.
 *
 * `rerender` has no direct counterpart, so "follows isEnabled after mount"
 * drives a `$state` the probe's options getter reads — which is the same thing
 * upstream's `rerender({isEnabled})` does, and the behaviour the case exists
 * for. That behaviour is itself new: through 0.3.0 `isEnabled` decided a
 * one-time pool-slot claim, so flipping it after mount did nothing.
 *
 * Nesting isolation is a cascade behaviour, verified in the demo routes rather
 * than asserted here — upstream says the same of jsdom and its Storybook story,
 * and although this suite runs in real Chromium, the assertion would be on
 * computed style through a hover state no test driver can hold.
 *
 * **EIGHT cases from the 0.3.0 suite are gone, and they are not dropped
 * coverage — the mechanism they tested no longer exists.** "gives two
 * concurrently mounted containers DISTINCT marker classes", "recycles a slot
 * after unmount (free-list release)", "assigns distinct markers across a full
 * pool", "survives repeated mount/unmount without leaking the pool", and the
 * four SSR slot-reclamation cases in the companion `container-reveal-ssr.test.ts`
 * all asserted properties of the six-marker pool that upstream 0.4.0 deleted.
 * Scoping is the cascade's job now: a nested container re-declares the same
 * custom properties on itself, so there is no slot to hand out, exhaust, leak or
 * reclaim. That whole file is deleted with them.
 */

afterEach(() => {
	vi.restoreAllMocks();
});

describe('useContainerReveal', () => {
	it('returns spreadable getter props for container and content', async () => {
		const screen = await render(Probe);
		const { reveal } = screen.component;
		const container = reveal.getContainerProps();
		const content = reveal.getContentRevealProps();
		expect(typeof container.class).toBe('string');
		expect(typeof content.class).toBe('string');
		// And they reach the DOM — the half `result.current` cannot check.
		expect(screen.container.querySelector('[data-reveal-container]')!.className).toBe(
			container.class
		);
	});

	it('is inert when disabled: no container class, empty content props', async () => {
		const screen = await render(Probe, { props: { options: () => ({ isEnabled: false }) } });
		const { reveal } = screen.component;
		expect(reveal.getContainerProps()).toEqual({});
		expect(reveal.getContentRevealProps()).toEqual({});
	});

	it('follows isEnabled after mount, in both directions', async () => {
		let isEnabled = $state(true);
		const screen = await render(Probe, { props: { options: () => ({ isEnabled }) } });
		const { reveal } = screen.component;

		expect(reveal.getContentRevealProps().class).toBeTruthy();

		isEnabled = false;
		expect(reveal.getContainerProps()).toEqual({});
		expect(reveal.getContentRevealProps()).toEqual({});

		isEnabled = true;
		expect(reveal.getContainerProps().class).toBeTruthy();
		expect(reveal.getContentRevealProps().class).toBeTruthy();
	});

	it('reveal and conceal map to different style blocks', async () => {
		const screen = await render(Probe);
		const { reveal } = screen.component;
		const revealClass = reveal.getContentRevealProps().class;
		const concealClass = reveal.getContentRevealProps({ isRevealInverted: true }).class;
		expect(revealClass).toBeTruthy();
		expect(concealClass).toBeTruthy();
		expect(revealClass).not.toBe(concealClass);
	});

	it('layout-preserved reveal differs from clipped reveal', async () => {
		const screen = await render(Probe);
		const { reveal } = screen.component;
		const clipped = reveal.getContentRevealProps().class;
		const preserved = reveal.getContentRevealProps({ isLayoutPreserved: true }).class;
		expect(clipped).not.toBe(preserved);
	});

	it('mounts a large flat list without a dev warning', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await render(ManyProbe, { props: { count: 500 } });
		expect(warn).not.toHaveBeenCalled();
	});
});
