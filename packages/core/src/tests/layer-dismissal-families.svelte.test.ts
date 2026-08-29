import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { resetLayerStackForTests } from '$lib/components/layer/layer-stack.js';
import ControlledHoverCard from './fixtures/layer-families-controlled-hover-card.svelte';
import ControlledTooltip from './fixtures/layer-families-controlled-tooltip.svelte';
import FamiliesLightbox from './fixtures/layer-families-lightbox.svelte';
import LightboxInRequired from './fixtures/layer-families-lightbox-in-required.svelte';
import FamiliesMobileNav from './fixtures/layer-families-mobile-nav.svelte';
import RequiredDialog from './fixtures/layer-families-required-dialog.svelte';

/**
 * Ported from Astryx's `Layer/layerDismissalFamilies.test.tsx` at the 0.5.0 pin,
 * which declares **11** cases. **All 11 are here**, in upstream's order, with
 * upstream's titles and assertions. Nothing is dropped.
 *
 * Upstream's header states the question: the stack routes an Escape press to the
 * top-most REGISTERED layer and claims it, so a family that is not on the stack
 * cannot be reached once anything else is. Lightbox and MobileNav were that gap
 * — both closed via the native `cancel` event alone, and a `required` Dialog
 * underneath swallowed every press before it got there. Each family's own
 * behavior is tested in its own file; this one only asks who takes the press.
 *
 * ## Why the client project
 *
 * Two of the four families answer presence from `:popover-open` and the other
 * two register on `$effect`, none of which a `svelte/server` render performs.
 * The press itself is a real event on a real `document`.
 *
 * ## Translations (each is a translation, NOT a dropped case)
 *
 * - **Each JSX tree becomes a fixture.** Every one of them puts markup inside a
 *   component — a Lightbox inside a Dialog, a Dialog inside a drawer, a trigger
 *   and a card body — and component content is a snippet here, so it can only be
 *   authored in a template. Where upstream writes two trees that differ by one
 *   sibling, the fixture takes a flag (`hasDialogAbove`, `hasLightboxBelow`,
 *   `shape`) that mounts exactly what upstream's second literal adds.
 * - **The Popover stub is gone; the spy is not.** Upstream's `beforeAll` exists
 *   only to give jsdom a Popover API — `showPopover`/`hidePopover` over a
 *   `WeakMap`, plus a `matches` override so `:popover-open` answers from it.
 *   Chromium implements all of it, and keeping the stub would substitute a model
 *   of the thing under test for the thing itself; the two cases that assert
 *   *that `hidePopover` was not called* wrap the native method in a `vi.fn`
 *   instead, which still calls through. That is the pattern
 *   `hover-card.svelte.test.ts` and `dropdown-menu.svelte.test.ts` already set.
 * - **`showModal`/`close` stay mocked**, as upstream mocks them and as
 *   `dialog.svelte.test.ts` documents: the mock strips the real top layer, focus
 *   moves and inertness upstream also strips, so the assertions measure our own
 *   wiring. Restoring the originals afterwards is this project's addition — the
 *   browser page is shared between suites.
 * - **`getByRole('dialog', {hidden: true})` becomes a container
 *   `querySelector`.** A closed `<dialog>` is `display: none` in a real browser,
 *   so the accessibility-tree query would have to opt into hidden nodes; the
 *   container query is what every modal suite here uses, and it selects by the
 *   same `aria-label` upstream's `getDialog` filters on.
 * - **The two hover-layer cases await their own show.** Upstream clears
 *   `onCardChange` immediately after `render`, because React has already
 *   committed the effect that opened the popover; here the layer opens in an
 *   `$effect` and mounts its container lazily, so the open is awaited through
 *   that same spy before it is cleared. Nothing is relaxed — the wait stands in
 *   for upstream's synchronous commit, and every assertion after it is
 *   upstream's.
 */

const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;
const originalShowPopover = HTMLElement.prototype.showPopover;
const originalHidePopover = HTMLElement.prototype.hidePopover;

beforeEach(() => {
	// Upstream's `beforeAll` popover stub is a jsdom polyfill and is gone; what
	// survives is its per-test `mockClear`, as a fresh call-through spy.
	HTMLElement.prototype.showPopover = vi.fn(originalShowPopover);
	HTMLElement.prototype.hidePopover = vi.fn(originalHidePopover);
	// jsdom does not implement showModal/close.
	HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
		this.setAttribute('open', '');
	});
	HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
		this.removeAttribute('open');
	});
});

afterEach(() => {
	resetLayerStackForTests();
	HTMLElement.prototype.showPopover = originalShowPopover;
	HTMLElement.prototype.hidePopover = originalHidePopover;
	HTMLDialogElement.prototype.showModal = originalShowModal;
	HTMLDialogElement.prototype.close = originalClose;
});

function pressEscape(): KeyboardEvent {
	const event = new KeyboardEvent('keydown', {
		key: 'Escape',
		bubbles: true,
		cancelable: true
	});
	document.dispatchEvent(event);
	return event;
}

function fireCancel(dialog: Element): Event {
	const event = new Event('cancel', { bubbles: false, cancelable: true });
	dialog.dispatchEvent(event);
	return event;
}

const dialogIn = (container: HTMLElement): HTMLDialogElement => {
	const el = container.querySelector('dialog');
	if (!(el instanceof HTMLDialogElement)) throw new Error('expected a <dialog> element');
	return el;
};

const getDialog = (container: HTMLElement, label: string): HTMLDialogElement => {
	const el = container.querySelector(`dialog[aria-label="${label}"]`);
	if (!(el instanceof HTMLDialogElement)) throw new Error(`expected a <dialog> named ${label}`);
	return el;
};

describe('overlay families on the shared dismissal stack', () => {
	describe('Lightbox', () => {
		it('takes the Escape when it is open over a required Dialog', async () => {
			const onLightboxChange = vi.fn();
			const onDialogChange = vi.fn();

			await render(LightboxInRequired, { onLightboxChange, onDialogChange });

			const event = pressEscape();

			expect(onLightboxChange).toHaveBeenCalledWith(false);
			expect(onDialogChange).not.toHaveBeenCalled();
			expect(event.defaultPrevented).toBe(true);
		});

		it('closes on a browser-initiated cancel when it is top-most', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(FamiliesLightbox, { onLightboxChange: onOpenChange });

			const event = fireCancel(dialogIn(screen.container));

			expect(event.defaultPrevented).toBe(true);
			expect(onOpenChange).toHaveBeenCalledWith(false);
		});

		it('stays open on a browser-initiated cancel when it is not top-most', async () => {
			const onLightboxChange = vi.fn();

			const screen = await render(FamiliesLightbox, {
				onLightboxChange,
				hasDialogAbove: true
			});

			const event = fireCancel(getDialog(screen.container, 'A photo'));

			expect(event.defaultPrevented).toBe(true);
			expect(onLightboxChange).not.toHaveBeenCalled();
		});
	});

	describe('MobileNav', () => {
		it('takes the Escape when it opens over a required Dialog', async () => {
			const onNavChange = vi.fn();
			const onDialogChange = vi.fn();

			await render(FamiliesMobileNav, {
				onNavChange,
				onDialogChange,
				shape: 'over-required'
			});

			const event = pressEscape();

			expect(onNavChange).toHaveBeenCalledWith(false);
			expect(onDialogChange).not.toHaveBeenCalled();
			expect(event.defaultPrevented).toBe(true);
		});

		it('closes on a browser-initiated cancel when it is top-most', async () => {
			const onOpenChange = vi.fn();
			const screen = await render(FamiliesMobileNav, { onNavChange: onOpenChange });

			const event = fireCancel(getDialog(screen.container, 'Drawer'));

			expect(event.defaultPrevented).toBe(true);
			expect(onOpenChange).toHaveBeenCalledWith(false);
		});

		it('stays open on a browser-initiated cancel when it is not top-most', async () => {
			const onNavChange = vi.fn();

			const screen = await render(FamiliesMobileNav, {
				onNavChange,
				shape: 'with-dialog-inside'
			});

			const event = fireCancel(getDialog(screen.container, 'Drawer'));

			expect(event.defaultPrevented).toBe(true);
			expect(onNavChange).not.toHaveBeenCalled();
		});
	});

	describe('required Dialog', () => {
		it('still swallows an Escape when it is alone', async () => {
			const onDialogChange = vi.fn();

			await render(RequiredDialog, { onDialogChange });

			const event = pressEscape();

			expect(onDialogChange).not.toHaveBeenCalled();
			expect(event.defaultPrevented).toBe(true);
		});

		it('still swallows an Escape with a Lightbox open UNDER it', async () => {
			const onLightboxChange = vi.fn();
			const onDialogChange = vi.fn();

			await render(RequiredDialog, {
				onDialogChange,
				onLightboxChange,
				hasLightboxBelow: true
			});

			pressEscape();

			expect(onDialogChange).not.toHaveBeenCalled();
			expect(onLightboxChange).not.toHaveBeenCalled();
		});
	});

	// Controlled follows control state for `isOpen`: Escape still attempts the
	// close, but only the caller's update function may perform it. Dialog has
	// always worked this way; these two now do too.
	describe('controlled hover layers', () => {
		it('a controlled HoverCard takes the press and reports instead of hiding', async () => {
			const onCardChange = vi.fn();
			const onDialogChange = vi.fn();

			await render(ControlledHoverCard, { onCardChange, onDialogChange });
			// The layer opens in an effect; upstream's commit is synchronous.
			await vi.waitFor(() => {
				expect(onCardChange).toHaveBeenCalledWith(true);
			});
			onCardChange.mockClear();
			vi.mocked(HTMLElement.prototype.hidePopover).mockClear();

			const event = pressEscape();

			expect(onCardChange).toHaveBeenCalledWith(false);
			expect(HTMLElement.prototype.hidePopover).not.toHaveBeenCalled();
			expect(onDialogChange).not.toHaveBeenCalled();
			expect(event.defaultPrevented).toBe(true);
		});

		it('a controlled Tooltip takes the press and reports instead of hiding', async () => {
			const onTipChange = vi.fn();
			const onDialogChange = vi.fn();

			await render(ControlledTooltip, { onTipChange, onDialogChange });
			await vi.waitFor(() => {
				expect(onTipChange).toHaveBeenCalledWith(true);
			});
			onTipChange.mockClear();
			vi.mocked(HTMLElement.prototype.hidePopover).mockClear();

			const event = pressEscape();

			expect(onTipChange).toHaveBeenCalledWith(false);
			expect(HTMLElement.prototype.hidePopover).not.toHaveBeenCalled();
			expect(onDialogChange).not.toHaveBeenCalled();
			expect(event.defaultPrevented).toBe(true);
		});

		it('leaves the Dialog unclosable when the consumer discards the request', async () => {
			// The round-6 regression, now by consumer choice rather than by ours: a
			// layer that holds itself open and ignores its own change handler keeps
			// taking the press, and nothing behind it can be reached.
			const onCardChange = vi.fn();
			const onDialogChange = vi.fn();

			await render(ControlledHoverCard, {
				onCardChange,
				onDialogChange,
				cardText: 'Stuck card'
			});
			await vi.waitFor(() => {
				expect(onCardChange).toHaveBeenCalledWith(true);
			});
			onCardChange.mockClear();

			pressEscape();
			pressEscape();

			expect(onCardChange).toHaveBeenCalledTimes(2);
			expect(onDialogChange).not.toHaveBeenCalled();
		});
	});
});
