import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet, tick } from 'svelte';
import { createAttachmentKey } from 'svelte/attachments';
import { render } from 'vitest-browser-svelte';
import CallbackRefFlow from './fixtures/bottom-sheet-callback-ref-flow.svelte';
import ConditionalFlow from './fixtures/bottom-sheet-conditional-flow.svelte';
import Flow from './fixtures/bottom-sheet-flow.svelte';
import ModeSwitchFlow from './fixtures/bottom-sheet-mode-switch-flow.svelte';
import NestedStandaloneSheetFlow from './fixtures/bottom-sheet-nested-standalone-flow.svelte';
import SingleSwitcher from './fixtures/bottom-sheet-switcher-single.svelte';
import { stubMatchMedia } from './stub-match-media.js';

/**
 * Ported from Astryx's `BottomSheet/BottomSheetSwitcher.test.tsx` at v0.4.5 —
 * **all 24 cases**, none dropped and none added.
 *
 * Runs in the **client** project, in real Chromium, where upstream's is jsdom.
 * The same three harness differences as `bottom-sheet.svelte.test.ts` apply and
 * for the same reasons: `<dialog>` and pointer capture are stubbed, DOM
 * assertions wait for a flush because a Svelte `$state` write lands on the
 * microtask queue where `fireEvent` re-renders React synchronously, and the
 * query-aware `matchMedia` stub keeps `prefers-reduced-motion` false.
 *
 * Two translations of shape, not of behaviour:
 *
 * - **Upstream's harness components become fixtures.** A Svelte snippet cannot
 *   declare a component tree inside a case, so `Flow`, `ConditionalFlow`,
 *   `NestedStandaloneSheetFlow`, `CallbackRefFlow` and `ModeSwitchFlow` live in
 *   `fixtures/`, and the single-sheet shapes share one parameterised fixture.
 * - **`ref` is an attachment**, this port's standing ref-callback translation —
 *   including in the callback-ref case, where alternating between two of them
 *   is what makes the parent re-render churn the binding.
 */

const dialogPrototype = HTMLDialogElement.prototype;
const elementPrototype = Element.prototype;
let restoreDialog: (() => void) | null = null;
let restorePointerCapture: (() => void) | null = null;

beforeEach(() => {
	const dialogOriginals = {
		showModal: dialogPrototype.showModal,
		show: dialogPrototype.show,
		close: dialogPrototype.close
	};
	dialogPrototype.showModal = vi.fn(function (this: HTMLDialogElement) {
		this.setAttribute('open', '');
	});
	dialogPrototype.show = vi.fn(function (this: HTMLDialogElement) {
		this.setAttribute('open', '');
	});
	dialogPrototype.close = vi.fn(function (this: HTMLDialogElement) {
		this.removeAttribute('open');
	});
	restoreDialog = () => {
		dialogPrototype.showModal = dialogOriginals.showModal;
		dialogPrototype.show = dialogOriginals.show;
		dialogPrototype.close = dialogOriginals.close;
	};

	const captureOriginals = {
		setPointerCapture: elementPrototype.setPointerCapture,
		releasePointerCapture: elementPrototype.releasePointerCapture
	};
	elementPrototype.setPointerCapture = vi.fn();
	elementPrototype.releasePointerCapture = vi.fn();
	restorePointerCapture = () => {
		elementPrototype.setPointerCapture = captureOriginals.setPointerCapture;
		elementPrototype.releasePointerCapture = captureOriginals.releasePointerCapture;
	};

	stubMatchMedia({ reduceMotion: false, matches: false });
	vi.stubGlobal('scrollTo', vi.fn());
});

afterEach(() => {
	restoreDialog?.();
	restoreDialog = null;
	restorePointerCapture?.();
	restorePointerCapture = null;
	vi.unstubAllGlobals();
});

function text(value: string) {
	return createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));
}

async function flush(): Promise<void> {
	await tick();
}

function getSharedDialog(): HTMLDialogElement {
	const dialog = document.querySelector('dialog');
	if (!dialog) {
		throw new Error('shared dialog not found');
	}
	return dialog;
}

function dialogNamed(name: string): HTMLDialogElement {
	const dialog = [...document.querySelectorAll('dialog')].find(
		(candidate) => candidate.getAttribute('aria-label') === name
	);
	if (!dialog) {
		throw new Error(`dialog ${name} not found`);
	}
	return dialog;
}

function getSheetPanel(element: HTMLElement): HTMLElement {
	if (element.classList.contains('astryx-bottom-sheet')) {
		return element;
	}
	const sheet = element.querySelector<HTMLElement>('.astryx-bottom-sheet');
	if (!sheet) {
		throw new Error('sheet panel not found');
	}
	return sheet;
}

function getSheetLayer(testId: string): HTMLElement {
	const panel = document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
	const layer = panel?.parentElement;
	if (!(layer instanceof HTMLElement)) {
		throw new Error('sheet layer not found');
	}
	return layer;
}

function handleOf(panel: HTMLElement): HTMLElement {
	const handle = panel.firstElementChild;
	if (!(handle instanceof HTMLElement)) {
		throw new Error('sheet handle not found');
	}
	return handle;
}

function button(name: string): HTMLButtonElement {
	const found = [...document.querySelectorAll('button')].find(
		(candidate) => candidate.textContent?.trim() === name
	);
	if (!found) {
		throw new Error(`button ${name} not found`);
	}
	return found;
}

async function click(target: Element): Promise<void> {
	target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
	await flush();
}

async function press(target: Element, key: string, init: KeyboardEventInit = {}): Promise<boolean> {
	const allowed = target.dispatchEvent(
		new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
	);
	await flush();
	return allowed;
}

async function finishSheetTransition(
	element: HTMLElement,
	propertyName: 'transform' | 'opacity'
): Promise<void> {
	await flush();
	getSheetPanel(element).dispatchEvent(
		new TransitionEvent('transitionend', { propertyName, bubbles: true })
	);
	await flush();
}

function mockSheetTop(sheet: HTMLElement, top: number): void {
	const bounds = {
		x: 0,
		y: top,
		top,
		right: 640,
		bottom: 800,
		left: 0,
		width: 640,
		height: 800 - top,
		toJSON: () => ({})
	} as DOMRect;
	vi.spyOn(sheet, 'getBoundingClientRect').mockReturnValue(bounds);
	if (sheet.parentElement) {
		vi.spyOn(sheet.parentElement, 'getBoundingClientRect').mockReturnValue(bounds);
	}
}

function pointer(
	target: Element,
	type: 'pointerdown' | 'pointermove' | 'pointerup',
	init: { clientY: number; timeStamp?: number }
): boolean {
	const event = new Event(type, { bubbles: true, cancelable: true });
	Object.defineProperties(event, {
		button: { value: 0 },
		clientY: { value: init.clientY },
		isPrimary: { value: true },
		pointerId: { value: 1 },
		...(init.timeStamp == null ? {} : { timeStamp: { value: init.timeStamp } })
	});
	return target.dispatchEvent(event);
}

describe('BottomSheetSwitcher', () => {
	it('opens only the sheet selected by activeSheet', async () => {
		await render(Flow, { props: {} });

		await click(button('Start flow'));

		expect(getSheetLayer('details-sheet')).not.toHaveAttribute('hidden');
		expect(getSheetLayer('confirm-sheet')).toHaveAttribute('hidden');
		expect(getComputedStyle(getSheetLayer('confirm-sheet')).display).toBe('none');
		expect(document.querySelectorAll('dialog[open]')).toHaveLength(1);
		expect(dialogPrototype.showModal).toHaveBeenCalledTimes(1);
		expect(dialogPrototype.show).not.toHaveBeenCalled();
		expect(getSharedDialog()).toHaveAttribute('aria-modal', 'true');
		expect(getSharedDialog()).toHaveAccessibleName('Details');
	});

	it('forwards sheet DOM props and refs to its panel in the shared dialog', async () => {
		const attached: HTMLElement[] = [];
		await render(SingleSwitcher, {
			props: {
				activeSheet: 'details',
				sheetTestId: 'details-layer',
				sheetOwner: 'settings',
				sheetAttach: (node: HTMLElement) => {
					attached.push(node);
				}
			}
		});

		const panel = document.querySelector<HTMLElement>('[data-testid="details-layer"]')!;
		expect(attached).toEqual([panel]);
		expect(panel.classList.contains('astryx-bottom-sheet')).toBe(true);
		expect(panel).toHaveAttribute('data-sheet-owner', 'settings');
		expect(getSharedDialog().contains(panel)).toBe(true);
	});

	it('forwards switcher DOM props, events, styles, and refs to the shared dialog', async () => {
		const attached: HTMLElement[] = [];
		const onclick = vi.fn();
		const onActiveSheetChange = vi.fn();

		await render(SingleSwitcher, {
			props: {
				activeSheet: 'details',
				onActiveSheetChange,
				'aria-label': 'Notification setup',
				'data-flow-owner': 'settings',
				class: 'consumer-switcher',
				style: 'inset-inline-start: 12px',
				onclick,
				[createAttachmentKey()]: (node: HTMLElement) => {
					attached.push(node);
				}
			}
		});

		const dialog = getSharedDialog();
		expect(attached).toEqual([dialog]);
		expect(dialog).toHaveAccessibleName('Notification setup');
		expect(dialog).toHaveAttribute('data-flow-owner', 'settings');
		expect(dialog.classList.contains('consumer-switcher')).toBe(true);
		expect(dialog.style.insetInlineStart).toBe('12px');

		await click(dialog);
		expect(onclick).toHaveBeenCalledTimes(1);
		expect(onActiveSheetChange).toHaveBeenCalledWith(null);
	});

	it('resets switcher context for a sheet nested inside item content', async () => {
		await render(NestedStandaloneSheetFlow, { props: {} });
		const opener = button('Open nested sheet');
		opener.focus();
		await click(opener);

		const nestedDialog = dialogNamed('Nested standalone sheet');
		expect(nestedDialog).toHaveAttribute('open');
		expect(document.activeElement).toBe(getSheetPanel(nestedDialog));
		expect(document.querySelectorAll('dialog[open]')).toHaveLength(2);
		expect(dialogPrototype.showModal).toHaveBeenCalledTimes(2);

		await press(nestedDialog, 'Escape');
		await finishSheetTransition(nestedDialog, 'transform');

		expect(nestedDialog).not.toHaveAttribute('open');
		expect(dialogNamed('Details')).toHaveAttribute('open');
		expect(document.activeElement).toBe(opener);
	});

	it('keeps the previous sheet stationary until the new entrance finishes, then fades it', async () => {
		await render(Flow, { props: {} });
		await click(button('Start flow'));
		const sharedDialog = getSharedDialog();
		const detailsSheet = getSheetLayer('details-sheet');
		const confirmSheet = getSheetLayer('confirm-sheet');

		await click(button('Continue'));

		expect(detailsSheet).not.toHaveAttribute('hidden');
		expect(detailsSheet).toHaveAttribute('inert');
		expect(detailsSheet).toHaveAttribute('aria-hidden', 'true');
		expect(confirmSheet).not.toHaveAttribute('hidden');
		expect(confirmSheet).not.toHaveAttribute('inert');
		expect(document.querySelectorAll('dialog[open]')).toHaveLength(1);
		expect(getSharedDialog()).toBe(sharedDialog);
		expect(sharedDialog).toHaveAccessibleName('Confirm');

		// The previous sheet is covered, not exiting: neither transform nor opacity
		// completion may release it before the new entrance completes.
		await finishSheetTransition(detailsSheet, 'transform');
		await finishSheetTransition(detailsSheet, 'opacity');
		expect(detailsSheet).not.toHaveAttribute('hidden');

		await finishSheetTransition(confirmSheet, 'transform');
		expect(detailsSheet).not.toHaveAttribute('hidden');

		await finishSheetTransition(detailsSheet, 'opacity');

		expect(detailsSheet).toHaveAttribute('hidden');
		expect(confirmSheet).not.toHaveAttribute('hidden');
		expect(document.querySelectorAll('dialog[open]')).toHaveLength(1);
		expect(getSharedDialog()).toBe(sharedDialog);

		await click(button('Back'));

		expect(detailsSheet).not.toHaveAttribute('hidden');
		expect(confirmSheet).not.toHaveAttribute('hidden');
		expect(confirmSheet).toHaveAttribute('inert');
		await finishSheetTransition(detailsSheet, 'transform');
		expect(confirmSheet).not.toHaveAttribute('hidden');
		await finishSheetTransition(confirmSheet, 'opacity');

		expect(detailsSheet).not.toHaveAttribute('hidden');
		expect(confirmSheet).toHaveAttribute('hidden');
		expect(document.querySelectorAll('dialog[open]')).toHaveLength(1);
		expect(getSharedDialog()).toBe(sharedDialog);
	});

	it('moves a taller previous sheet down while the shorter new sheet enters, then waits for both', async () => {
		await render(Flow, { props: {} });
		await click(button('Start flow'));
		const detailsSheet = getSheetLayer('details-sheet');
		const confirmSheet = getSheetLayer('confirm-sheet');
		const detailsPanel = getSheetPanel(detailsSheet);
		const confirmPanel = getSheetPanel(confirmSheet);
		mockSheetTop(detailsPanel, 100);
		mockSheetTop(confirmPanel, 300);

		await click(button('Continue'));

		expect(detailsSheet).not.toHaveAttribute('hidden');
		expect(detailsPanel.style.transform).toBe('translateY(200px)');

		// The incoming entrance may finish first, but opacity cannot hide the
		// retained sheet until its concurrent alignment also completes.
		await finishSheetTransition(confirmSheet, 'transform');
		await finishSheetTransition(detailsSheet, 'opacity');
		expect(detailsSheet).not.toHaveAttribute('hidden');
		await finishSheetTransition(detailsSheet, 'transform');
		expect(detailsSheet).not.toHaveAttribute('hidden');
		expect(detailsPanel.style.transform).toBe('translateY(200px)');
		await finishSheetTransition(detailsSheet, 'opacity');

		expect(detailsSheet).toHaveAttribute('hidden');
		expect(confirmSheet).not.toHaveAttribute('hidden');
	});

	it('waits for the incoming entrance when top-edge alignment finishes first', async () => {
		await render(Flow, { props: {} });
		await click(button('Start flow'));
		const detailsSheet = getSheetLayer('details-sheet');
		const confirmSheet = getSheetLayer('confirm-sheet');
		const detailsPanel = getSheetPanel(detailsSheet);
		mockSheetTop(detailsPanel, 100);
		mockSheetTop(getSheetPanel(confirmSheet), 300);

		await click(button('Continue'));
		expect(detailsPanel.style.transform).toBe('translateY(200px)');

		await finishSheetTransition(detailsSheet, 'transform');
		await finishSheetTransition(detailsSheet, 'opacity');
		expect(detailsSheet).not.toHaveAttribute('hidden');
		await finishSheetTransition(confirmSheet, 'transform');
		await finishSheetTransition(detailsSheet, 'opacity');

		expect(detailsSheet).toHaveAttribute('hidden');
		expect(confirmSheet).not.toHaveAttribute('hidden');
	});

	it('replaces an unfinished outgoing sheet during rapid navigation', async () => {
		await render(Flow, { props: {} });
		await click(button('Start flow'));
		const detailsSheet = getSheetLayer('details-sheet');
		const confirmSheet = getSheetLayer('confirm-sheet');

		await click(button('Continue'));
		await click(button('Back'));

		expect(detailsSheet).not.toHaveAttribute('hidden');
		expect(detailsSheet).not.toHaveAttribute('inert');
		expect(confirmSheet).not.toHaveAttribute('hidden');
		expect(confirmSheet).toHaveAttribute('inert');
		expect(document.querySelectorAll('dialog[open]')).toHaveLength(1);

		await finishSheetTransition(confirmSheet, 'opacity');
		expect(detailsSheet).not.toHaveAttribute('hidden');
		expect(confirmSheet).toHaveAttribute('hidden');
	});

	it('ignores late scrim updates from an outgoing sheet gesture', async () => {
		await render(Flow, { props: {} });
		await click(button('Start flow'));

		const detailsPanel = getSheetPanel(getSheetLayer('details-sheet'));
		mockSheetTop(detailsPanel, 100);
		const handle = handleOf(detailsPanel);

		pointer(handle, 'pointerdown', { clientY: 100, timeStamp: 0 });
		pointer(handle, 'pointermove', { clientY: 600, timeStamp: 16 });
		await flush();
		expect(getSharedDialog().style.getPropertyValue('--_sheet-scrim-opacity')).not.toBe('1');

		await click(button('Continue'));
		expect(getSharedDialog().style.getPropertyValue('--_sheet-scrim-opacity')).toBe('1');

		pointer(handle, 'pointermove', { clientY: 680, timeStamp: 32 });
		await flush();
		expect(getSharedDialog().style.getPropertyValue('--_sheet-scrim-opacity')).toBe('1');
	});

	it('keeps an active handoff when a consumer callback ref changes', async () => {
		await render(CallbackRefFlow, { props: {} });
		const detailsSheet = getSheetLayer('callback-details-sheet');
		const confirmSheet = getSheetLayer('callback-confirm-sheet');

		await click(button('Continue with callback ref'));
		expect(detailsSheet).not.toHaveAttribute('hidden');
		expect(detailsSheet).toHaveAttribute('inert');
		expect(confirmSheet).not.toHaveAttribute('hidden');

		await click(button('Rerender parent'));

		expect(detailsSheet).not.toHaveAttribute('hidden');
		expect(detailsSheet).toHaveAttribute('inert');
		expect(confirmSheet).not.toHaveAttribute('hidden');
	});

	it('dismisses the flow from the one shared scrim', async () => {
		await render(Flow, { props: {} });
		await click(button('Start flow'));
		const sharedDialog = getSharedDialog();

		await click(sharedDialog);

		const outgoingSheet = getSheetLayer('details-sheet');
		expect(outgoingSheet).not.toHaveAttribute('hidden');
		expect(outgoingSheet).toHaveAttribute('inert');
		expect(sharedDialog.style.getPropertyValue('--_sheet-scrim-opacity')).toBe('0');
		expect(document.body.style.position).toBe('fixed');

		await finishSheetTransition(outgoingSheet, 'transform');

		expect(sharedDialog).not.toHaveAttribute('open');
		expect(document.body.style.position).not.toBe('fixed');
	});

	it('releases the shared modal layer when the closing sheet unmounts immediately', async () => {
		await render(ConditionalFlow, { props: {} });
		await click(button('Start conditional flow'));
		const sharedDialog = dialogNamed('Conditional details');

		await press(sharedDialog, 'Escape');
		// The sheet unmounts in the same pass, so the switcher hears about it from
		// an attachment teardown, updates state, and only then runs the effect that
		// closes the dialog. React collapses that into the commit; here it is one
		// more turn of the microtask queue.
		await flush();

		expect(sharedDialog).not.toHaveAttribute('open');
		expect(document.body.style.position).not.toBe('fixed');
	});

	it('keeps the shared dialog inline and opens it modally', async () => {
		await render(SingleSwitcher, {
			props: { activeSheet: 'details', label: 'Inline modal details', clip: true }
		});

		const clippingAncestor = document.querySelector('[data-testid="clipping-ancestor"]')!;
		const dialog = dialogNamed('Inline modal details');
		expect(clippingAncestor.contains(dialog)).toBe(true);
		expect(dialog).toHaveAttribute('open');
		expect(dialogPrototype.showModal).toHaveBeenCalledTimes(1);
	});

	it('keeps focus in a modal sheet that has no tabbable controls', async () => {
		await render(SingleSwitcher, {
			props: {
				activeSheet: 'details',
				label: 'Read-only details',
				// The tabbable control outside the switcher is the case's premise:
				// without somewhere for focus to escape to, "keeps focus in" cannot
				// fail. Upstream renders it as a sibling of the switcher.
				backgroundAction: true,
				children: text('Read-only content')
			}
		});

		const dialog = dialogNamed('Read-only details');
		const panel = getSheetPanel(dialog);
		expect(document.activeElement).toBe(panel);
		expect(await press(panel, 'Tab')).toBe(false);
		expect(document.activeElement).toBe(panel);
		expect(button('Background action')).not.toHaveFocus();
	});

	it('can coordinate a non-modal flow without rendering a scrim', async () => {
		await render(SingleSwitcher, { props: { activeSheet: 'details', hasScrim: false } });

		const dialog = getSharedDialog();
		expect(dialog).not.toHaveAttribute('aria-modal');
		expect(dialog).toHaveAttribute('open');
		expect(dialogPrototype.show).toHaveBeenCalledTimes(1);
		expect(dialogPrototype.showModal).not.toHaveBeenCalled();
		expect(document.body.style.position).not.toBe('fixed');
	});

	it('requests activeSheet=null when the active sheet dismisses', async () => {
		const onActiveSheetChange = vi.fn();
		await render(SingleSwitcher, {
			props: {
				activeSheet: 'details',
				onActiveSheetChange,
				second: text('Content')
			}
		});

		await press(dialogNamed('Details'), 'Escape');

		expect(onActiveSheetChange).toHaveBeenCalledWith(null);
	});

	it('honors purpose=form for a switcher-managed sheet', async () => {
		const onActiveSheetChange = vi.fn();
		await render(SingleSwitcher, {
			props: {
				activeSheet: 'details',
				onActiveSheetChange,
				label: 'Edit details',
				purpose: 'form'
			}
		});
		const dialog = getSharedDialog();
		const handle = handleOf(getSheetPanel(dialog));

		await click(dialog);
		pointer(handle, 'pointerdown', { clientY: 0 });
		pointer(handle, 'pointermove', { clientY: 120 });
		pointer(handle, 'pointerup', { clientY: 120 });
		await flush();

		expect(onActiveSheetChange).not.toHaveBeenCalled();
		expect(dialog.style.getPropertyValue('--_sheet-scrim-opacity')).toBe('1');

		await press(dialog, 'Escape');
		dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
		await flush();

		expect(onActiveSheetChange).toHaveBeenCalledTimes(2);
		expect(onActiveSheetChange).toHaveBeenNthCalledWith(1, null);
		expect(onActiveSheetChange).toHaveBeenNthCalledWith(2, null);
	});

	it('honors purpose=required for a switcher-managed sheet', async () => {
		const onActiveSheetChange = vi.fn();
		await render(SingleSwitcher, {
			props: {
				activeSheet: 'details',
				onActiveSheetChange,
				label: 'Required details',
				purpose: 'required'
			}
		});
		const dialog = getSharedDialog();
		expect(dialog.getAttribute('role')).toBe('alertdialog');
		const handle = handleOf(getSheetPanel(dialog));

		await click(dialog);
		await press(dialog, 'Escape');
		dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
		pointer(handle, 'pointerdown', { clientY: 0 });
		pointer(handle, 'pointermove', { clientY: 120 });
		pointer(handle, 'pointerup', { clientY: 120 });
		await flush();

		expect(onActiveSheetChange).not.toHaveBeenCalled();
		expect(dialog.style.getPropertyValue('--_sheet-scrim-opacity')).toBe('1');
	});

	it('restores the active sheet when a context menu interrupts its drag', async () => {
		const onActiveSheetChange = vi.fn();
		await render(SingleSwitcher, { props: { activeSheet: 'details', onActiveSheetChange } });
		const dialog = getSharedDialog();
		const panel = getSheetPanel(dialog);
		const handle = handleOf(panel);

		pointer(handle, 'pointerdown', { clientY: 0 });
		pointer(handle, 'pointermove', { clientY: 300 });
		await flush();
		expect(panel.style.transform).toBe('translateY(300px)');

		expect(
			handle.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
		).toBe(false);
		await flush();

		expect(panel.style.transform).toBe('');
		expect(dialog.style.getPropertyValue('--_sheet-scrim-opacity')).toBe('1');
		expect(onActiveSheetChange).not.toHaveBeenCalled();
	});

	it('ignores Escape while an IME composition is active', async () => {
		const onActiveSheetChange = vi.fn();
		// Modal, as upstream renders it: a modal switcher hands Escape to the focus
		// trap, so this exercises the trap's IME guard rather than the switcher's
		// own `!isModal` branch. Upstream carries that same local guard and ships no
		// case for it, so neither do we.
		await render(SingleSwitcher, {
			props: { activeSheet: 'details', onActiveSheetChange }
		});

		const dialog = dialogNamed('Details');
		await press(dialog, 'Escape', { isComposing: true });
		await press(dialog, 'Escape', { keyCode: 229 });

		expect(onActiveSheetChange).not.toHaveBeenCalled();
	});

	it('lets a nested focus trap handle Escape before the switcher', async () => {
		const onActiveSheetChange = vi.fn();
		const onNestedEscape = vi.fn();
		await render(SingleSwitcher, {
			props: { activeSheet: 'details', onActiveSheetChange, nestedTrap: true, onNestedEscape }
		});

		await press(document.querySelector('[data-testid="nested-escape-trap"]')!, 'Escape');

		expect(onNestedEscape).toHaveBeenCalledTimes(1);
		expect(onActiveSheetChange).not.toHaveBeenCalled();
	});

	it('returns focus to the original opener after a multi-sheet flow ends', async () => {
		await render(Flow, { props: {} });
		const opener = button('Start flow');
		opener.focus();
		await click(opener);
		await click(button('Continue'));

		await press(dialogNamed('Confirm'), 'Escape');
		expect(document.activeElement).not.toBe(opener);
		await finishSheetTransition(getSheetLayer('confirm-sheet'), 'transform');

		expect(document.activeElement).toBe(opener);
	});

	it('captures a new focus trigger after switching through non-modal mode', async () => {
		await render(ModeSwitchFlow, { props: {} });
		const firstOpener = button('Open first modal');
		const secondOpener = button('Open second modal');

		firstOpener.focus();
		await click(firstOpener);
		await click(button('Make non-modal'));
		await click(button('Close flow'));
		await finishSheetTransition(getSheetLayer('mode-details-sheet'), 'transform');

		secondOpener.focus();
		await click(secondOpener);
		await click(button('Close flow'));
		await finishSheetTransition(getSheetLayer('mode-details-sheet'), 'transform');

		expect(document.activeElement).toBe(secondOpener);
	});

	it('does not refocus the panel when an incoming transition completes', async () => {
		await render(Flow, { props: {} });
		await click(button('Start flow'));
		await click(button('Continue'));

		const confirmSheet = getSheetLayer('confirm-sheet');
		const backButton = button('Back');
		backButton.focus();
		await finishSheetTransition(confirmSheet, 'transform');

		expect(document.activeElement).toBe(backButton);
	});
});
