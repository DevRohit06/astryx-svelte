import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRawSnippet, tick } from 'svelte';
import { createAttachmentKey } from 'svelte/attachments';
import { render } from 'vitest-browser-svelte';
import BottomSheet from '$lib/components/bottom-sheet/bottom-sheet.svelte';
import ExitHarness from './fixtures/bottom-sheet-exit-harness.svelte';
import { stubMatchMedia } from './stub-match-media.js';

/**
 * Ported from Astryx's `BottomSheet/BottomSheet.test.tsx` at v0.4.5.
 *
 * Runs in the **client** project, in real Chromium, where upstream's is jsdom.
 * That difference drives most of the restatements:
 *
 * - **`<dialog>` is stubbed anyway.** jsdom has no `showModal`/`show`/`close`,
 *   so upstream installs prototype stubs that toggle the `open` attribute. Real
 *   Chromium has them, but the assertions are about *which* one the host calls,
 *   and a genuine top-layer dialog inside a test harness moves focus in ways the
 *   focus cases would then be measuring instead of the sheet. The stubs stay,
 *   restored per case rather than through `unstubAllGlobals` — they are
 *   prototype methods, not globals.
 * - **Pointer capture is stubbed too.** Upstream installs it only if missing;
 *   Chromium has the real one, and it throws on a synthetic `pointerId`.
 * - **`matchMedia` uses this repo's query-aware stub**, not a blanket one, so
 *   `prefers-reduced-motion` stays false while width queries answer as before —
 *   the settle path these cases exercise is skipped entirely under reduced
 *   motion.
 * - **`ref` is an attachment**, this port's standing ref-callback translation.
 * - **Handler and prop names are Svelte's**: `onclick`, `class`, and `children`
 *   as a snippet.
 */

// A sheet has no stops unless its host asks for them, so the cases that
// exercise detents pass their own. These three — a 14% peek, a half-height
// stop, and a 92% stop the Tall budget already covers — are the geometry the
// height assertions below are written against.
const SNAP_POINTS: ReadonlyArray<number> = [0.14, 0.5, 0.92];

let rafMock: ReturnType<typeof vi.fn>;

const dialogPrototype = HTMLDialogElement.prototype;
const elementPrototype = Element.prototype;
let restoreDialog: (() => void) | null = null;
let restorePointerCapture: (() => void) | null = null;
let restoreRects: (() => void) | null = null;
let sheetTransitionRule: HTMLStyleElement | null = null;

function stubDialogMethods(): void {
	const original = {
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
		dialogPrototype.showModal = original.showModal;
		dialogPrototype.show = original.show;
		dialogPrototype.close = original.close;
	};
}

/**
 * Measure every element at zero, the way jsdom does.
 *
 * Upstream's geometry cases are written against that baseline: the sheet's
 * height comes from the `ResizeObserver` entry each case feeds in, and nothing
 * else. Chromium measures a real 872px sheet instead, which would silently
 * replace every number in this file with one derived from the test browser's
 * window. Cases that need a specific rect install their own spy on the element
 * they care about, and an own property shadows this prototype stub.
 */
function stubZeroRects(): void {
	const original = elementPrototype.getBoundingClientRect;
	elementPrototype.getBoundingClientRect = function () {
		return rect({ top: 0, bottom: 0 });
	};
	restoreRects = () => {
		elementPrototype.getBoundingClientRect = original;
	};
}

/**
 * Give the sheet a resolvable transition, as a themed page does.
 *
 * The browser project loads no stylesheet, so the sheet's compiled rule is
 * absent and `transition-duration` computes to its initial `0s` — every
 * transition would then resolve on the frame it starts, collapsing the
 * two-phase snap these cases are about into one render. jsdom reaches upstream's
 * behaviour from the opposite direction: with no stylesheet at all the timing
 * reads back as *unresolved*, so `waitForTransition` keeps the native event
 * authoritative and each case drives it by hand.
 *
 * A real rule rather than an inline style, because the hook suppresses the
 * transition mid-drag with an inline `transition: none` — which has to keep
 * winning, and would not against inline longhands of the harness's own.
 */
function giveTheSheetATransition(): void {
	sheetTransitionRule = document.createElement('style');
	sheetTransitionRule.textContent =
		'.astryx-bottom-sheet { transition-property: transform, opacity; transition-duration: 410ms; transition-delay: 0s; }';
	document.head.append(sheetTransitionRule);
}

function stubPointerCapture(): void {
	const original = {
		setPointerCapture: elementPrototype.setPointerCapture,
		releasePointerCapture: elementPrototype.releasePointerCapture
	};
	elementPrototype.setPointerCapture = vi.fn();
	elementPrototype.releasePointerCapture = vi.fn();
	restorePointerCapture = () => {
		elementPrototype.setPointerCapture = original.setPointerCapture;
		elementPrototype.releasePointerCapture = original.releasePointerCapture;
	};
}

beforeEach(() => {
	stubDialogMethods();
	stubPointerCapture();
	stubZeroRects();
	giveTheSheetATransition();
	stubMatchMedia({ reduceMotion: false, matches: false });
	rafMock = vi.fn((callback: FrameRequestCallback) => {
		callback(0);
		return 1;
	});
	vi.stubGlobal('requestAnimationFrame', rafMock);
	vi.stubGlobal('cancelAnimationFrame', vi.fn());
	vi.stubGlobal('scrollTo', vi.fn());
});

afterEach(() => {
	restoreDialog?.();
	restoreDialog = null;
	restorePointerCapture?.();
	restorePointerCapture = null;
	restoreRects?.();
	restoreRects = null;
	sheetTransitionRule?.remove();
	sheetTransitionRule = null;
	vi.unstubAllGlobals();
});

function text(value: string) {
	return createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));
}

function html(markup: string) {
	return createRawSnippet(() => ({ render: () => markup }));
}

function getDialog(): HTMLDialogElement {
	const dialog = document.querySelector('dialog');
	if (!dialog) {
		throw new Error('sheet dialog not found');
	}
	return dialog;
}

function getSheet(): HTMLElement {
	const sheet = document.querySelector<HTMLElement>('.astryx-bottom-sheet');
	if (!sheet) {
		throw new Error('sheet panel not found');
	}
	return sheet;
}

function getBody(): HTMLElement {
	const body = getSheet().lastElementChild;
	if (!(body instanceof HTMLElement)) {
		throw new Error('sheet scroll body not found');
	}
	return body;
}

// The grab handle is the panel's first child (decorative, aria-hidden).
function getHandle(): HTMLElement {
	const handle = getSheet().querySelector<HTMLElement>('[aria-hidden="true"]');
	if (!handle) {
		throw new Error('grab handle not found');
	}
	return handle;
}

function finishSheetExit(): void {
	getSheet().dispatchEvent(
		new TransitionEvent('transitionend', { propertyName: 'transform', bubbles: true })
	);
}

/** Drive a pointer drag on the grab handle. */
function drag(handle: HTMLElement, points: { y: number }[]): void {
	const [down, ...rest] = points;
	handle.dispatchEvent(
		new PointerEvent('pointerdown', {
			pointerId: 1,
			clientY: down.y,
			button: 0,
			isPrimary: true,
			bubbles: true,
			cancelable: true
		})
	);
	for (const point of rest) {
		handle.dispatchEvent(
			new PointerEvent('pointermove', {
				pointerId: 1,
				clientY: point.y,
				bubbles: true,
				cancelable: true
			})
		);
	}
	const last = points[points.length - 1];
	handle.dispatchEvent(
		new PointerEvent('pointerup', {
			pointerId: 1,
			clientY: last.y,
			bubbles: true,
			cancelable: true
		})
	);
}

function rect({ top, bottom }: { top: number; bottom: number }): DOMRect {
	return {
		x: 0,
		y: top,
		top,
		right: 400,
		bottom,
		left: 0,
		width: 400,
		height: bottom - top,
		toJSON: () => ({})
	} as DOMRect;
}

function resizeEntry(
	borderBoxHeight: number,
	contentBoxHeight = borderBoxHeight
): ResizeObserverEntry {
	// Core typechecks its tests, so this partial stands in for the full entry
	// the way `shared-resize-observer` does: only the fields the sheet reads.
	const entry: Partial<ResizeObserverEntry> = {
		borderBoxSize: [{ blockSize: borderBoxHeight, inlineSize: 100 }],
		contentRect: rect({ top: 0, bottom: contentBoxHeight })
	};
	return entry as ResizeObserverEntry;
}

function mockVisualViewport(height: number, offsetTop = 0) {
	const viewport = Object.assign(new EventTarget(), { height, offsetTop });
	vi.stubGlobal('visualViewport', viewport);
	return viewport;
}

// The layout viewport — `100dvh`, `window.innerHeight` — which is what the
// sheet's height budget and its detents are measured against. Deliberately
// separate from the visual viewport above: the mobile keyboard shrinks that one
// and leaves this one alone, and the sheet has to tell them apart.
function mockWindowHeight(height: number): void {
	vi.stubGlobal('innerHeight', height);
}

interface ResizeObserverRecord {
	callback: ResizeObserverCallback;
	observed: Set<Element>;
}

function mockResizeObserverInstances(): ResizeObserverRecord[] {
	const observers: ResizeObserverRecord[] = [];
	class ResizeObserverMock {
		callback: ResizeObserverCallback;
		observed = new Set<Element>();

		constructor(callback: ResizeObserverCallback) {
			this.callback = callback;
			observers.push(this);
		}

		observe(target: Element) {
			this.observed.add(target);
		}

		unobserve(target: Element) {
			this.observed.delete(target);
		}

		disconnect() {
			this.observed.clear();
		}
	}
	vi.stubGlobal('ResizeObserver', ResizeObserverMock);
	return observers;
}

/** Deliver a measurement to the observer watching the sheet. */
async function measureSheet(
	observers: ResizeObserverRecord[],
	borderBoxHeight: number,
	contentBoxHeight?: number
): Promise<void> {
	const sheet = getSheet();
	const sheetObserver = observers.find((instance) => instance.observed.has(sheet));
	sheetObserver?.callback(
		[resizeEntry(borderBoxHeight, contentBoxHeight)],
		sheetObserver as unknown as ResizeObserver
	);
	await flush();
}

/**
 * A pointer event with a controlled `timeStamp`, which the velocity branch
 * reads. Constructed as a plain `Event` with the fields defined on it, as
 * upstream does — a real `PointerEvent` takes its timestamp from the clock.
 */
function fireTimedPointer(
	target: Element,
	type: 'pointerdown' | 'pointermove' | 'pointerup',
	{ time, y }: { time: number; y: number }
): boolean {
	const event = new Event(type, { bubbles: true, cancelable: true });
	Object.defineProperties(event, {
		button: { value: 0 },
		clientY: { value: y },
		isPrimary: { value: true },
		pointerId: { value: 1 },
		timeStamp: { value: time }
	});
	return target.dispatchEvent(event);
}

/**
 * End the sheet's transform transition.
 *
 * Flushes first: React re-renders synchronously inside `fireEvent`, so upstream
 * can fire `transitionEnd` on the line after a release and the listener is
 * already attached. Here the effect that attaches it runs on the microtask
 * queue, and an event dispatched before that lands on nothing.
 */
async function endTransform(): Promise<void> {
	await flush();
	getSheet().dispatchEvent(
		new TransitionEvent('transitionend', { propertyName: 'transform', bubbles: true })
	);
	await flush();
}

/** Collect reconciliation frames instead of running them, so the intermediate
 * render stays visible to the assertions that follow. */
function holdAnimationFrames(): FrameRequestCallback[] {
	const frames: FrameRequestCallback[] = [];
	rafMock.mockImplementation((callback: FrameRequestCallback) => {
		frames.push(callback);
		return frames.length;
	});
	return frames;
}

async function runHeldFrames(frames: FrameRequestCallback[]): Promise<void> {
	frames.splice(0).forEach((frame) => frame(0));
	await flush();
}

function closeButton(): HTMLButtonElement {
	const button = [...document.querySelectorAll('button')].find(
		(candidate) => candidate.textContent === 'Close sheet'
	);
	if (!button) {
		throw new Error('close button not found');
	}
	return button;
}

/**
 * Let Svelte apply what an event just changed.
 *
 * React's `fireEvent` flushes the render synchronously, so upstream reads the
 * DOM on the next line. A Svelte `$state` write lands on the microtask queue, so
 * every DOM assertion that follows a dispatched event waits for `tick()` first.
 * Assertions on a mock, which the handler calls synchronously, do not.
 */
async function flush(): Promise<void> {
	await tick();
}

function press(target: Element, key: string): void {
	target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function click(target: Element): void {
	target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

describe('BottomSheet', () => {
	it('renders children when open and applies the accessible label', async () => {
		await render(BottomSheet, {
			props: {
				isOpen: true,
				onOpenChange: () => {},
				label: 'Filters',
				children: text('Sheet content')
			}
		});
		const dialog = getDialog();
		expect(dialog).toBeInTheDocument();
		expect(dialog.getAttribute('aria-label')).toBe('Filters');
		expect(dialog.textContent).toContain('Sheet content');
	});

	it('forwards DOM props and refs to the visual panel, not the dialog host', async () => {
		const attached: (HTMLElement | null)[] = [];
		const onclick = vi.fn();
		await render(BottomSheet, {
			props: {
				isOpen: true,
				onOpenChange: () => {},
				label: 'Filters',
				'data-testid': 'filters-panel',
				'data-sheet-owner': 'search',
				class: 'custom-panel',
				onclick,
				children: text('Content'),
				[createAttachmentKey()]: (node: HTMLElement) => {
					attached.push(node);
				}
			}
		});

		const panel = document.querySelector<HTMLElement>('[data-testid="filters-panel"]')!;
		const dialog = getDialog();
		expect(attached).toEqual([panel]);
		expect(panel.tagName).toBe('DIV');
		expect(panel.classList.contains('astryx-bottom-sheet')).toBe(true);
		expect(panel.classList.contains('custom-panel')).toBe(true);
		expect(panel.getAttribute('data-sheet-owner')).toBe('search');
		expect(dialog.hasAttribute('data-testid')).toBe(false);

		click(panel);
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('keeps consumer content as the last scroll-body child', async () => {
		await render(BottomSheet, {
			props: {
				isOpen: true,
				onOpenChange: () => {},
				label: 'Filters',
				children: html('<div data-testid="consumer-content">Sheet content</div>')
			}
		});
		const body = getBody();
		const consumer = document.querySelector('[data-testid="consumer-content"]')!;

		expect(body.children).toHaveLength(1);
		expect(body.lastElementChild).toBe(consumer);
		expect(consumer.matches(':last-child')).toBe(true);
	});

	it('does not show when isOpen is false', async () => {
		await render(BottomSheet, {
			props: {
				isOpen: false,
				onOpenChange: () => {},
				label: 'Filters',
				children: text('Hidden')
			}
		});
		expect(dialogPrototype.showModal).not.toHaveBeenCalled();
	});

	it('opens modally (showModal + aria-modal)', async () => {
		await render(BottomSheet, {
			props: {
				isOpen: true,
				onOpenChange: () => {},
				label: 'Filters',
				children: text('Content')
			}
		});
		expect(dialogPrototype.showModal).toHaveBeenCalled();
		expect(getDialog().getAttribute('aria-modal')).toBe('true');
	});

	it('requests close on Escape', async () => {
		const onOpenChange = vi.fn();
		await render(BottomSheet, {
			props: { isOpen: true, onOpenChange, label: 'Filters', children: text('Content') }
		});
		press(getDialog(), 'Escape');
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('requests close when the scrim (dialog element itself) is clicked', async () => {
		const onOpenChange = vi.fn();
		await render(BottomSheet, {
			props: { isOpen: true, onOpenChange, label: 'Filters', children: text('Content') }
		});
		click(getDialog());
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('purpose=form blocks scrim and swipe dismissal but allows Escape', async () => {
		const onOpenChange = vi.fn();
		await render(BottomSheet, {
			props: {
				isOpen: true,
				purpose: 'form',
				onOpenChange,
				label: 'Edit profile',
				children: text('Content')
			}
		});
		const dialog = getDialog();

		click(dialog);
		drag(getHandle(), [{ y: 0 }, { y: 40 }, { y: 120 }]);

		expect(onOpenChange).not.toHaveBeenCalled();
		expect(dialog.style.getPropertyValue('--_sheet-scrim-opacity')).toBe('1');

		press(dialog, 'Escape');
		dialog.dispatchEvent(new Event('cancel', { cancelable: true }));

		expect(onOpenChange).toHaveBeenCalledTimes(2);
		expect(onOpenChange).toHaveBeenNthCalledWith(1, false);
		expect(onOpenChange).toHaveBeenNthCalledWith(2, false);
	});

	it('purpose=required blocks every implicit dismissal path', async () => {
		const onOpenChange = vi.fn();
		await render(BottomSheet, {
			props: {
				isOpen: true,
				purpose: 'required',
				onOpenChange,
				label: 'Required action',
				children: text('Content')
			}
		});
		const dialog = getDialog();
		expect(dialog.getAttribute('role')).toBe('alertdialog');

		click(dialog);
		press(dialog, 'Escape');
		dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
		drag(getHandle(), [{ y: 0 }, { y: 40 }, { y: 120 }]);

		expect(onOpenChange).not.toHaveBeenCalled();
		expect(dialog.style.getPropertyValue('--_sheet-scrim-opacity')).toBe('1');
	});

	it('keeps a standalone modal sheet presented through its exit animation', async () => {
		await render(ExitHarness, { props: {} });
		const dialog = getDialog();

		click(closeButton());
		await vi.waitFor(() => expect(dialog.hasAttribute('inert')).toBe(true));

		expect(dialog).toHaveAttribute('open');
		expect(dialog).toHaveAttribute('aria-hidden', 'true');
		expect(dialog.hasAttribute('aria-modal')).toBe(false);
		expect(dialog.style.getPropertyValue('--_sheet-scrim-opacity')).toBe('0');
		expect(document.body.style.position).toBe('fixed');

		finishSheetExit();
		await vi.waitFor(() => expect(dialog.hasAttribute('open')).toBe(false));

		expect(document.body.style.position).not.toBe('fixed');
	});

	it('does not dismiss when the sheet surface itself is clicked', async () => {
		const onOpenChange = vi.fn();
		await render(BottomSheet, {
			props: { isOpen: true, onOpenChange, label: 'Filters', children: text('Content') }
		});
		// Only a click that lands on the dialog (the transparent area) dismisses;
		// clicks bubbling up from the sheet must not.
		click(getSheet());
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	describe('hasScrim={false} (non-modal)', () => {
		it('opens non-modally: show() instead of showModal(), no aria-modal', async () => {
			await render(BottomSheet, {
				props: {
					isOpen: true,
					onOpenChange: () => {},
					label: 'Filters',
					hasScrim: false,
					children: text('Content')
				}
			});
			expect(dialogPrototype.show).toHaveBeenCalled();
			expect(dialogPrototype.showModal).not.toHaveBeenCalled();
			expect(getDialog().hasAttribute('aria-modal')).toBe(false);
		});

		it('does not dismiss when the shell (dialog element itself) is clicked', async () => {
			// No scrim: a tap on the transparent shell must pass through to the
			// page, not dismiss the sheet.
			const onOpenChange = vi.fn();
			await render(BottomSheet, {
				props: {
					isOpen: true,
					onOpenChange,
					label: 'Filters',
					hasScrim: false,
					children: text('Content')
				}
			});
			click(getDialog());
			expect(onOpenChange).not.toHaveBeenCalled();
		});

		it('still closes on Escape while focus is inside', async () => {
			const onOpenChange = vi.fn();
			await render(BottomSheet, {
				props: {
					isOpen: true,
					onOpenChange,
					label: 'Filters',
					hasScrim: false,
					children: text('Content')
				}
			});
			press(getDialog(), 'Escape');
			expect(onOpenChange).toHaveBeenCalledWith(false);
		});

		it('still dismisses on a downward swipe past the threshold', async () => {
			const onOpenChange = vi.fn();
			await render(BottomSheet, {
				props: {
					isOpen: true,
					onOpenChange,
					label: 'Filters',
					hasScrim: false,
					children: text('Content')
				}
			});
			drag(getHandle(), [{ y: 0 }, { y: 40 }, { y: 120 }]);
			expect(onOpenChange).toHaveBeenCalledWith(false);
		});

		it('does not steal focus onto the panel on open', async () => {
			await render(BottomSheet, {
				props: {
					isOpen: true,
					onOpenChange: () => {},
					label: 'Filters',
					hasScrim: false,
					children: html('<button type="button">First action</button>')
				}
			});
			// The background stays interactive, so the sheet must not grab focus.
			expect(document.activeElement).not.toBe(getSheet());
		});

		it('still honors a descendant with data-autofocus', async () => {
			await render(BottomSheet, {
				props: {
					isOpen: true,
					onOpenChange: () => {},
					label: 'Filters',
					hasScrim: false,
					children: html('<input data-autofocus aria-label="Search" />')
				}
			});
			expect(document.activeElement).toBe(document.querySelector('input[data-autofocus]'));
		});

		it('keeps a standalone non-modal sheet visible until its exit ends', async () => {
			await render(ExitHarness, { props: { hasScrim: false } });
			const dialog = getDialog();

			click(closeButton());
			await vi.waitFor(() => expect(dialog.hasAttribute('inert')).toBe(true));

			expect(dialog).toHaveAttribute('open');
			expect(document.body.style.position).not.toBe('fixed');

			finishSheetExit();
			await vi.waitFor(() => expect(dialog.hasAttribute('open')).toBe(false));
		});
	});

	describe('grab handle', () => {
		it('renders a decorative handle hidden from assistive tech', async () => {
			await render(BottomSheet, {
				props: {
					isOpen: true,
					onOpenChange: () => {},
					label: 'Filters',
					children: text('Content')
				}
			});
			expect(getHandle()).toHaveAttribute('aria-hidden', 'true');
		});
	});

	describe('height', () => {
		it('renders for each named height without error', async () => {
			for (const height of ['hug', 'capped', 'tall'] as const) {
				const screen = await render(BottomSheet, {
					props: {
						isOpen: true,
						onOpenChange: () => {},
						label: 'Filters',
						height,
						children: text('Content')
					}
				});
				expect(getDialog()).toBeInTheDocument();
				screen.unmount();
			}
		});

		it('accepts a freeform height (number or CSS length)', async () => {
			for (const height of [480, '70dvh'] as const) {
				const screen = await render(BottomSheet, {
					props: {
						isOpen: true,
						onOpenChange: () => {},
						label: 'Filters',
						height,
						children: text('Content')
					}
				});
				expect(getDialog()).toBeInTheDocument();
				screen.unmount();
			}
		});

		it('keeps the full layout height at the peek detent', async () => {
			const observers = mockResizeObserverInstances();
			mockVisualViewport(800);
			mockWindowHeight(800);
			await render(BottomSheet, {
				props: {
					isOpen: true,
					onOpenChange: () => {},
					label: 'Release notes',
					snapPoints: SNAP_POINTS,
					height: 'tall',
					children: text('Content')
				}
			});
			const sheet = getSheet();
			await measureSheet(observers, 784, 736);

			// Settle on the shortest 112px peek: offset 736 - 112 = 624.
			fireTimedPointer(getHandle(), 'pointerdown', { time: 0, y: 0 });
			fireTimedPointer(getHandle(), 'pointermove', { time: 1000, y: 600 });
			fireTimedPointer(getHandle(), 'pointerup', { time: 2000, y: 600 });
			await endTransform();

			// A glance state does not reflow the content into a sliver: the sheet
			// keeps its full layout height and slides below the viewport instead.
			expect(sheet.style.height).toBe('');
			expect(sheet.style.transform).toBe('translateY(624px)');
			expect(getBody().style.paddingBlockEnd).toBe('');

			// Dragging back up off the peek stays transform-only for the same
			// reason — there is no shortened layout to restore first.
			fireTimedPointer(getHandle(), 'pointerdown', { time: 3000, y: 600 });
			fireTimedPointer(getHandle(), 'pointermove', { time: 4000, y: 400 });
			await flush();
			expect(sheet.style.transform).toBe('translateY(424px)');
			expect(sheet.style.height).toBe('784px');
			expect(getBody().style.paddingBlockEnd).toBe('');

			// Releasing at the taller p50 detent resizes the scrolling area.
			fireTimedPointer(getHandle(), 'pointerup', { time: 5000, y: 400 });
			await endTransform();
			expect(sheet.style.height).toBe('448px');
			expect(sheet.style.transform).toBe('');
		});

		it('swaps height for transform without a transition when released on a detent', async () => {
			const observers = mockResizeObserverInstances();
			mockVisualViewport(800);
			mockWindowHeight(800);
			await render(BottomSheet, {
				props: {
					isOpen: true,
					onOpenChange: () => {},
					label: 'Release notes',
					snapPoints: SNAP_POINTS,
					height: 'tall',
					children: text('Content')
				}
			});
			const sheet = getSheet();
			await measureSheet(observers, 784, 736);

			// The magnetise step lands a slow drag exactly on the p50 detent
			// (offset 336), so the release has no travel left to animate and
			// reconciles at once.
			fireTimedPointer(getHandle(), 'pointerdown', { time: 0, y: 0 });
			fireTimedPointer(getHandle(), 'pointermove', { time: 1000, y: 336 });
			await flush();
			expect(sheet.style.transform).toBe('translateY(336px)');
			expect(sheet.style.height).toBe('784px');

			const frames = holdAnimationFrames();
			fireTimedPointer(getHandle(), 'pointerup', { time: 2000, y: 336 });
			await flush();

			// Height and transform swap roles in this one render. That is only
			// invisible with transitions off; live, the composited transform would
			// animate the whole 336px swap while the height jumped, and the sheet
			// would lurch away from the detent before coming back to it.
			expect(sheet.style.height).toBe('448px');
			expect(sheet.style.transform).toBe('');
			expect(sheet.style.transition).toBe('none');

			// Transitions come back for the next gesture.
			await runHeldFrames(frames);
			expect(sheet.style.transition).toBe('');
		});

		it('uses transforms while dragging and resizes to the visible snapped height', async () => {
			const observers = mockResizeObserverInstances();
			mockVisualViewport(800);
			mockWindowHeight(800);
			await render(BottomSheet, {
				props: {
					isOpen: true,
					onOpenChange: () => {},
					label: 'Release notes',
					snapPoints: SNAP_POINTS,
					height: 'tall',
					children: text('Content')
				}
			});
			const sheet = getSheet();
			// A Tall sheet has 736px visible height in this 800px viewport plus the
			// 48px border-box reserve held below the viewport.
			await measureSheet(observers, 784, 736);

			fireTimedPointer(getHandle(), 'pointerdown', { time: 0, y: 0 });
			fireTimedPointer(getHandle(), 'pointermove', { time: 1000, y: 240 });
			await flush();

			expect(sheet.style.transform).toBe('translateY(240px)');
			expect(sheet.style.height).toBe('784px');
			expect(sheet.style.transition).toBe('none');

			fireTimedPointer(getHandle(), 'pointerup', { time: 2000, y: 240 });
			await flush();
			// Release remains transform-only until the snap finishes.
			// p50 is a visible 400px sheet: 784 - 48 - 400 = 336px offset.
			expect(sheet.style.transform).toBe('translateY(336px)');
			expect(sheet.style.height).toBe('784px');
			expect(sheet.style.transition).toBe('');

			const frames = holdAnimationFrames();
			await endTransform();
			expect(sheet.style.transform).toBe('');
			expect(sheet.style.height).toBe('448px');
			// The transform reset is transition-free so it cannot produce a second
			// fly-in animation after the snap has already reached its destination.
			expect(sheet.style.transition).toBe('none');
			expect(frames.length).toBeGreaterThan(0);
			await runHeldFrames(frames);
			expect(sheet.style.transition).toBe('');

			// Ignore ResizeObserver frames from the height reconciliation. The next
			// drag must still use the original 784px border-box height.
			await measureSheet(observers, 500, 452);
			fireTimedPointer(getHandle(), 'pointerdown', { time: 3000, y: 240 });
			fireTimedPointer(getHandle(), 'pointermove', { time: 4000, y: 140 });
			await flush();
			expect(sheet.style.transform).toBe('translateY(236px)');
			expect(sheet.style.height).toBe('784px');
			expect(getBody().style.paddingBlockEnd).toBe('336px');

			// Reversing below the settled point restores the settled height and
			// translates only the distance travelled from that detent. The temporary
			// scroll-preservation inset leaves with the temporary expanded layout.
			fireTimedPointer(getHandle(), 'pointermove', { time: 5000, y: 340 });
			await flush();
			expect(sheet.style.transform).toBe('translateY(100px)');
			expect(sheet.style.height).toBe('448px');
			expect(getBody().style.paddingBlockEnd).toBe('');
		});

		it('reconciles the snapped height immediately when transitions are disabled', async () => {
			const observers = mockResizeObserverInstances();
			mockVisualViewport(800);
			mockWindowHeight(800);
			await render(BottomSheet, {
				props: {
					isOpen: true,
					onOpenChange: () => {},
					label: 'Release notes',
					snapPoints: SNAP_POINTS,
					height: 'tall',
					style: 'transition: none',
					children: text('Content')
				}
			});
			const sheet = getSheet();
			await measureSheet(observers, 784, 736);

			fireTimedPointer(getHandle(), 'pointerdown', { time: 0, y: 0 });
			fireTimedPointer(getHandle(), 'pointermove', { time: 1000, y: 240 });
			fireTimedPointer(getHandle(), 'pointerup', { time: 2000, y: 240 });
			await flush();

			expect(sheet.style.transform).toBe('');
			expect(sheet.style.height).toBe('448px');
		});

		it('restores the maximum height before an upward drag and reconciles at snap', async () => {
			const observers = mockResizeObserverInstances();
			mockVisualViewport(800);
			mockWindowHeight(800);
			await render(BottomSheet, {
				props: {
					isOpen: true,
					onOpenChange: () => {},
					label: 'Release notes',
					snapPoints: SNAP_POINTS,
					height: 'tall',
					children: text('Content')
				}
			});
			const sheet = getSheet();
			await measureSheet(observers, 784, 736);

			// Start at the middle 400px detent.
			fireTimedPointer(getHandle(), 'pointerdown', { time: 0, y: 0 });
			fireTimedPointer(getHandle(), 'pointermove', { time: 1000, y: 240 });
			fireTimedPointer(getHandle(), 'pointerup', { time: 2000, y: 240 });
			await endTransform();
			expect(sheet.style.height).toBe('448px');

			// The upward gesture renders the full 784px surface below the viewport
			// and translates it to preserve the visible top edge.
			fireTimedPointer(getHandle(), 'pointerdown', { time: 3000, y: 240 });
			fireTimedPointer(getHandle(), 'pointermove', { time: 4000, y: 0 });
			await flush();
			expect(sheet.style.transform).toBe('translateY(96px)');
			expect(sheet.style.height).toBe('784px');
			expect(getBody().style.paddingBlockEnd).toBe('336px');

			// Release first animates only the transform, keeping the source layout
			// and scroll range fixed for the entire snap.
			fireTimedPointer(getHandle(), 'pointerup', { time: 5000, y: 0 });
			await flush();
			expect(sheet.style.transform).toBe('');
			expect(sheet.style.height).toBe('784px');
			expect(getBody().style.paddingBlockEnd).toBe('336px');

			// At transition end, height and preservation spacing reconcile in one
			// render with the same visible geometry.
			await endTransform();
			expect(sheet.style.transform).toBe('');
			expect(sheet.style.height).toBe('');
			expect(getBody().style.paddingBlockEnd).toBe('336px');

			// Once ordinary scrolling brings the content back within its natural
			// range, the retained end padding is no longer needed and is discarded.
			const body = getBody();
			Object.defineProperties(body, {
				clientHeight: { configurable: true, value: 600 },
				scrollHeight: { configurable: true, value: 1000 },
				scrollTop: { configurable: true, value: 64, writable: true }
			});
			body.dispatchEvent(new Event('scroll'));
			await flush();
			expect(body.style.paddingBlockEnd).toBe('');
		});

		it('keeps the settled height stable while dismissing', async () => {
			const observers = mockResizeObserverInstances();
			mockVisualViewport(800);
			mockWindowHeight(800);
			await render(ExitHarness, { props: { snapPoints: SNAP_POINTS } });
			const sheet = getSheet();
			await measureSheet(observers, 784, 736);

			// First settle at the middle detent.
			fireTimedPointer(getHandle(), 'pointerdown', { time: 0, y: 0 });
			fireTimedPointer(getHandle(), 'pointermove', { time: 1000, y: 240 });
			fireTimedPointer(getHandle(), 'pointerup', { time: 2000, y: 240 });
			await endTransform();
			expect(sheet.style.height).toBe('448px');

			// A later dismiss stays transform-only and preserves that settled
			// scroll-area height throughout the exit.
			fireTimedPointer(getHandle(), 'pointerdown', { time: 3000, y: 240 });
			fireTimedPointer(getHandle(), 'pointermove', { time: 4000, y: 1000 });
			await flush();
			expect(sheet.style.transform).toBe('translateY(760px)');
			expect(sheet.style.height).toBe('448px');
			fireTimedPointer(getHandle(), 'pointerup', { time: 5000, y: 1000 });
			await flush();
			expect(sheet.style.height).toBe('448px');

			await measureSheet(observers, 200, 152);
			expect(sheet.style.height).toBe('448px');
		});

		it('re-resolves the settled detent when the window resizes', async () => {
			const observers = mockResizeObserverInstances();
			mockVisualViewport(800);
			mockWindowHeight(800);
			await render(BottomSheet, {
				props: {
					isOpen: true,
					onOpenChange: () => {},
					label: 'Release notes',
					snapPoints: SNAP_POINTS,
					height: 'tall',
					children: text('Content')
				}
			});
			const sheet = getSheet();
			await measureSheet(observers, 784, 736);

			// Settle on the half-height detent: 784 - 48 - 400 = 336px of travel.
			fireTimedPointer(getHandle(), 'pointerdown', { time: 0, y: 0 });
			fireTimedPointer(getHandle(), 'pointermove', { time: 1000, y: 336 });
			fireTimedPointer(getHandle(), 'pointerup', { time: 2000, y: 336 });
			const frames = holdAnimationFrames();
			await endTransform();
			await runHeldFrames(frames);
			// 448px of layout height shows 400px of sheet: half the 800px window.
			expect(sheet.style.height).toBe('448px');

			// Shrink the window. The sheet's budget is `92dvh`, so its border box
			// follows: 0.92 * 600 + the 48px reserve = 600px.
			vi.spyOn(sheet, 'getBoundingClientRect').mockImplementation(() =>
				rect({
					top: 0,
					bottom: sheet.style.height ? Number.parseFloat(sheet.style.height) : 600
				})
			);
			mockWindowHeight(600);
			window.dispatchEvent(new Event('resize'));
			await flush();

			// Still the half-height detent, re-resolved against the new window:
			// 348px of layout height shows 300px, half of 600. Before this, the
			// sheet kept its 448px and showed 400px — three quarters of the window.
			expect(sheet.style.height).toBe('348px');
			expect(sheet.style.transform).toBe('');
			// Re-anchoring is not a gesture, so it does not animate.
			expect(sheet.style.transition).toBe('none');
			await runHeldFrames(frames);
			expect(sheet.style.transition).toBe('');
		});

		it('keeps its detents when the keyboard shrinks the visual viewport', async () => {
			const observers = mockResizeObserverInstances();
			const viewport = mockVisualViewport(800);
			mockWindowHeight(800);
			await render(BottomSheet, {
				props: {
					isOpen: true,
					onOpenChange: () => {},
					label: 'Release notes',
					snapPoints: SNAP_POINTS,
					height: 'tall',
					children: text('Content')
				}
			});
			const sheet = getSheet();
			await measureSheet(observers, 784, 736);

			fireTimedPointer(getHandle(), 'pointerdown', { time: 0, y: 0 });
			fireTimedPointer(getHandle(), 'pointermove', { time: 1000, y: 336 });
			fireTimedPointer(getHandle(), 'pointerup', { time: 2000, y: 336 });
			await endTransform();
			expect(sheet.style.height).toBe('448px');

			// The keyboard opens: the visual viewport shrinks, the layout viewport
			// the sheet is measured in does not.
			viewport.height = 500;
			viewport.dispatchEvent(new Event('resize'));
			await flush();
			expect(sheet.style.height).toBe('448px');

			// The next drag still snaps to the window's detents, not to fractions of
			// the space the keyboard left over.
			fireTimedPointer(getHandle(), 'pointerdown', { time: 3000, y: 0 });
			fireTimedPointer(getHandle(), 'pointermove', { time: 4000, y: 288 });
			fireTimedPointer(getHandle(), 'pointerup', { time: 5000, y: 288 });
			await flush();
			// The peek of an 800px window: 736 - 112 = 624px of travel.
			expect(sheet.style.transform).toBe('translateY(624px)');
		});
	});

	describe('swipe to dismiss', () => {
		it('requests close when dragged past the dismiss threshold', async () => {
			const onOpenChange = vi.fn();
			await render(BottomSheet, {
				props: { isOpen: true, onOpenChange, label: 'Filters', children: text('Content') }
			});
			// No measured height (see `stubZeroRects`) -> any downward drag dismisses
			// via the distance branch (offset > 0.25) once released downward.
			drag(getHandle(), [{ y: 0 }, { y: 40 }, { y: 120 }]);
			expect(onOpenChange).toHaveBeenCalledWith(false);
		});

		it('restores the sheet when a context menu interrupts an active drag', async () => {
			const onOpenChange = vi.fn();
			await render(BottomSheet, {
				props: { isOpen: true, onOpenChange, label: 'Filters', children: text('Content') }
			});
			const handle = getHandle();
			const dialog = getDialog();

			handle.dispatchEvent(
				new PointerEvent('pointerdown', {
					pointerId: 1,
					clientY: 0,
					button: 0,
					isPrimary: true,
					bubbles: true,
					cancelable: true
				})
			);
			handle.dispatchEvent(
				new PointerEvent('pointermove', {
					pointerId: 1,
					clientY: 300,
					bubbles: true,
					cancelable: true
				})
			);
			await flush();
			expect(getSheet().style.transform).toBe('translateY(300px)');

			expect(
				handle.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
			).toBe(false);

			await flush();
			expect(getSheet().style.transform).toBe('');
			expect(dialog.style.getPropertyValue('--_sheet-scrim-opacity')).toBe('1');
			expect(onOpenChange).not.toHaveBeenCalled();
		});
	});
});

export { SNAP_POINTS };
