import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import TopNavMegaMenuItem from '$lib/components/top-nav/top-nav-mega-menu-item.svelte';
import MegaMenu from './fixtures/top-nav-mega-menu-fixture.svelte';
import { TIMER_BUDGET } from './timer-budget.js';
import { expectSharedFocusRing } from './shared-focus-ring.js';

/**
 * Ported from Astryx's `TopNav/TopNavMegaMenu.test.tsx` — **all 37 of its `it`
 * cases** at v0.4.1, across all eight of its describes (`default mode`, `popup
 * semantics`, `hover/click guard`, `dismissal`, `keyboard`, `mobile-bar mode`,
 * `drawer mode`, `TopNavMegaMenuItem`). Nothing dropped. Client (real Chromium)
 * project.
 *
 * ## The count, re-derived from the tag at every bump
 *
 * This header once read "all 16 of its `it` cases … Nothing dropped" against a
 * suite that had 21; the five that were absent were the `popup semantics` block
 * (the APG "a link grid is not an ARIA menu" assertions), and porting them
 * closed the file at v0.3.0. **v0.4.1 adds sixteen more**, in three new
 * describes from upstream PR #4555 (the hover→click guard for issue #3121):
 * nine `hover/click guard`, three `dismissal`, four `keyboard`. All sixteen are
 * ported, in upstream's order and position — after `popup semantics`, before
 * `mobile-bar mode`.
 *
 * In the `popup semantics` block, upstream's `queryByRole(r, {hidden: true})`
 * becomes `getByRole(r, {includeHidden: true}).query()` and its
 * `queryAllByRole` becomes `.elements()`; the `{hidden: true}` flag is
 * upstream's and is kept. That block also opens the panel by dispatching rather
 * than through Playwright's pointer; see its `openPanel` helper, and the `click`
 * helper below it, which the three new describes share for a related reason.
 *
 * Standing translations:
 *
 * - `items` and `featured` are `Snippet`s, so the `<TopNavMegaMenuItem>` children
 *   upstream writes inline as JSX come in through `top-nav-mega-menu-fixture` as
 *   specs. `onClick` is `onclick`.
 * - `<TopNavRenderContext value="drawer">` becomes the fixture's `mode` prop,
 *   which wraps the subject in the internal `TopNavRenderScope`: React scopes a
 *   context with an element, Svelte needs a component boundary. The context
 *   object itself is public on both sides.
 * - `render` is async — always awaited.
 * - `user.click` is `userEvent.click` from `vitest/browser`; there is no `setup()`.
 *
 * Two shapes of the port worth stating, because they are what the `aria-*` cases
 * are actually checking:
 *
 * - The desktop trigger spreads `popover.triggerProps` rather than hand-writing
 *   `aria-haspopup`/`aria-expanded`, which is what upstream's 0.1.9 changed and
 *   this port carries; with the layer's `role: 'none'` the spread emits
 *   `aria-haspopup="true"` (where `TopNavMenu`'s is `"dialog"`) and, critically,
 *   the `aria-controls` the first popup-semantics case asserts.
 * - The popover is anchored to the enclosing `<nav>` via a `closest('nav')` read
 *   in an effect. These cases render no `<nav>`, so no anchor is found — exactly
 *   as upstream's `triggerButtonRef.current?.closest('nav')` finds none. The
 *   panel still opens; only its positioning anchor is absent, which nothing
 *   asserts on. It does have one consequence a real browser feels and jsdom
 *   cannot: `position-area` computes to `none`, so the *open* layer sits in the
 *   viewport corner, over the trigger. That is what the `click` helper below is
 *   for.
 *
 * RESTATED — one case, `returns null in mobile-bar mode`; see its comment.
 * COUNTERPART — one case, `reconciles a browser-initiated native light dismiss`;
 * see its comment. The port forwards rest props onto the desktop trigger and
 * onto `TopNavMegaMenuItem`'s rendered element where upstream drops them, but no
 * case in this suite asserts a prop is absent, so nothing needed restating for
 * that.
 */

describe('TopNavMegaMenu — default mode', () => {
	it('renders the trigger button with label', async () => {
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});
		await expect.element(screen.getByRole('button', { name: 'Products' })).toBeInTheDocument();
	});

	it('trigger has aria-haspopup and aria-expanded attributes', async () => {
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});
		const trigger = screen.getByRole('button', { name: 'Products' });
		await expect.element(trigger).toHaveAttribute('aria-haspopup', 'true');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('renders with multiple menu items', async () => {
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [
					{ title: 'Analytics', href: '/analytics' },
					{ title: 'Reports', href: '/reports' }
				]
			}
		});
		await expect.element(screen.getByRole('button', { name: 'Products' })).toBeInTheDocument();
	});

	it('renders with featured content', async () => {
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }],
				featured: { text: 'Featured content', testid: 'featured' }
			}
		});
		await expect.element(screen.getByRole('button', { name: 'Products' })).toBeInTheDocument();
	});

	it('renders without items or featured', async () => {
		const screen = await render(MegaMenu, { props: { menu: { label: 'Empty' } } });
		await expect.element(screen.getByRole('button', { name: 'Empty' })).toBeInTheDocument();
	});
});

describe('TopNavMegaMenu — popup semantics', () => {
	/**
	 * Upstream's `await user.click(trigger)`, dispatched rather than driven by
	 * Playwright's pointer — the one mechanism change in this block, and it is
	 * forced by the environment, not by the component.
	 *
	 * The panel is not out of the way in a real browser. Its layer carries
	 * `panelViewportFit`, whose `display` (upstream's own) is an *author*
	 * declaration and therefore beats the UA's
	 * `[popover]:not(:popover-open) {display: none}`. So the popover is laid out
	 * — `opacity: 0`, but hit-testable — and, unanchored here (no `<nav>`
	 * ancestor, exactly as upstream renders it), it sits over the trigger.
	 * Playwright's hit-target check then reports `<a href="/analytics"> … subtree
	 * intercepts pointer events` and retries until the actionability timeout.
	 * jsdom has no hit-testing, so upstream never meets it.
	 *
	 * Half of that has since lapsed and the helper is kept anyway. #4555 made the
	 * declaration conditional (`{default: 'none', ':popover-open': 'flex'}`), so a
	 * *closed* panel is now genuinely out of the way; an *open* one still covers
	 * the trigger, which is what the shared `click` helper below the block deals
	 * with. A native `.click()` dispatches the click event the component listens
	 * for — `onclick` only — and removes the browser's hit-test entirely. Note it
	 * carries `detail: 0`, so since #4555 it takes the component's *keyboard*
	 * branch; that still opens the panel, which is all five cases here ask for.
	 */
	function openPanel(trigger: Element): void {
		(trigger as HTMLElement).click();
	}

	// Upstream's `beforeAll`/`afterAll` shim `showPopover`/`hidePopover` and
	// `:popover-open` because jsdom implements none of them, and synthesise the
	// `toggle` event the real API dispatches. Chromium has all three, so the
	// block runs against the real Popover API, and upstream's `{hidden: true}`
	// survives as `{includeHidden: true}`.
	it('trigger aria-controls resolves to the popup element', async () => {
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});

		const triggerLoc = screen.getByRole('button', { name: 'Products' });
		await expect.element(triggerLoc).toHaveAttribute('aria-expanded', 'false');
		const trigger = triggerLoc.element();

		// aria-controls must be present and point at the real popup element.
		const controlsId = trigger.getAttribute('aria-controls');
		expect(controlsId).toBeTruthy();
		const popup = document.getElementById(controlsId as string);
		expect(popup).not.toBeNull();

		openPanel(trigger);

		await expect.element(triggerLoc).toHaveAttribute('aria-expanded', 'true');
		// The referenced element is the popup that contains the panel content.
		expect(popup).toContainElement(
			screen.getByRole('group', { name: 'Products', includeHidden: true }).element()
		);
	});

	it('does not wrap the panel in a role="dialog" aria-modal element', async () => {
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});

		openPanel(screen.getByRole('button', { name: 'Products' }).element());

		// Focus stays on the trigger while the panel is open, so a modal dialog
		// wrapper would tell assistive tech the focused control is inert.
		expect(screen.getByRole('dialog', { includeHidden: true }).query()).not.toBeInTheDocument();
		expect(screen.container.querySelector('[aria-modal="true"]')).toBeNull();
	});

	it('does not expose role="menu" — a link grid is not an ARIA menu', async () => {
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [
					{ title: 'Analytics', href: '/analytics' },
					{ title: 'Reports', href: '/reports' }
				]
			}
		});

		openPanel(screen.getByRole('button', { name: 'Products' }).element());

		// Per the WAI-ARIA APG, mega menu panels of navigation links must not use
		// the menu role (reserved for action menus with menuitem children).
		expect(screen.getByRole('menu', { includeHidden: true }).query()).not.toBeInTheDocument();
		expect(screen.getByRole('menuitem', { includeHidden: true }).elements()).toHaveLength(0);
	});

	it('exposes the panel as a labeled group', async () => {
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});

		openPanel(screen.getByRole('button', { name: 'Products' }).element());

		await expect
			.element(screen.getByRole('group', { name: 'Products', includeHidden: true }))
			.toBeInTheDocument();
	});

	it('keeps item links with accessible names inside the panel', async () => {
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [
					{ title: 'Analytics', href: '/analytics' },
					{ title: 'Reports', href: '/reports' }
				]
			}
		});

		openPanel(screen.getByRole('button', { name: 'Products' }).element());

		await expect
			.element(screen.getByRole('link', { name: /Analytics/, includeHidden: true }))
			.toHaveAttribute('href', '/analytics');
		await expect
			.element(screen.getByRole('link', { name: /Reports/, includeHidden: true }))
			.toHaveAttribute('href', '/reports');
	});
});

// =============================================================================
// Shared mechanism for the three describes below (upstream PR #4555)
// =============================================================================

/**
 * Upstream's `renderMenu`. It declares this twice — `renderMenu` in the
 * hover/click-guard block and an identically-bodied `renderAndOpen` (a misnomer;
 * it opens nothing) in the dismissal block — and inlines the same render again
 * in each keyboard case. One helper serves all three. `screen` comes back
 * alongside the trigger for the one case that needs the container.
 */
async function renderMenu() {
	const screen = await render(MegaMenu, {
		props: {
			menu: { label: 'Products' },
			items: [{ title: 'Analytics', href: '/analytics' }]
		}
	});
	return { screen, trigger: screen.getByRole('button', { name: 'Products' }) };
}

/**
 * Upstream's `await user.click(trigger)`, dispatched rather than driven by
 * Playwright's mouse. Two reasons, both about the environment and neither about
 * the component:
 *
 * - `event.detail` is the branch selector in `handleClick`: `0` means keyboard
 *   activation, which pins the panel and never toggles it closed. The
 *   `popup-semantics` block's native `element.click()` fires a synthetic pointer
 *   event whose `detail` is `0` (HTML's "fire a synthetic pointer event"), so it
 *   cannot express a *mouse* click at all — fine there, where only "the panel
 *   opened" is at stake, useless here. `detail: 1` is what a real click carries
 *   and what upstream's user-event emulates.
 * - Half of these clicks land while the panel is already open, and an open
 *   unanchored layer covers the trigger (see the header). Playwright's
 *   hit-target check then reports the panel intercepting and retries until the
 *   actionability timeout. jsdom has no hit-testing, so upstream never meets it.
 *
 * The component sees the same event either way — `handleClick` is a plain
 * `onclick` listener, and the `popovertarget` invoker activation it cancels runs
 * for a dispatched click too, which is exactly what the `prevents the native
 * invoker toggle` case asserts.
 */
function click(element: Element): void {
	element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
}

/**
 * Upstream's `user.hover` / `user.unhover`, and its `fireEvent.mouseEnter`.
 * `mouseenter`/`mouseleave` do not bubble and the component's handlers sit
 * directly on the trigger and on the panel, so this pair is the whole of what
 * upstream's pointer sequence delivers to it. Dispatching also keeps the real
 * pointer off the page, which is what makes `click` above safe: no stray
 * hit-testing, and no hover state for the browser to recompute when the panel
 * appears over the trigger.
 */
function mouse(element: Element, type: 'mouseenter' | 'mouseleave'): void {
	element.dispatchEvent(new MouseEvent(type));
}

/** Upstream's `act(() => vi.advanceTimersByTime(ms))`, on the real clock. */
function wait(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/**
 * The wait for a hover-open whose *next* step is a click judged against
 * `CLICK_GUARD_MS` (500 ms from the open). Polled tightly so the gap between
 * observing the open and delivering the click is a few milliseconds; upstream
 * buys the same determinism from its fake clock. The generous ceiling is the
 * shared timer budget — see `timer-budget.ts`.
 */
const GUARD_POLL = { ...TIMER_BUDGET, interval: 10 };

// =============================================================================
// Hover → click guard (default mode) — issue #3121
//
// The trigger opens on hover and on click. A hover-open records a timestamp so
// the click that naturally follows a hover confirms and pins the panel for
// CLICK_GUARD_MS (the panel just appeared under the cursor) instead of toggling
// it shut. Deliberate clicks outside that window still toggle.
//
// Upstream's `beforeAll`/`afterAll` shim `showPopover`/`hidePopover` and
// `:popover-open` because jsdom implements none of them, and synthesise the
// `toggle` event the real API dispatches. Chromium has all three, so all three
// blocks below run against the real Popover API — which is the point of the
// `dismissal` block, whose own comment says the native event ordering is what
// jsdom cannot exercise.
//
// Upstream also drives this block on a fake clock — `vi.useFakeTimers({
// shouldAdvanceTime: true})` plus `userEvent.setup({advanceTimers})` — and none
// of that survives the move to a real browser, for three independent reasons:
// Vitest's default fake set includes `queueMicrotask`, which is what Svelte
// schedules on, so faking it stalls mount and unmount (the standing rule this
// repo records at `mobile-nav-reopen.svelte.test.ts`); the fake clock would live
// in the page while `userEvent` is driven from the Node side by Playwright, so
// there is no `advanceTimers` seam to thread it through; and the guard window is
// read from `Date.now()`, which the same mock owns. The timers here are
// therefore real, and every wait is either a retrying assertion with the shared
// budget or a sleep at least as long as upstream's advance — both of which can
// only make an assertion harder to pass, never easier.
// =============================================================================

describe('TopNavMegaMenu — hover/click guard (default mode)', () => {
	it('keeps the panel open when a hover-open is immediately clicked', async () => {
		const { trigger } = await renderMenu();

		// Hover opens the panel after the show delay (150ms).
		mouse(trigger.element(), 'mouseenter');
		await expect.element(trigger, GUARD_POLL).toHaveAttribute('aria-expanded', 'true');

		// The click that naturally follows the hover must NOT toggle it shut.
		click(trigger.element());
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

		// It is still a click interaction, so it pins the panel just like a
		// click-open. Leaving the trigger must not dismiss it.
		mouse(trigger.element(), 'mouseleave');
		await wait(300);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	it('closes on a click that lands well after the hover-open (past the guard)', async () => {
		const { trigger } = await renderMenu();

		mouse(trigger.element(), 'mouseenter');
		await expect.element(trigger, TIMER_BUDGET).toHaveAttribute('aria-expanded', 'true');

		// Past the guard window, a click is a deliberate dismissal. No pointer has
		// left the trigger, so nothing else is scheduled during the wait.
		await wait(600);
		click(trigger.element());
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('toggles cleanly for click-only interaction (no hover, no guard)', async () => {
		const { trigger } = await renderMenu();

		// A click with no preceding hover opens...
		click(trigger.element());
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

		// ...and the next click closes — the guard only applies after a hover-open.
		click(trigger.element());
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('closes a hover-opened (transient) panel when the pointer leaves', async () => {
		const { trigger } = await renderMenu();

		mouse(trigger.element(), 'mouseenter');
		await expect.element(trigger, TIMER_BUDGET).toHaveAttribute('aria-expanded', 'true');

		// Leaving closes it after hideDelay (250ms) — hover opens are transient.
		mouse(trigger.element(), 'mouseleave');
		await expect.element(trigger, TIMER_BUDGET).toHaveAttribute('aria-expanded', 'false');
	});

	it('keeps a click-opened (pinned) panel open when the pointer leaves', async () => {
		const { trigger } = await renderMenu();

		// A click pins the panel open (a deliberate open should persist).
		click(trigger.element());
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

		mouse(trigger.element(), 'mouseleave');
		await wait(400);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	it('re-entering the trigger cancels a pending hide', async () => {
		const { trigger } = await renderMenu();

		mouse(trigger.element(), 'mouseenter');
		await expect.element(trigger, TIMER_BUDGET).toHaveAttribute('aria-expanded', 'true');

		// Leave (schedules a hide), then return before hideDelay elapses. Upstream
		// nudges its fake clock 100ms in between; a real 100ms sleep inside a 250ms
		// window is a wall-clock race about nothing the case is testing, so the
		// return happens while the hide is still pending — which is the subject.
		// The total wait after leaving is upstream's 100 + 300.
		mouse(trigger.element(), 'mouseleave');
		mouse(trigger.element(), 'mouseenter');
		await wait(400);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	it('does not reopen when the pointer enters the panel after close', async () => {
		const { screen, trigger } = await renderMenu();
		// Upstream's `getByRole('group', {name: 'Products', hidden: true})`. A
		// closed panel is `display: none` in a real browser and accessible-name
		// computation returns '' for a hidden element, so the role query cannot
		// find it by name — the container query is what `hover-card.svelte.test.ts`
		// uses for the same element, for the same reason.
		const panel = screen.container.querySelector('[role="group"]') as HTMLElement;

		click(trigger.element());
		click(trigger.element());
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

		// The exit transition can leave the closed panel briefly hit-testable.
		mouse(panel, 'mouseenter');
		await wait(200);

		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('re-hovering an open panel does not refresh the click guard', async () => {
		const { trigger } = await renderMenu();

		mouse(trigger.element(), 'mouseenter');
		await expect.element(trigger, TIMER_BUDGET).toHaveAttribute('aria-expanded', 'true');

		// Wait past the guard window, re-hovering along the way. The re-hover must
		// NOT re-stamp the guard timestamp (only a fresh open may), so the click
		// below is still judged a deliberate close.
		await wait(600);
		mouse(trigger.element(), 'mouseenter');
		await wait(200);
		click(trigger.element());
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('opening a sibling mega menu closes the pinned menu through the native auto-popover stack', async () => {
		// Upstream renders two `<TopNavMegaMenu>`s in one fragment; the fixture's
		// `sibling` prop is that fragment, and exists for this case alone.
		const screen = await render(MegaMenu, {
			props: {
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }],
				sibling: {
					menu: { label: 'Solutions' },
					items: [{ title: 'Enterprise', href: '/enterprise' }]
				}
			}
		});

		const products = screen.getByRole('button', { name: 'Products' });
		const solutions = screen.getByRole('button', { name: 'Solutions' });

		click(products.element());
		await expect.element(products).toHaveAttribute('aria-expanded', 'true');

		mouse(solutions.element(), 'mouseenter');

		// Chromium evicts the first auto popover and fires its `toggle`
		// asynchronously, which is what `useLayer`'s reconciliation listens for —
		// so both assertions retry rather than reading straight after the advance.
		await expect.element(products, TIMER_BUDGET).toHaveAttribute('aria-expanded', 'false');
		await expect.element(solutions, TIMER_BUDGET).toHaveAttribute('aria-expanded', 'true');
	});
});

// =============================================================================
// Dismissal (default mode) — issue #3121
//
// The panel stays an *auto* popover for native light dismiss and stack
// exclusivity. `popovertarget` makes the button its native invoker so trigger
// activation is not treated as an outside click before the guard can run.
// Upstream's block comment ends "jsdom cannot exercise that native event
// ordering; these tests lock in the required wiring, while the end-to-end
// interaction is browser-verified in the PR's manual test plan" — this project
// *is* a real browser, which is what lets the third case below drop the
// synthesised toggle event for the real one.
// =============================================================================

describe('TopNavMegaMenu — dismissal (default mode)', () => {
	it('renders an auto popover and registers the trigger as its native invoker', async () => {
		const { trigger } = await renderMenu();
		const triggerEl = trigger.element();
		const popup = document.getElementById(
			triggerEl.getAttribute('aria-controls') as string
		) as HTMLElement;

		expect(popup).toHaveAttribute('popover', 'auto');
		expect(triggerEl).toHaveAttribute('popovertarget', popup.id);
	});

	it('prevents the native invoker toggle so the click guard owns activation', async () => {
		const { trigger } = await renderMenu();

		const clickEvent = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
			detail: 1
		});
		trigger.element().dispatchEvent(clickEvent);

		expect(clickEvent.defaultPrevented).toBe(true);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	it('reconciles a browser-initiated native light dismiss', async () => {
		const { trigger } = await renderMenu();

		click(trigger.element());
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

		const popup = document.getElementById(
			trigger.element().getAttribute('aria-controls') as string
		) as HTMLElement;

		// COUNTERPART. Upstream removes its mock's `popover-open` attribute and
		// dispatches a hand-built `toggle` with `newState: 'closed'` — a model of
		// the browser, because jsdom has no Popover API. Chromium has one, so the
		// close is performed by the browser itself: `hidePopover()` is the step a
		// light dismiss runs, and the `toggle` the component reconciles is the real
		// event, fired asynchronously (hence the retrying assertion) rather than a
		// synchronous synthetic one. Same question — does a close that did not go
		// through `layer.hide()` still reach `aria-expanded`? — asked of the real
		// mechanism.
		popup.hidePopover();

		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});
});

// =============================================================================
// Keyboard (default mode) — issue #3121
//
// Keyboard activation always OPENS (never toggles the panel closed) and moves
// focus into the panel; Escape closes it and returns focus to the trigger.
//
// These four cases keep Playwright's real input rather than dispatching: the
// whole point of the block is that a keyboard-activated click carries
// `detail === 0` while a pointer one carries `1`, and only the browser can
// settle that. The two pointer opens below therefore use `userEvent.click`, not
// the `click` helper — the panel is closed at that moment so nothing intercepts,
// and a real click is also what leaves focus on the trigger, which the Escape
// case asserts.
// =============================================================================

describe('TopNavMegaMenu — keyboard (default mode)', () => {
	it('opens on Enter (keyboard activation)', async () => {
		const { trigger } = await renderMenu();
		trigger.element().focus();
		// Precondition, not coverage: the keypress below is delivered to the
		// document's active element from the Node side, so pin that it is the
		// trigger. `collapsible.svelte.test.ts` does the same before its `{Enter}`.
		await expect.element(trigger).toHaveFocus();

		await userEvent.keyboard('{Enter}');

		// aria-expanded is the observable signal, and it is upstream's only
		// assertion here. Enter also auto-focuses the first link (unlike
		// pointer/hover opens, which keep focus on the trigger); upstream cannot
		// see that landing because jsdom renders the popover content display:none,
		// and defers it to the PR's Playwright checks. It would be visible here —
		// but asserting it would be coverage upstream's case does not have, so the
		// assertion stays upstream's. Panel content presence is likewise NOT
		// asserted: the layer renders it into the DOM even while closed, so such an
		// assertion would be vacuous.
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	it('opens on Space', async () => {
		const { trigger } = await renderMenu();
		trigger.element().focus();
		await expect.element(trigger).toHaveFocus();

		await userEvent.keyboard(' ');

		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	it('keyboard activation never toggles an open panel closed', async () => {
		const { trigger } = await renderMenu();

		// Open via pointer (focus stays on the trigger).
		await userEvent.click(trigger);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

		// Enter on an already-open panel keeps it open — no toggle-close.
		trigger.element().focus();
		// Same precondition as the two cases above, and here it is load-bearing:
		// the panel is already open, so an Enter that never reached the trigger
		// would leave the assertion below passing vacuously.
		await expect.element(trigger).toHaveFocus();
		await userEvent.keyboard('{Enter}');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	it('closes on Escape and returns focus to the trigger', async () => {
		const { trigger } = await renderMenu();

		// Pointer open leaves focus on the trigger.
		await userEvent.click(trigger);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

		await userEvent.keyboard('{Escape}');
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect.element(trigger).toHaveFocus();
	});
});

// =============================================================================
// Mobile-bar mode — should be hidden
// =============================================================================

describe('TopNavMegaMenu — mobile-bar mode', () => {
	it('returns null in mobile-bar mode', async () => {
		const screen = await render(MegaMenu, {
			props: {
				mode: 'mobile-bar',
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});
		// RESTATED: upstream asserts `container.innerHTML === ''`. Svelte leaves the
		// `{#if}` anchor comments of the branch that rendered nothing (and of the
		// fixture around it) in the container, so an empty-string comparison would
		// fail for a reason that has nothing to do with the component. The
		// equivalent claim — the mega menu rendered nothing at all — is that no
		// element and no text reached the DOM.
		expect(screen.container.querySelector('*')).toBeNull();
		expect(screen.container.textContent?.trim()).toBe('');
	});
});

// =============================================================================
// Drawer mode — inline collapsible
// =============================================================================

describe('TopNavMegaMenu — drawer mode', () => {
	it('renders a collapsible trigger with label', async () => {
		const screen = await render(MegaMenu, {
			props: {
				mode: 'drawer',
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});
		const trigger = screen.getByRole('button', { name: 'Products' });
		await expect.element(trigger).toBeInTheDocument();
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('expands to show items when tapped', async () => {
		const screen = await render(MegaMenu, {
			props: {
				mode: 'drawer',
				menu: { label: 'Products' },
				items: [
					{ title: 'Analytics', href: '/analytics' },
					{ title: 'Reports', href: '/reports' }
				]
			}
		});

		const trigger = screen.getByRole('button', { name: 'Products' });
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

		await userEvent.click(trigger);

		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		await expect.element(screen.getByText('Analytics')).toBeInTheDocument();
		await expect.element(screen.getByText('Reports')).toBeInTheDocument();
	});

	it('collapses when trigger is clicked again', async () => {
		const screen = await render(MegaMenu, {
			props: {
				mode: 'drawer',
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});

		const trigger = screen.getByRole('button', { name: 'Products' });
		await userEvent.click(trigger);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		await userEvent.click(trigger);
		await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('shows item descriptions when provided', async () => {
		const screen = await render(MegaMenu, {
			props: {
				mode: 'drawer',
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', description: 'Track behavior', href: '/analytics' }]
			}
		});

		await userEvent.click(screen.getByRole('button', { name: 'Products' }));

		await expect.element(screen.getByText('Analytics')).toBeInTheDocument();
		await expect.element(screen.getByText('Track behavior')).toBeInTheDocument();
	});

	it('renders items as links when href is provided', async () => {
		const screen = await render(MegaMenu, {
			props: {
				mode: 'drawer',
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});

		await userEvent.click(screen.getByRole('button', { name: 'Products' }));

		const link = screen.getByRole('link', { name: 'Analytics' });
		await expect.element(link).toHaveAttribute('href', '/analytics');
	});

	it('renders items as buttons when onClick is provided without href', async () => {
		const handleClick = vi.fn();

		const screen = await render(MegaMenu, {
			props: {
				mode: 'drawer',
				menu: { label: 'Tools' },
				items: [{ title: 'Export', onclick: handleClick }]
			}
		});

		await userEvent.click(screen.getByRole('button', { name: 'Tools' }));
		await userEvent.click(screen.getByRole('button', { name: 'Export' }));

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('renders featured content when expanded', async () => {
		const screen = await render(MegaMenu, {
			props: {
				mode: 'drawer',
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }],
				featured: { text: 'Featured: New AI Tools' }
			}
		});

		await userEvent.click(screen.getByRole('button', { name: 'Products' }));

		await expect.element(screen.getByText('Featured: New AI Tools')).toBeInTheDocument();
	});
});

// =============================================================================
// TopNavMegaMenuItem — standalone rendering
// =============================================================================

describe('TopNavMegaMenuItem', () => {
	it('renders as a desktop item by default', async () => {
		const screen = await render(TopNavMegaMenuItem, {
			props: { title: 'Analytics', href: '/analytics' }
		});
		await expect.element(screen.getByRole('link', { name: /Analytics/ })).toBeInTheDocument();
	});

	it('renders description in desktop mode', async () => {
		const screen = await render(TopNavMegaMenuItem, {
			props: { title: 'Analytics', description: 'Track behavior', href: '/analytics' }
		});
		await expect.element(screen.getByText('Analytics')).toBeInTheDocument();
		await expect.element(screen.getByText('Track behavior')).toBeInTheDocument();
	});

	it('renders as a drawer item in drawer context', async () => {
		const screen = await render(MegaMenu, {
			props: { mode: 'drawer', item: { title: 'Analytics', href: '/analytics' } }
		});
		await expect.element(screen.getByRole('link', { name: /Analytics/ })).toBeInTheDocument();
	});
});

/**
 * Upstream's `describe('TopNavMegaMenu — drawer focus ring')`, both cases, new at
 * 0.4.2. They are the two that catch the defect the 0.4.2 closing audits found:
 * `megaMenuItemDrawerAttrs` composed a bare `sx(...)` where upstream composes
 * `focusOutlineProps.focusVisible(...)`, so a keyboard user got no visible focus
 * anywhere in the mobile drawer.
 *
 * `expectSharedFocusRing` transcribes: `stylex.props(focusOutlineStyles.focusVisible)`
 * yields the atomic classes the shared ring compiles to, and the assertion is
 * that the element carries every one of them. That is a real check rather than a
 * tautology — reverting the fix drops them and this goes red.
 */
describe('TopNavMegaMenu — drawer focus ring', () => {
	it('draws the shared ring on the drawer section header', async () => {
		const screen = await render(MegaMenu, {
			props: {
				mode: 'drawer',
				menu: { label: 'Products' },
				items: [{ title: 'Analytics', href: '/analytics' }]
			}
		});
		expectSharedFocusRing(screen.getByRole('button', { name: 'Products' }).element());
	});

	it('draws the shared ring on a drawer item', async () => {
		const screen = await render(MegaMenu, {
			props: { mode: 'drawer', item: { title: 'Analytics', href: '/analytics' } }
		});
		expectSharedFocusRing(screen.getByRole('link', { name: /Analytics/ }).element());
	});
});
