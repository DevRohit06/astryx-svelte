import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { POOL_SIZE } from '$lib/hooks/container-reveal.pool.stylex.js';
import Probe from './fixtures/container-reveal-probe.svelte';
import ManyProbe from './fixtures/container-reveal-many-probe.svelte';

/**
 * Upstream's `hooks/useContainerReveal.test.tsx`, ported case for case — all 8.
 *
 * The hook claims a pool slot at init and releases it on destroy, so every case
 * needs a real component lifecycle: `renderHook` becomes the probe fixture and
 * `result.current` its instance export. `act()` disappears — `unmount()` here
 * already awaits, and there is no batched state to flush.
 *
 * `className` becomes `class` throughout: the hook returns Svelte attribute
 * names, which is the whole of the translation on the return shape.
 *
 * The pool is module-level and shared by every case in this file.
 * `vitest-browser-svelte` cleans up before each test, so each one starts with
 * the free-list empty — which is what makes the "recycles a slot" and
 * "full pool" cases mean anything.
 */

describe('useContainerReveal', () => {
	it('returns spreadable getter props for container and content', async () => {
		const screen = await render(Probe);
		const { reveal } = screen.component;
		const container = reveal.getContainerProps();
		const content = reveal.getContentRevealProps();
		expect(container).toHaveProperty('class');
		expect(content).toHaveProperty('class');
		expect(typeof container.class).toBe('string');
		expect(typeof content.class).toBe('string');
		// And they reach the DOM — the half `result.current` cannot check.
		expect(screen.container.querySelector('[data-reveal-container]')!.className).toBe(
			container.class
		);
	});

	it('is inert when disabled: no marker class, empty content props', async () => {
		const screen = await render(Probe, { props: { options: () => ({ isEnabled: false }) } });
		const { reveal } = screen.component;
		expect(reveal.getContainerProps()).toEqual({});
		expect(reveal.getContentRevealProps()).toEqual({});
	});

	it('gives two concurrently mounted containers DISTINCT marker classes', async () => {
		// The core leak-safety property: nested/concurrent containers must never
		// share a marker, or an ancestor container's :hover would reveal a
		// descendant container's content.
		const a = await render(Probe);
		const b = await render(Probe);
		const classA = a.component.reveal.getContainerProps().class;
		const classB = b.component.reveal.getContainerProps().class;
		expect(classA).toBeTruthy();
		expect(classB).toBeTruthy();
		expect(classA).not.toBe(classB);
		await a.unmount();
		await b.unmount();
	});

	it('recycles a slot after unmount (free-list release)', async () => {
		const first = await render(Probe);
		const firstClass = first.component.reveal.getContainerProps().class;
		await first.unmount();
		// A fresh mount should be able to reclaim the just-released slot.
		const second = await render(Probe);
		const secondClass = second.component.reveal.getContainerProps().class;
		expect(secondClass).toBe(firstClass);
		await second.unmount();
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

	it('assigns distinct markers across a full pool of concurrent containers', async () => {
		const screen = await render(ManyProbe, { props: { count: POOL_SIZE } });
		const classes = [...screen.container.querySelectorAll('[data-reveal-container]')].map(
			(el) => el.className
		);
		const unique = new Set(classes.filter(Boolean));
		expect(unique.size).toBe(POOL_SIZE);
		await screen.unmount();
	});

	it('survives repeated mount/unmount without leaking the pool', async () => {
		// Mount and unmount a full pool several times; each cycle must still hand
		// out POOL_SIZE distinct markers, proving slots are released.
		for (let cycle = 0; cycle < 3; cycle++) {
			const screen = await render(ManyProbe, { props: { count: POOL_SIZE } });
			const classes = [...screen.container.querySelectorAll('[data-reveal-container]')].map(
				(el) => el.className
			);
			expect(new Set(classes).size).toBe(POOL_SIZE);
			await screen.unmount();
		}
	});
});
