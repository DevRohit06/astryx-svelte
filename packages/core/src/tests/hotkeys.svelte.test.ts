/** PORTS: hooks/useHotkeys.test.ts */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Hotkey } from '$lib/hooks/use-hotkeys.svelte.js';
import Probe from './fixtures/hotkeys-probe.svelte';

/**
 * Ported from Astryx's `hooks/useHotkeys.test.ts` — **12 of its 13 cases at the
 * 0.5.0 pin**.
 *
 * Unported: `reads a blank userAgentData.platform as unknown, not as non-Apple`,
 * added upstream with the guard it covers. It is **not** portable as coverage
 * debt alone — `hooks/use-hotkeys.svelte.ts` still takes the unguarded branch
 * when `userAgentData.platform` is the empty string, so the case would fail
 * against this port as written. The same unguarded shape is in
 * `components/kbd/kbd-keys.ts`.
 *
 * The platform stubs are upstream's, and they carry over intact for a reason
 * worth stating: they replace `navigator` with a bare `{platform}` object, and
 * `isApplePlatform` prefers `navigator.userAgentData` when it exists. Upstream's
 * comment says jsdom has no `userAgentData`; a real Chrome does, so without the
 * stub these would test the machine rather than the hook. The stub removes it in
 * both environments, so the `platform` branch is what runs either way.
 *
 * `renderHook` becomes the probe next door, `rerender` stays `rerender`, and
 * `act()` disappears — a dispatched keydown runs its listener synchronously, so
 * every assertion here is already settled by the time it is made.
 */

function stubApplePlatform() {
	vi.stubGlobal('navigator', { platform: 'MacIntel' });
}

function stubOtherPlatform() {
	vi.stubGlobal('navigator', { platform: 'Win32' });
}

function press(
	key: string,
	init: KeyboardEventInit & { target?: HTMLElement } = {}
): KeyboardEvent {
	const { target, ...eventInit } = init;
	const event = new KeyboardEvent('keydown', {
		key,
		bubbles: true,
		cancelable: true,
		...eventInit
	});
	(target ?? window).dispatchEvent(event);
	return event;
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	document.body.innerHTML = '';
});

describe('useHotkeys', () => {
	it('fires on mod+k via metaKey on Apple platforms', async () => {
		stubApplePlatform();
		const onPress = vi.fn();
		await render(Probe, { props: { hotkeys: [{ keys: 'mod+k', onPress }] } });

		const event = press('k', { metaKey: true });
		expect(onPress).toHaveBeenCalledTimes(1);
		expect(onPress).toHaveBeenCalledWith(event);
		expect(event.defaultPrevented).toBe(true);
	});

	it('maps mod to ctrlKey on non-Apple platforms', async () => {
		stubOtherPlatform();
		const onPress = vi.fn();
		await render(Probe, { props: { hotkeys: [{ keys: 'mod+k', onPress }] } });

		press('k', { metaKey: true });
		expect(onPress).not.toHaveBeenCalled();

		press('k', { ctrlKey: true });
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it('does not fire a bare key when modifiers are held', async () => {
		stubApplePlatform();
		const onPress = vi.fn();
		await render(Probe, { props: { hotkeys: [{ keys: 'k', onPress }] } });

		press('k', { metaKey: true });
		press('k', { ctrlKey: true });
		press('k', { altKey: true });
		expect(onPress).not.toHaveBeenCalled();

		press('k');
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it('matches named keys: escape, enter, space, arrows', async () => {
		stubApplePlatform();
		const onEscape = vi.fn();
		const onEnter = vi.fn();
		const onSpace = vi.fn();
		const onDown = vi.fn();
		await render(Probe, {
			props: {
				hotkeys: [
					{ keys: 'escape', onPress: onEscape },
					{ keys: 'enter', onPress: onEnter },
					{ keys: 'space', onPress: onSpace },
					{ keys: 'down', onPress: onDown }
				]
			}
		});

		press('Escape');
		press('Enter');
		press(' ');
		press('ArrowDown');
		expect(onEscape).toHaveBeenCalledTimes(1);
		expect(onEnter).toHaveBeenCalledTimes(1);
		expect(onSpace).toHaveBeenCalledTimes(1);
		expect(onDown).toHaveBeenCalledTimes(1);
	});

	it('requires shift when specified and ignores shift otherwise', async () => {
		stubApplePlatform();
		const onSlash = vi.fn();
		const onLetter = vi.fn();
		await render(Probe, {
			props: {
				hotkeys: [
					{ keys: 'shift+/', onPress: onSlash },
					{ keys: 'c', onPress: onLetter }
				]
			}
		});

		press('/');
		expect(onSlash).not.toHaveBeenCalled();
		press('/', { shiftKey: true });
		expect(onSlash).toHaveBeenCalledTimes(1);

		// Shift not specified → matches regardless of shift state.
		press('C', { shiftKey: true });
		press('c');
		expect(onLetter).toHaveBeenCalledTimes(2);
	});

	it('skips typing targets by default', async () => {
		stubApplePlatform();
		const onPress = vi.fn();
		await render(Probe, { props: { hotkeys: [{ keys: 'mod+k', onPress }] } });

		const input = document.createElement('input');
		document.body.appendChild(input);
		press('k', { metaKey: true, target: input });
		expect(onPress).not.toHaveBeenCalled();

		const textarea = document.createElement('textarea');
		document.body.appendChild(textarea);
		press('k', { metaKey: true, target: textarea });
		expect(onPress).not.toHaveBeenCalled();
	});

	it('fires in typing targets when allowInInputs is true', async () => {
		stubApplePlatform();
		const onPress = vi.fn();
		await render(Probe, {
			props: { hotkeys: [{ keys: 'escape', onPress, allowInInputs: true }] }
		});

		const input = document.createElement('input');
		document.body.appendChild(input);
		press('Escape', { target: input });
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it('respects isDisabled', async () => {
		stubApplePlatform();
		const onPress = vi.fn();
		const screen = await render(Probe, {
			props: { hotkeys: [{ keys: 'mod+k', onPress, isDisabled: true }] }
		});

		press('k', { metaKey: true });
		expect(onPress).not.toHaveBeenCalled();

		await screen.rerender({ hotkeys: [{ keys: 'mod+k', onPress, isDisabled: false }] });
		press('k', { metaKey: true });
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it('skips events that are already defaultPrevented', async () => {
		stubApplePlatform();
		const onPress = vi.fn();
		await render(Probe, { props: { hotkeys: [{ keys: 'mod+k', onPress }] } });

		const event = new KeyboardEvent('keydown', {
			key: 'k',
			metaKey: true,
			bubbles: true,
			cancelable: true
		});
		event.preventDefault();
		window.dispatchEvent(event);
		expect(onPress).not.toHaveBeenCalled();
	});

	it('unsubscribes on unmount', async () => {
		stubApplePlatform();
		const onPress = vi.fn();
		const removeSpy = vi.spyOn(window, 'removeEventListener');
		const screen = await render(Probe, { props: { hotkeys: [{ keys: 'mod+k', onPress }] } });

		await screen.unmount();
		expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

		press('k', { metaKey: true });
		expect(onPress).not.toHaveBeenCalled();
	});

	it('does not re-subscribe on re-render, but uses latest handlers', async () => {
		stubApplePlatform();
		const addSpy = vi.spyOn(window, 'addEventListener');
		const first = vi.fn();
		const second = vi.fn();

		const screen = await render(Probe, {
			props: { hotkeys: [{ keys: 'mod+k', onPress: first }] as Hotkey[] }
		});

		const keydownSubscriptions = () =>
			addSpy.mock.calls.filter(([type]) => type === 'keydown').length;
		const initialCount = keydownSubscriptions();

		await screen.rerender({ hotkeys: [{ keys: 'mod+k', onPress: second }] });
		await screen.rerender({ hotkeys: [{ keys: 'mod+k', onPress: second }] });
		expect(keydownSubscriptions()).toBe(initialCount);

		press('k', { metaKey: true });
		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
	});

	it('only fires the first matching hotkey per event', async () => {
		stubApplePlatform();
		const first = vi.fn();
		const second = vi.fn();
		await render(Probe, {
			props: {
				hotkeys: [
					{ keys: 'mod+k', onPress: first },
					{ keys: 'mod+k', onPress: second }
				]
			}
		});

		press('k', { metaKey: true });
		expect(first).toHaveBeenCalledTimes(1);
		expect(second).not.toHaveBeenCalled();
	});
});
