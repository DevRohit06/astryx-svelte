import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Probe from './fixtures/long-press-probe.svelte';

/**
 * Ported from Astryx's `hooks/useLongPress.test.tsx` at the **0.5.0** pin, all
 * nine cases, in upstream's order and with its titles and assertions. None
 * dropped. (Re-derived at the 0.5.0 pin; upstream's file has not moved since
 * v0.4.1.)
 * (The header previously said eight; v0.4.1 added "cancels when a second finger
 * touches down mid-press" alongside the fix that made `ontouchstart` clear on
 * multi-touch instead of returning with the timer still armed.)
 *
 * Upstream's synthetic touch event carries only `touches`, and so does ours —
 * the hook reads nothing else. `result.current` becomes the probe's instance
 * export, and `act()` disappears: none of these assertions observe rendered
 * output, only the `onLongPress` spy.
 *
 * Only `setTimeout`/`clearTimeout` are faked. Vitest's default set includes
 * `queueMicrotask`, which is what Svelte schedules its own work on, so faking
 * everything would stall mount and unmount — and those are exactly what the
 * last case is about.
 *
 * ## Why this stays in the **client** project
 *
 * Nothing here touches a real node — the events are plain objects and the only
 * clock is `setTimeout` — so the hook looks like a candidate for the node
 * project, the way `use-typeahead` moved. It is not one. The last case is about
 * the hook's `$effect(() => clear)` teardown, and a `.svelte.ts` module compiled
 * for `svelte/server` elides `$effect` entirely: the hook would still return
 * working handlers, there would simply be no effect to tear down and no
 * component to unmount. Porting it to node would mean *dropping* upstream's
 * ninth case, and the count is the contract. So all nine stay here, and all nine
 * are verified only where a browser can start.
 */

function touchEvent(touches: { clientX: number; clientY: number }[]) {
	return { touches } as unknown as TouchEvent;
}

const probe = (onLongPress: (point: { x: number; y: number }) => void, rest = {}) =>
	render(Probe, { props: { options: () => ({ onLongPress, ...rest }) } });

describe('useLongPress', () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('fires onLongPress with the start point after the delay', async () => {
		const onLongPress = vi.fn();
		const { component } = await probe(onLongPress);

		component.handlers.ontouchstart(touchEvent([{ clientX: 10, clientY: 20 }]));
		expect(onLongPress).not.toHaveBeenCalled();

		vi.advanceTimersByTime(500);
		expect(onLongPress).toHaveBeenCalledTimes(1);
		expect(onLongPress).toHaveBeenCalledWith({ x: 10, y: 20 });
	});

	it('respects a custom delayMs', async () => {
		const onLongPress = vi.fn();
		const { component } = await probe(onLongPress, { delayMs: 1000 });

		component.handlers.ontouchstart(touchEvent([{ clientX: 1, clientY: 2 }]));
		vi.advanceTimersByTime(999);
		expect(onLongPress).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		expect(onLongPress).toHaveBeenCalledTimes(1);
	});

	it('does nothing when disabled', async () => {
		const onLongPress = vi.fn();
		const { component } = await probe(onLongPress, { disabled: true });

		component.handlers.ontouchstart(touchEvent([{ clientX: 0, clientY: 0 }]));
		vi.advanceTimersByTime(500);
		expect(onLongPress).not.toHaveBeenCalled();
	});

	it('ignores multi-touch starts', async () => {
		const onLongPress = vi.fn();
		const { component } = await probe(onLongPress);

		component.handlers.ontouchstart(
			touchEvent([
				{ clientX: 0, clientY: 0 },
				{ clientX: 5, clientY: 5 }
			])
		);
		vi.advanceTimersByTime(500);
		expect(onLongPress).not.toHaveBeenCalled();
	});

	it('cancels when a second finger touches down mid-press', async () => {
		const onLongPress = vi.fn();
		const { component } = await probe(onLongPress);

		component.handlers.ontouchstart(touchEvent([{ clientX: 0, clientY: 0 }]));
		// A second finger joins before the press fires (e.g. pinch-to-zoom).
		component.handlers.ontouchstart(
			touchEvent([
				{ clientX: 0, clientY: 0 },
				{ clientX: 50, clientY: 50 }
			])
		);
		vi.advanceTimersByTime(500);
		expect(onLongPress).not.toHaveBeenCalled();
	});

	it('cancels when the finger moves past the threshold', async () => {
		const onLongPress = vi.fn();
		const { component } = await probe(onLongPress);

		component.handlers.ontouchstart(touchEvent([{ clientX: 0, clientY: 0 }]));
		// Move past the default 10px threshold.
		component.handlers.ontouchmove(touchEvent([{ clientX: 15, clientY: 0 }]));
		vi.advanceTimersByTime(500);
		expect(onLongPress).not.toHaveBeenCalled();
	});

	it('does not cancel for movement within the threshold', async () => {
		const onLongPress = vi.fn();
		const { component } = await probe(onLongPress);

		component.handlers.ontouchstart(touchEvent([{ clientX: 0, clientY: 0 }]));
		component.handlers.ontouchmove(touchEvent([{ clientX: 5, clientY: 5 }]));
		vi.advanceTimersByTime(500);
		expect(onLongPress).toHaveBeenCalledTimes(1);
	});

	it('cancels on touch end', async () => {
		const onLongPress = vi.fn();
		const { component } = await probe(onLongPress);

		component.handlers.ontouchstart(touchEvent([{ clientX: 0, clientY: 0 }]));
		component.handlers.ontouchend();
		vi.advanceTimersByTime(500);
		expect(onLongPress).not.toHaveBeenCalled();
	});

	it('cancels the pending timer on unmount', async () => {
		const onLongPress = vi.fn();
		const { component, unmount } = await probe(onLongPress);

		component.handlers.ontouchstart(touchEvent([{ clientX: 0, clientY: 0 }]));
		await unmount();
		vi.advanceTimersByTime(500);
		expect(onLongPress).not.toHaveBeenCalled();
	});
});
