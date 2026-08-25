import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';
import TopNavMenuFixture, { type TopNavMenuItemSpec } from './fixtures/top-nav-menu-fixture.svelte';

/**
 * Ported from Astryx's `hooks/useMenuHover.test.tsx`, new at v0.4.2 with #3121 —
 * all 21 of its `it` cases across five describes. Nothing dropped, nothing added.
 * **Still 21 at the 0.5.0 pin**, re-derived there; upstream's file has not
 * moved since it landed.
 *
 * **Exercised through `TopNavMenu`, a real consumer, not a synthetic harness.**
 * That is upstream's own choice and its stated reason ("so the hook cannot drift
 * from how consumers wire it"), and it carries over unchanged: the hook is
 * `internal/use-menu-hover.svelte.ts` here and has five adopters, so a harness
 * that wired it by hand would be testing the harness.
 *
 * Two translations, both applied throughout:
 *
 * **Real timers, real waits.** Upstream drives everything with
 * `vi.useFakeTimers({shouldAdvanceTime: true})` + `act(() => advanceTimersByTime(n))`,
 * because jsdom has no clock of its own and React needs the flush. These run in a
 * real Chromium against real `setTimeout`s, so the delays are simply waited out.
 * `showDelay` is passed as a small explicit value (`SHOW_DELAY`) to keep that
 * cheap; the two guard windows cannot be — `clickGuardMs` (500ms) and
 * `REOPEN_SUPPRESS_MS` (300ms) are the hook's own constants, and a case about
 * crossing one has to actually cross it. `act()` has no counterpart: a `$state`
 * write flushes on its own.
 *
 * **`aria-expanded` is read off the trigger** on both sides, and it is the
 * popover's own attribute rather than anything the hook writes — which is why it
 * is the right observable for "is the menu open" in either framework.
 *
 * The `mockPointerlessDevice` helper is upstream's, restated against the
 * `createMockMatchMedia` shape `app-shell.svelte.test.ts` already established
 * here, because `useMediaQuery` subscribes with `addEventListener` where
 * upstream's inline object only needs to answer `matches`.
 */

/** Long enough to observe the not-yet-open state, short enough to wait out. */
const SHOW_DELAY = 60;
/** The hook's `DEFAULT_CLICK_GUARD_MS`; a case that outlasts it must really wait. */
const CLICK_GUARD_MS = 500;
/** The hook's `REOPEN_SUPPRESS_MS`. */
const REOPEN_SUPPRESS_MS = 300;

const items: TopNavMenuItemSpec[] = [
	{ title: 'Analytics', description: 'Track user behavior', href: '/analytics' },
	{ title: 'Messaging', description: 'Real-time comms', href: '/messaging' }
];

async function renderMenu(delay = SHOW_DELAY): Promise<{
	trigger: HTMLElement;
	container: HTMLElement;
}> {
	const screen = await render(TopNavMenuFixture, {
		props: { props: { label: 'Products', delay }, items }
	});
	return {
		trigger: screen.getByRole('button', { name: 'Products' }).element() as HTMLElement,
		container: screen.container
	};
}

function firstMenuItem(container: HTMLElement): HTMLElement | null {
	return container.querySelector<HTMLElement>('[role="menuitem"]');
}

function menuItems(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]'));
}

function expanded(trigger: HTMLElement): string | null {
	return trigger.getAttribute('aria-expanded');
}

function hover(el: HTMLElement): void {
	el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
}

function unhover(el: HTMLElement): void {
	el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
}

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Upstream's `mockPointerlessDevice`: a touchscreen, so `(hover: hover)` is false. */
function mockPointerlessDevice(): void {
	const mql = {
		matches: false,
		media: '',
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		addListener: vi.fn(),
		removeListener: vi.fn(),
		dispatchEvent: vi.fn()
	};
	vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql));
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('useMenuHover — hover/click guard', () => {
	it('opens on hover after the show delay', async () => {
		const { trigger } = await renderMenu();

		hover(trigger);
		expect(expanded(trigger)).toBe('false');

		await vi.waitFor(() => {
			expect(expanded(trigger)).toBe('true');
		});
	});

	it('keeps the menu open when a hover-open is immediately clicked', async () => {
		const { trigger } = await renderMenu();

		hover(trigger);
		await vi.waitFor(() => {
			expect(expanded(trigger)).toBe('true');
		});

		await userEvent.click(trigger);
		expect(expanded(trigger)).toBe('true');
	});

	it('pins a confirmed menu so leaving the trigger no longer closes it', async () => {
		const { trigger } = await renderMenu();

		hover(trigger);
		await vi.waitFor(() => {
			expect(expanded(trigger)).toBe('true');
		});
		await userEvent.click(trigger);

		unhover(trigger);
		await wait(400);
		expect(expanded(trigger)).toBe('true');
	});

	it('closes on a click that lands well after the hover-open', async () => {
		const { trigger } = await renderMenu();

		hover(trigger);
		await vi.waitFor(() => {
			expect(expanded(trigger)).toBe('true');
		});
		// Past the guard: a deliberate dismissal, not a follow-on.
		await wait(CLICK_GUARD_MS + 100);

		await userEvent.click(trigger);
		expect(expanded(trigger)).toBe('false');
	});

	it('closes a transient (hover-opened) menu when the pointer leaves', async () => {
		const { trigger } = await renderMenu();

		hover(trigger);
		await vi.waitFor(() => {
			expect(expanded(trigger)).toBe('true');
		});
		unhover(trigger);

		await vi.waitFor(() => {
			expect(expanded(trigger)).toBe('false');
		});
	});

	it('re-entering the trigger of an open menu does not re-arm the guard', async () => {
		const { trigger } = await renderMenu();

		// Click-open pins the menu.
		await userEvent.click(trigger);
		expect(expanded(trigger)).toBe('true');

		// Re-entering must not un-pin it, nor make the next click a "confirm".
		unhover(trigger);
		hover(trigger);
		await wait(SHOW_DELAY + 40);
		expect(expanded(trigger)).toBe('true');

		await userEvent.click(trigger);
		expect(expanded(trigger)).toBe('false');
	});

	it('stays closed when the panel vanishing puts the trigger back under the pointer', async () => {
		const { trigger } = await renderMenu();

		await userEvent.click(trigger);
		expect(expanded(trigger)).toBe('true');

		// Without suppression, the mouseenter fired when the panel stops covering
		// the trigger reopens the menu — which made Escape look inert.
		await userEvent.click(trigger);
		expect(expanded(trigger)).toBe('false');
		hover(trigger);
		await wait(SHOW_DELAY + 40);
		expect(expanded(trigger)).toBe('false');
	});

	it('reopens on a deliberate re-hover once the suppression window passes', async () => {
		const { trigger } = await renderMenu();

		await userEvent.click(trigger);
		await userEvent.click(trigger);
		expect(expanded(trigger)).toBe('false');

		unhover(trigger);
		await wait(REOPEN_SUPPRESS_MS + 100);
		hover(trigger);

		await vi.waitFor(() => {
			expect(expanded(trigger)).toBe('true');
		});
	});

	it('toggles cleanly for click-only interaction', async () => {
		const { trigger } = await renderMenu();

		await userEvent.click(trigger);
		expect(expanded(trigger)).toBe('true');
		await userEvent.click(trigger);
		expect(expanded(trigger)).toBe('false');
	});
});

describe('useMenuHover — focus management', () => {
	it('leaves focus on the trigger for a hover-open', async () => {
		const { trigger, container } = await renderMenu();

		hover(trigger);
		await vi.waitFor(() => {
			expect(expanded(trigger)).toBe('true');
		});

		expect(firstMenuItem(container)).not.toBe(document.activeElement);
	});

	it('moves focus to the first item on a click-open, synchronously', async () => {
		const { trigger, container } = await renderMenu();

		await userEvent.click(trigger);

		// No waitFor and no timer flush: a deferred (rAF) focus fails here, which
		// is the point of the assertion.
		expect(firstMenuItem(container)).toBe(document.activeElement);
	});

	it('moves focus into the menu when a hover-open is confirmed by click', async () => {
		const { trigger, container } = await renderMenu();

		hover(trigger);
		await vi.waitFor(() => {
			expect(expanded(trigger)).toBe('true');
		});
		expect(firstMenuItem(container)).not.toBe(document.activeElement);

		await userEvent.click(trigger);
		expect(firstMenuItem(container)).toBe(document.activeElement);
	});

	it('returns focus to the trigger when a click closes the menu', async () => {
		const { trigger, container } = await renderMenu();

		await userEvent.click(trigger);
		expect(firstMenuItem(container)).toBe(document.activeElement);

		await userEvent.click(trigger);
		expect(document.activeElement).toBe(trigger);
	});

	it('returns focus to the trigger on Escape', async () => {
		const { trigger, container } = await renderMenu();

		await userEvent.click(trigger);
		expect(firstMenuItem(container)).toBe(document.activeElement);

		await userEvent.keyboard('{Escape}');
		expect(expanded(trigger)).toBe('false');
		expect(document.activeElement).toBe(trigger);
	});
});

describe('useMenuHover — keyboard activation', () => {
	it('opens on Enter and moves focus into the menu', async () => {
		const { trigger, container } = await renderMenu();
		trigger.focus();

		await userEvent.keyboard('{Enter}');

		expect(expanded(trigger)).toBe('true');
		expect(firstMenuItem(container)).toBe(document.activeElement);
	});

	it('opens on Space', async () => {
		const { trigger } = await renderMenu();
		trigger.focus();

		await userEvent.keyboard(' ');

		expect(expanded(trigger)).toBe('true');
	});

	it('never toggles an open menu closed — it moves focus in instead', async () => {
		const { trigger, container } = await renderMenu();

		// A hover-open is the only state where a keyboard user can activate the
		// trigger of an open menu; closing on Enter would strand them.
		hover(trigger);
		await vi.waitFor(() => {
			expect(expanded(trigger)).toBe('true');
		});
		trigger.focus();

		await userEvent.keyboard('{Enter}');

		expect(expanded(trigger)).toBe('true');
		expect(firstMenuItem(container)).toBe(document.activeElement);
	});

	it('arrow keys walk the menu items', async () => {
		const { trigger, container } = await renderMenu();

		await userEvent.click(trigger);
		const walked = menuItems(container);
		expect(walked[0]).toBe(document.activeElement);

		await userEvent.keyboard('{ArrowDown}');
		expect(walked[1]).toBe(document.activeElement);
	});
});

describe('useMenuHover — devices without hover', () => {
	it('does not open on a synthetic mouseenter from a tap', async () => {
		mockPointerlessDevice();
		const { trigger } = await renderMenu();

		// Taps emit a compatibility mouseenter; opening on it leaves a menu
		// hanging open behind the tap.
		hover(trigger);
		await wait(SHOW_DELAY + 100);
		expect(expanded(trigger)).toBe('false');
	});

	it('still opens and closes on click', async () => {
		mockPointerlessDevice();
		const { trigger } = await renderMenu();

		await userEvent.click(trigger);
		expect(expanded(trigger)).toBe('true');
		await userEvent.click(trigger);
		expect(expanded(trigger)).toBe('false');
	});
});

describe('useMenuHover — native invoker wiring', () => {
	it('registers the trigger as the panel it controls', async () => {
		const { trigger } = await renderMenu();

		// Upstream notes jsdom implements neither light dismiss nor invokers, so
		// its version asserts the wiring only. The same assertion holds here and is
		// backed by a real implementation rather than standing in for one.
		expect(trigger.getAttribute('popovertarget')).toBe(trigger.getAttribute('aria-controls'));
	});
});
