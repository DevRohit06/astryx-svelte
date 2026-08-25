import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { render } from 'vitest-browser-svelte';
import { resetLayerStackForTests } from '$lib/components/layer/layer-stack.js';
import FlippingHost from './fixtures/layer-invariants-flipping-host.svelte';
import LightboxInRequired from './fixtures/layer-invariants-lightbox-in-required.svelte';
import ModalStack from './fixtures/layer-invariants-modal-stack.svelte';
import OuterAndInner from './fixtures/layer-invariants-outer-and-inner.svelte';
import TipInModal from './fixtures/layer-invariants-tip-in-modal.svelte';

/**
 * Ported from Astryx's `Layer/layerDismissalInvariants.test.tsx` at the 0.5.0
 * pin, which declares **15** cases. **All 15 are here**, in upstream's order,
 * with upstream's titles and assertions. Nothing is dropped.
 *
 * Upstream's own header says what the file is for: every assertion reads the
 * DOM — which dialogs are open — rather than a dismiss spy, because a spy passes
 * when the stack routes to the wrong layer as long as something was called. The
 * open-dialog census cannot. That property is what makes this suite portable
 * verbatim: the census is a DOM query on both sides.
 *
 * This is the cross-family suite. It could not be written here until every
 * overlay family had actually joined the shared stack — before that, a
 * `required` Dialog and a Lightbox over it were on two different Escape paths
 * and the census would have been measuring the gap rather than the invariant.
 *
 * ## Why the client project
 *
 * The stack registers and unregisters on `$effect` teardown, which a component
 * compiled for `svelte/server` never runs, and every case turns on a real
 * `document` listener seeing a real event on real elements.
 *
 * ## Translations (each is a translation, NOT a dropped case)
 *
 * - **Upstream's local components become fixtures.** `Modal`,
 *   `LightboxInRequired`, `OuterAndInner`, `FlippingHost`, `Pair` and `TipLayer`
 *   each wrap component *content*, which is a snippet here and cannot be
 *   authored in a `render()` props object.
 *   `layer-invariants-modal-stack.svelte` is the one addition: upstream writes
 *   each plain nesting as inline JSX, so the six literal shapes become one
 *   self-nesting fixture driven by a `specs` array, and upstream's `Pair` — the
 *   shape whose nested modal is rerendered away — is that same fixture
 *   re-rendered with a shorter `specs`.
 * - **`showModal`/`close` stay mocked**, exactly as upstream mocks them and for
 *   the reason `dialog.svelte.test.ts` documents: the mock strips the real top
 *   layer, focus moves and inertness that upstream also strips, so the census
 *   measures our own open/close wiring rather than the UA's. Restoring the
 *   originals afterwards is this project's addition — the browser page is shared
 *   between suites, where upstream's jsdom document is not.
 * - **`act()` becomes `flushSync()`.** A `$state` write flushes on its own, but
 *   the census is a synchronous DOM read taken immediately after the press, so
 *   it has to be taken after the effect that calls `dialog.close()` has run.
 *   `flushSync` is what makes that ordering exact; it is upstream's `act`, with
 *   the same job and the same scope.
 * - **`composingEscape` is the same press with `isComposing` in the init dict.**
 *   Upstream reaches for `Object.defineProperty` because jsdom's `KeyboardEvent`
 *   drops the flag; a real `KeyboardEvent` honours it, as
 *   `use-layer-dismissal.svelte.test.ts` already documents.
 * - **The census queries the document directly.** Upstream's
 *   `screen.queryAllByRole` pair is Testing Library's accessibility-tree query
 *   over `document.body`; the client project's locators are Playwright's and
 *   asynchronous, and a closed `<dialog>` is `display: none` so a role query
 *   would have to opt into hidden nodes anyway — the same translation every
 *   modal suite here makes. The filter, the `aria-label` mapping and the sort
 *   are upstream's unchanged, including asking for both roles so a
 *   `purpose="required"` Dialog (which renders `role="alertdialog"`) is not
 *   invisible to the census.
 */

const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;

// jsdom implements neither, and Dialog drives both. Kept in a real browser for
// the determinism reason in the header.
beforeEach(() => {
	HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
		this.setAttribute('open', '');
	});
	HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
		this.removeAttribute('open');
	});
});

afterEach(() => {
	resetLayerStackForTests();
	HTMLDialogElement.prototype.showModal = originalShowModal;
	HTMLDialogElement.prototype.close = originalClose;
});

/** Every dialog element the census can see, in document order. */
function allDialogs(): HTMLElement[] {
	return [
		...document.querySelectorAll<HTMLElement>('dialog, [role="dialog"], [role="alertdialog"]')
	];
}

/**
 * Everything on screen right now, named the way a person would name it and
 * sorted so the census is about WHICH layers are up, not what order two role
 * queries happened to return them in.
 */
function onScreen(): string[] {
	// `purpose="required"` renders role="alertdialog", so both roles have to be
	// asked for or a required Dialog is invisible to the census.
	return allDialogs()
		.filter((d) => (d as HTMLDialogElement).open)
		.map((d) => d.getAttribute('aria-label') ?? '(unnamed)')
		.sort();
}

function pressEscape(options: KeyboardEventInit = {}): KeyboardEvent {
	const event = new KeyboardEvent('keydown', {
		key: 'Escape',
		bubbles: true,
		cancelable: true,
		...options
	});
	document.dispatchEvent(event);
	flushSync();
	return event;
}

function composingEscape(): KeyboardEvent {
	return pressEscape({ isComposing: true });
}

function fireCancel(label: string): Event {
	const event = new Event('cancel', { bubbles: false, cancelable: true });
	const dialog = allDialogs().find((d) => d.getAttribute('aria-label') === label)!;
	dialog.dispatchEvent(event);
	flushSync();
	return event;
}

/** Upstream's `act(() => element.click())`, as a real dispatched click. */
function click(element: Element): void {
	element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
	flushSync();
}

describe('one Escape dismisses exactly one layer', () => {
	it('peels a modal-in-modal one press at a time', async () => {
		await render(ModalStack, { specs: [{ label: 'Outer' }, { label: 'Inner' }] });
		expect(onScreen()).toEqual(['Inner', 'Outer']);

		pressEscape();
		expect(onScreen()).toEqual(['Outer']);

		pressEscape();
		expect(onScreen()).toEqual([]);
	});

	it('peels three layers in order, never two on one press', async () => {
		await render(ModalStack, {
			specs: [{ label: 'Outer' }, { label: 'Middle' }, { label: 'Inner' }]
		});
		expect(onScreen()).toEqual(['Inner', 'Middle', 'Outer']);

		pressEscape();
		expect(onScreen()).toEqual(['Middle', 'Outer']);

		pressEscape();
		expect(onScreen()).toEqual(['Outer']);

		pressEscape();
		expect(onScreen()).toEqual([]);
	});

	it('lets a Lightbox over a required Dialog take the press, and only it', async () => {
		await render(LightboxInRequired);
		expect(onScreen()).toEqual(['A photo', 'Required']);

		pressEscape();
		expect(onScreen()).toEqual(['Required']);
	});

	it('reaches the layer below once the one above is closed another way', async () => {
		// Closing the inner modal with its own control must leave the stack clean,
		// so the next Escape finds the outer rather than falling into a gap.
		const screen = await render(OuterAndInner);
		expect(onScreen()).toEqual(['Inner', 'Outer']);

		click(screen.getByText('close inner', { exact: true }).element());
		expect(onScreen()).toEqual(['Outer']);

		pressEscape();
		expect(onScreen()).toEqual([]);
	});
});

describe("escapeBehavior: 'block'", () => {
	it('swallows the press so nothing behind a required Dialog dismisses either', async () => {
		await render(ModalStack, {
			specs: [{ label: 'Host' }, { label: 'Required', purpose: 'required' }]
		});

		const event = pressEscape();

		expect(onScreen()).toEqual(['Host', 'Required']);
		// Claimed, not merely ignored — an unclaimed press is what lets the
		// browser's own close watcher dismiss something behind our back.
		expect(event.defaultPrevented).toBe(true);
	});

	it('does not block a layer opened ON TOP of the required Dialog', async () => {
		await render(ModalStack, {
			specs: [{ label: 'Required', purpose: 'required' }, { label: 'Above' }]
		});

		pressEscape();
		expect(onScreen()).toEqual(['Required']);
	});
});

describe('re-registration does not reorder the stack', () => {
	it('keeps a Dialog whose purpose flips below the layer opened over it', async () => {
		// A Dialog re-registers when `purpose` changes, because that changes its
		// escapeBehavior. Re-registering must not promote it above a layer that
		// opened on top of it — otherwise a flip to `required` silently starts
		// swallowing presses meant for the layer above.
		const screen = await render(FlippingHost);
		expect(onScreen()).toEqual(['Host', 'Later']);

		click(screen.getByText('make required', { exact: true }).element());

		pressEscape();
		expect(onScreen()).toEqual(['Host']);
	});
});

describe('close requests the browser starts itself', () => {
	it('follows the same top-most rule as a press', async () => {
		await render(ModalStack, { specs: [{ label: 'Outer' }, { label: 'Inner' }] });

		// The Android back gesture on the layer that is NOT on top.
		const outerRequest = fireCancel('Outer');
		expect(outerRequest.defaultPrevented).toBe(true);
		expect(onScreen()).toEqual(['Inner', 'Outer']);

		fireCancel('Inner');
		expect(onScreen()).toEqual(['Outer']);
	});

	it('is declined while an IME composition is running', async () => {
		const screen = await render(ModalStack, {
			specs: [{ label: 'Composing', hasField: true }]
		});
		const field = screen.getByLabelText('field', { exact: true }).element();

		field.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
		fireCancel('Composing');
		expect(onScreen()).toEqual(['Composing']);

		field.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
		fireCancel('Composing');
		expect(onScreen()).toEqual([]);
	});
});

describe('an Escape that cancels an IME composition', () => {
	it('dismisses nothing AND claims the press, so no close request follows', async () => {
		await render(ModalStack, { specs: [{ label: 'Composing' }] });

		const event = composingEscape();

		expect(onScreen()).toEqual(['Composing']);
		// The half that matters. Standing down without claiming leaves the browser
		// free to raise its own close request, which arrives at `cancel` with no
		// composition state to read and closes the dialog on the same keypress.
		expect(event.defaultPrevented).toBe(true);
	});

	it('leaves the press alone when there is no layer to protect', async () => {
		await render(ModalStack, { specs: [{ label: 'Closed', isOpenInitially: false }] });

		const event = composingEscape();

		expect(event.defaultPrevented).toBe(false);
	});
});

describe('registration and teardown', () => {
	it('drops a layer from the stack when it unmounts', async () => {
		const screen = await render(ModalStack, {
			specs: [{ label: 'Bottom' }, { label: 'Top' }]
		});
		await screen.rerender({ specs: [{ label: 'Bottom' }] });

		pressEscape();
		expect(onScreen()).toEqual([]);
	});

	it('stops claiming Escape once the last layer is gone', async () => {
		// The listener is shared and lives on `document`. If unmounting left an
		// entry behind, the page would keep losing Escape presses to a layer that
		// is not there — no error, no visual tell.
		const screen = await render(ModalStack, { specs: [{ label: 'Only' }] });
		expect(pressEscape().defaultPrevented).toBe(true);

		screen.unmount();

		expect(pressEscape().defaultPrevented).toBe(false);
	});
});

describe('presence is asked at press time', () => {
	it('skips a registered layer that is no longer on screen', async () => {
		// Hover layers register for their whole lifetime and answer presence from
		// the DOM. A cached answer would let an idle tooltip eat a press meant for
		// the dialog underneath it.
		const isTipShowing = false;
		const tipDismissed = vi.fn();

		await render(TipInModal, {
			isTipShowing: () => isTipShowing,
			onTipDismiss: tipDismissed
		});

		// Idle: the press must reach the dialog.
		pressEscape();
		expect(tipDismissed).not.toHaveBeenCalled();
		expect(onScreen()).toEqual([]);
	});

	it('lets the same registration claim the press once it is showing', async () => {
		let isTipShowing = true;
		const tipDismissed = vi.fn();

		await render(TipInModal, {
			isTipShowing: () => isTipShowing,
			onTipDismiss: tipDismissed
		});

		pressEscape();
		expect(tipDismissed).toHaveBeenCalledTimes(1);
		expect(onScreen()).toEqual(['Host']);

		isTipShowing = false;
		pressEscape();
		expect(onScreen()).toEqual([]);
	});
});
