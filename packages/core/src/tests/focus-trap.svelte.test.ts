/** PORTS: hooks/useFocusTrap.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { FOCUSABLE_SELECTOR } from '$lib/internal/focusable-selector.js';
import EscapeTrap from './fixtures/escape-trap.svelte';
import NestedTraps from './fixtures/nested-traps.svelte';
import RestoreFixture from './fixtures/restore-fixture.svelte';
import Trap from './fixtures/focus-trap-fixture.svelte';

/**
 * Ported from Astryx's `hooks/useFocusTrap.test.tsx` — **17 of its 18 cases at
 * the 0.5.0 pin**.
 *
 * Unported: `useFocusTrap tabbable model (infra-8)` → `leaves Tab alone when
 * focus is outside a trap with no tabbable controls`, the negative half of
 * 0.5.0's no-tabbable-controls pair (Tab from outside such a trap must go
 * unhandled). Its positive twin is here, relocated into a
 * `useFocusTrap with no tabbable controls` describe that has no upstream
 * counterpart. (The header read "all sixteen cases" while this file ran 17 and
 * upstream held 18 — wrong on both sides.)
 *
 * `render`/`rerender` map straight across; `fireEvent.keyDown(document, …)`
 * becomes a dispatched `KeyboardEvent`, and `toHaveFocus()` is the same matcher.
 *
 * One construction detail. `keyCode` is a legacy member of `KeyboardEventInit`
 * and is not reliably honoured by the constructor, so the IME case sets it with
 * `defineProperty` rather than trusting the init dictionary — the point of that
 * case is that a real 229 keydown is ignored, and it should not quietly test an
 * event whose keyCode is 0.
 *
 * The two nested-Escape cases split by what they are asserting. The *unrelated*
 * traps case renders two traps with two `render` calls instead of one JSX
 * fragment — activation order is the tiebreaker there, and two calls are exactly
 * that. The DOM-*nested* pair cannot be built that way at all, because the point
 * is containment overriding push order, so it gets a fixture that really nests
 * one trap inside the other's subtree.
 */

function pressEscape(init: KeyboardEventInit & { keyCode?: number } = {}): void {
	const { keyCode, ...eventInit } = init;
	const event = new KeyboardEvent('keydown', {
		key: 'Escape',
		bubbles: true,
		cancelable: true,
		...eventInit
	});
	if (keyCode != null) {
		Object.defineProperty(event, 'keyCode', { value: keyCode });
	}
	document.dispatchEvent(event);
}

describe('useFocusTrap tabbable model (infra-8)', () => {
	it('treats a contenteditable as focusable (focusFirst lands on it)', async () => {
		const screen = await render(Trap, { props: { content: 'contenteditable' } });
		await screen.getByTestId('focus-first').click();
		await expect.element(screen.getByTestId('editor')).toHaveFocus();
	});

	it('ignores an inert subtree when finding focusables', async () => {
		const screen = await render(Trap, { props: { content: 'inert' } });
		await screen.getByTestId('focus-first').click();
		// Focus skips the inert button and lands on the real one.
		await expect.element(screen.getByTestId('real-btn')).toHaveFocus();
	});

	it('ignores an aria-hidden subtree when finding focusables', async () => {
		const screen = await render(Trap, { props: { content: 'aria-hidden' } });
		await screen.getByTestId('focus-first').click();
		// An element AT cannot perceive must not be a trap tab stop (WCAG 4.1.2).
		await expect.element(screen.getByTestId('real-btn')).toHaveFocus();
	});

	it('excludes an aria-hidden focusable from the Tab wrap boundary', async () => {
		const screen = await render(Trap, { props: { content: 'aria-hidden-last' } });
		// The last VISIBLE-to-AT element is the wrap boundary: Tab from it wraps to
		// the first element instead of landing on the aria-hidden button.
		(screen.getByTestId('visible-last').element() as HTMLElement).focus();
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
		await expect.element(screen.getByTestId('first')).toHaveFocus();
	});
});

describe('FOCUSABLE_SELECTOR href matching', () => {
	// Only real links (<a href>/<area href>) are focusable via href. A bare
	// [href] term also matched non-focusable elements carrying href (e.g. a
	// <link> in the head, or a custom element), which useFocusTrap would then
	// treat as tab stops when computing trap boundaries.
	it('matches real links but not other elements carrying href', () => {
		const container = document.createElement('div');
		container.innerHTML =
			'<a href="#a" data-testid="anchor">Anchor</a>' +
			'<map name="m">' +
			'<area href="#area" shape="rect" coords="0,0,1,1" data-testid="area" />' +
			'</map>' +
			'<span href="#span" data-testid="span">Span</span>' +
			'<link href="#link" data-testid="link" />';

		const matches = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
		const byTestId = (id: string) => container.querySelector(`[data-testid="${id}"]`);

		// Real links are focusable via href.
		expect(matches).toContain(byTestId('anchor'));
		expect(matches).toContain(byTestId('area'));
		// Non-link elements carrying href are not focusable and must be excluded.
		expect(matches).not.toContain(byTestId('span'));
		expect(matches).not.toContain(byTestId('link'));
	});

	it('treats an <a href> inside a trap as focusable (focusFirst lands on it)', async () => {
		const screen = await render(Trap, { props: { content: 'anchor' } });
		await screen.getByTestId('focus-first').click();
		await expect.element(screen.getByTestId('anchor')).toHaveFocus();
	});
});

describe('useFocusTrap Escape coordination', () => {
	it('calls onEscape for a single active trap', async () => {
		const onEscape = vi.fn();
		await render(EscapeTrap, { props: { isActive: true, onEscape, label: 'only' } });
		pressEscape();
		expect(onEscape).toHaveBeenCalledTimes(1);
	});

	it('only the top-most trap responds to Escape when nested', async () => {
		const outer = vi.fn();
		const inner = vi.fn();
		await render(EscapeTrap, { props: { isActive: true, onEscape: outer, label: 'outer' } });
		await render(EscapeTrap, { props: { isActive: true, onEscape: inner, label: 'inner' } });
		// The most recently activated trap (inner) is on top.
		pressEscape();
		expect(inner).toHaveBeenCalledTimes(1);
		expect(outer).not.toHaveBeenCalled();
	});

	it('ignores Escape during IME composition', async () => {
		const onEscape = vi.fn();
		await render(EscapeTrap, { props: { isActive: true, onEscape, label: 'ime' } });
		pressEscape({ isComposing: true });
		expect(onEscape).not.toHaveBeenCalled();
		// keyCode 229 (composition) is also ignored
		pressEscape({ keyCode: 229 });
		expect(onEscape).not.toHaveBeenCalled();
		// a normal Escape still works
		pressEscape();
		expect(onEscape).toHaveBeenCalledTimes(1);
	});

	it('resolves Escape to the DOM-nested inner trap when both mount in one flush', async () => {
		const outer = vi.fn();
		const inner = vi.fn();
		// Outer and inner mount in the SAME flush. Effects run child-before-parent,
		// so the inner trap is PUSHED first — DOM containment, not push order, must
		// decide who answers Escape.
		await render(NestedTraps, { props: { onOuterEscape: outer, onInnerEscape: inner } });
		pressEscape();
		expect(inner).toHaveBeenCalledTimes(1);
		expect(outer).not.toHaveBeenCalled();
	});

	it('falls back to the outer trap once the nested inner trap unmounts', async () => {
		const outer = vi.fn();
		const inner = vi.fn();
		const screen = await render(NestedTraps, {
			props: { onOuterEscape: outer, onInnerEscape: inner }
		});
		await screen.rerender({ onOuterEscape: outer, onInnerEscape: inner, showInner: false });
		pressEscape();
		expect(outer).toHaveBeenCalledTimes(1);
		expect(inner).not.toHaveBeenCalled();
	});

	it('does not respond after the trap is deactivated', async () => {
		const onEscape = vi.fn();
		const screen = await render(EscapeTrap, {
			props: { isActive: true, onEscape, label: 'toggle' }
		});
		await screen.rerender({ isActive: false, onEscape, label: 'toggle' });
		pressEscape();
		expect(onEscape).not.toHaveBeenCalled();
	});
});

describe('useFocusTrap focus restoration', () => {
	it('restores focus to the previously-focused element when deactivated', async () => {
		const screen = await render(RestoreFixture, { props: { isActive: false } });
		const prev = screen.getByTestId('prev').element() as HTMLElement;
		prev.focus();
		await expect.element(prev).toHaveFocus();

		// Activate the trap (captures `prev` as the restore target) and move focus
		// inside it, as auto-focus or a keyboard user would.
		await screen.rerender({ isActive: true });
		const inside = screen.getByTestId('inside').element() as HTMLElement;
		inside.focus();
		await expect.element(inside).toHaveFocus();

		// Deactivating returns focus to where it was before the trap opened.
		await screen.rerender({ isActive: false });
		await expect.element(prev).toHaveFocus();
	});

	it('does not steal focus when it was moved elsewhere outside the trap', async () => {
		const screen = await render(RestoreFixture, { props: { isActive: false } });
		const prev = screen.getByTestId('prev').element() as HTMLElement;
		prev.focus();

		await screen.rerender({ isActive: true });
		// The user (or a consumer that self-restores) moves focus to a different
		// outside control while the trap is open.
		const other = screen.getByTestId('other').element() as HTMLElement;
		other.focus();

		await screen.rerender({ isActive: false });
		// Focus is left where the user put it — not yanked back to `prev`.
		await expect.element(other).toHaveFocus();
		expect(prev).not.toHaveFocus();
	});

	it('does not crash or restore when the captured element was removed', async () => {
		const screen = await render(RestoreFixture, { props: { isActive: false } });
		const prev = screen.getByTestId('prev').element() as HTMLElement;
		prev.focus();

		await screen.rerender({ isActive: true });
		(screen.getByTestId('inside').element() as HTMLElement).focus();

		// Remove the captured element from the DOM before the trap deactivates.
		await screen.rerender({ isActive: true, showPrev: false });
		await screen.rerender({ isActive: false, showPrev: false });

		// The restore target is gone, so nothing is restored. Upstream asserts
		// this with `expect(() => rerender(…)).not.toThrow()`, which does not
		// survive the port: our rerender is async, so a synchronous `toThrow`
		// around it would pass vacuously. An error in the teardown fails the test
		// on its own here (vitest fails on uncaught errors), so this asserts the
		// half that would otherwise go unchecked — that no restore happened.
		expect(prev.isConnected).toBe(false);
		expect(document.activeElement).not.toBe(prev);
	});

	it('restores focus when the trap unmounts while active', async () => {
		const screen = await render(RestoreFixture, {
			props: { isActive: true, showTrap: false }
		});
		const prev = screen.getByTestId('prev').element() as HTMLElement;
		prev.focus();

		// Mounting the trap active captures `prev`; then focus moves inside it.
		await screen.rerender({ isActive: true, showTrap: true });
		const inside = screen.getByTestId('inside').element() as HTMLElement;
		inside.focus();
		await expect.element(inside).toHaveFocus();

		// Unmounting the trap (cleanup path, not an isActive flip) still restores.
		await screen.rerender({ isActive: true, showTrap: false });
		await expect.element(prev).toHaveFocus();
	});
});

/**
 * Upstream's `keeps a programmatic focus target when the trap has no tabbable
 * controls`, added at 0.4.2 with #5023: a modal surface whose body is read-only
 * must not let Tab escape to the page behind it.
 *
 * `fireEvent.keyDown(...) === false` carries over as the return of
 * `dispatchEvent`, which is what Testing Library returns: `false` means the
 * event **was** cancelled. So upstream's assertion is that the trap swallows
 * Tab even with nothing tabbable to move to — which is the whole point, since
 * letting it through is how focus escapes to the page behind the modal.
 */
describe('useFocusTrap with no tabbable controls', () => {
	it('keeps a programmatic focus target when the trap has no tabbable controls', async () => {
		const screen = await render(Trap, { props: { content: 'programmatic-only' } });
		const target = screen.getByTestId('programmatic-target').element() as HTMLElement;
		target.focus();

		const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
		const notCancelled = target.dispatchEvent(event);

		expect(notCancelled).toBe(false);
		await expect.element(screen.getByTestId('programmatic-target')).toHaveFocus();
		await expect.element(screen.getByTestId('outside')).not.toHaveFocus();
	});
});
