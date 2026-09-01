/** PORTS: Resizable/ResizeHandle.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ResizeHandle from '$lib/components/resizable/resize-handle.svelte';
import type { ResizableProps } from '$lib/components/resizable/use-resizable.svelte.js';
import Harness from './fixtures/resize-handle-harness.svelte';

/**
 * Ported from Astryx's `Resizable/ResizeHandle.test.tsx` — **14 of its 19 `it`
 * blocks at the 0.5.0 pin** (18 plain `it` plus one two-row `it.each` upstream;
 * 20 collected cases there against 14 here).
 *
 * The header used to claim the suite was "ported whole" and it never was — it is
 * corrected rather than trusted. The five with no counterpart, named rather than
 * silently dropped:
 *
 * - `drives the region with the raw pointer delta under LTR`
 * - `inverts the pointer delta under RTL so dragging resizes intuitively`
 * - `anchors the biased grab zone with the pill offset and a dir-flipped
 *   centering shift`
 * - `centers the grab zone on the divider when the pill is centered (no bias)`
 * - the two-row `it.each` table `offsets the %s grab zone along the pill axis
 *   only`, new at 0.5.0. Unlike the two below it, this one reads `translateX(`
 *   / `translateY(` out of the inline `style` rather than a debug class name, so
 *   it is portable as written.
 *
 * The first two hinge on a `getComputedStyle` mock that answers `direction:
 * 'rtl'` for one element — a jsdom substitution with no clean counterpart in a
 * real browser, where the property actually resolves and a `dir` attribute is
 * the honest lever. The last two assert StyleX *debug* class names, which are a
 * build-mode artifact rather than behaviour.
 *
 * What the suite guards is the WAI-ARIA window-splitter contract: the keydown
 * handler has to sit on the focusable `role="separator"` element, since keydown
 * fires on the focused node and bubbles *up* — a handler on a descendant would
 * never run. Resizing is pure state arithmetic in `useResizable` with no
 * measurement, so the observable effect is `aria-valuenow`, bound to the
 * region's `_size` — except while collapsed, where it clamps to `aria-valuemin`
 * and `aria-valuetext` carries the state (WCAG 4.1.2).
 *
 * Two translations. Upstream's `fireEvent.keyDown` becomes real keyboard input
 * through `userEvent`, which in a real browser also exercises the focus that
 * delivers it. And its `act(() => separator.focus())` needs no `act`: a `$state`
 * write flushes on its own.
 */

const KEYBOARD_STEP = 10;
const KEYBOARD_LARGE_STEP = 50;

const separatorOf = (screen: { container: HTMLElement }) =>
	screen.container.querySelector('[role="separator"]') as HTMLElement;

describe('ResizeHandle', () => {
	// --- ARIA wiring ---

	it('exposes the region size and bounds via ARIA', async () => {
		const screen = await render(Harness, { props: {} });
		const separator = separatorOf(screen);
		expect(separator).toHaveAttribute('aria-valuenow', '200');
		expect(separator).toHaveAttribute('aria-valuemin', '100');
		expect(separator).toHaveAttribute('aria-valuemax', '400');
		// Horizontal layout splits along the vertical axis.
		expect(separator).toHaveAttribute('aria-orientation', 'vertical');
		expect(separator).toHaveAttribute('aria-label', 'Resize');
	});

	it('makes the separator focusable', async () => {
		const screen = await render(Harness, { props: {} });
		const separator = separatorOf(screen);
		expect(separator).toHaveAttribute('tabindex', '0');
		separator.focus();
		expect(separator).toHaveFocus();
	});

	// --- Keyboard resizing (the handler lives on the focused separator) ---

	it('grows the panel by a step on ArrowRight', async () => {
		const screen = await render(Harness, { props: {} });
		const separator = separatorOf(screen);
		separator.focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(separator).toHaveAttribute('aria-valuenow', String(200 + KEYBOARD_STEP));
	});

	it('shrinks the panel by a step on ArrowLeft', async () => {
		const screen = await render(Harness, { props: {} });
		const separator = separatorOf(screen);
		separator.focus();
		await userEvent.keyboard('{ArrowLeft}');
		expect(separator).toHaveAttribute('aria-valuenow', String(200 - KEYBOARD_STEP));
	});

	it('uses the large step when Shift is held', async () => {
		const screen = await render(Harness, { props: {} });
		const separator = separatorOf(screen);
		separator.focus();
		await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
		expect(separator).toHaveAttribute('aria-valuenow', String(200 + KEYBOARD_LARGE_STEP));
	});

	it('jumps to the minimum on Home', async () => {
		const screen = await render(Harness, { props: {} });
		const separator = separatorOf(screen);
		separator.focus();
		await userEvent.keyboard('{Home}');
		expect(separator).toHaveAttribute('aria-valuenow', '100');
	});

	it('jumps to the maximum on End', async () => {
		const screen = await render(Harness, { props: {} });
		const separator = separatorOf(screen);
		separator.focus();
		await userEvent.keyboard('{End}');
		expect(separator).toHaveAttribute('aria-valuenow', '400');
	});

	it('resizes along the block axis for a vertical handle', async () => {
		const screen = await render(Harness, {
			props: {
				config: { defaultSize: 200, minSizePx: 100, maxSizePx: 400 },
				handleProps: { direction: 'vertical' }
			}
		});
		const separator = separatorOf(screen);
		expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
		separator.focus();
		await userEvent.keyboard('{ArrowDown}');
		expect(separator).toHaveAttribute('aria-valuenow', String(200 + KEYBOARD_STEP));
		await userEvent.keyboard('{ArrowUp}');
		expect(separator).toHaveAttribute('aria-valuenow', '200');
	});

	it('collapses on Enter when the region is collapsible', async () => {
		const screen = await render(Harness, {
			props: {
				config: { defaultSize: 200, minSizePx: 100, maxSizePx: 400, collapsible: true }
			}
		});
		const separator = separatorOf(screen);
		separator.focus();
		await userEvent.keyboard('{Enter}');
		// The panel's real size is 0, but aria-valuenow must never drop below
		// aria-valuemin (WCAG 4.1.2) — it clamps to the minimum and the state is
		// announced via aria-valuetext instead.
		expect(separator).toHaveAttribute('aria-valuenow', '100');
		expect(separator).toHaveAttribute('aria-valuetext', 'Collapsed');
	});

	it('keeps aria-valuenow >= aria-valuemin and announces "Collapsed" while collapsed', async () => {
		const screen = await render(Harness, {
			props: {
				config: { defaultSize: 200, minSizePx: 100, maxSizePx: 400, collapsible: true }
			}
		});
		const separator = separatorOf(screen);
		separator.focus();
		await userEvent.keyboard('{Enter}');

		const valueNow = Number(separator.getAttribute('aria-valuenow'));
		const valueMin = Number(separator.getAttribute('aria-valuemin'));
		expect(valueNow).toBeGreaterThanOrEqual(valueMin);
		expect(separator).toHaveAttribute('aria-valuetext', 'Collapsed');
	});

	it('removes aria-valuetext when the panel is expanded', async () => {
		const screen = await render(Harness, {
			props: {
				config: { defaultSize: 200, minSizePx: 100, maxSizePx: 400, collapsible: true }
			}
		});
		const separator = separatorOf(screen);
		expect(separator).not.toHaveAttribute('aria-valuetext');

		separator.focus();
		await userEvent.keyboard('{Enter}'); // collapse
		expect(separator).toHaveAttribute('aria-valuetext', 'Collapsed');

		await userEvent.keyboard('{Enter}'); // expand again
		expect(separator).not.toHaveAttribute('aria-valuetext');
		expect(separator).toHaveAttribute('aria-valuenow', '100');
	});

	// --- Disabled guard ---

	it('ignores keyboard input when disabled', async () => {
		const screen = await render(Harness, { props: { handleProps: { isDisabled: true } } });
		const separator = separatorOf(screen);
		expect(separator).toHaveAttribute('tabindex', '-1');
		// A disabled handle is not focusable, so the key goes to the document —
		// which is the point: nothing reaches the region either way.
		await userEvent.keyboard('{ArrowRight}');
		expect(separator).toHaveAttribute('aria-valuenow', '200');
	});

	// --- Drag listener lifecycle ---

	it('stops driving the region and releases window listeners when unmounted mid-drag', async () => {
		const resizable: ResizableProps = {
			_size: 200,
			_isCollapsed: false,
			_onResizeStart: vi.fn(),
			_onResizeMove: vi.fn(),
			_onResizeEnd: vi.fn(),
			_minSizePx: 100,
			_maxSizePx: 400,
			_snaps: [],
			_collapsedSize: 40,
			_collapsible: false,
			_isResizableProps: true
		};
		const screen = await render(ResizeHandle, { props: { resizable, label: 'Resize' } });
		const hitArea = separatorOf(screen).firstElementChild as HTMLElement;

		// Start a drag and confirm moves reach the region.
		hitArea.dispatchEvent(
			new PointerEvent('pointerdown', { clientX: 0, clientY: 0, bubbles: true, cancelable: true })
		);
		expect(resizable._onResizeStart).toHaveBeenCalledTimes(1);
		window.dispatchEvent(new PointerEvent('pointermove', { clientX: 10, clientY: 0 }));
		expect(resizable._onResizeMove).toHaveBeenCalledTimes(1);

		// Unmount mid-drag: the window listeners must be torn down, so further
		// pointer moves no longer resize the (still-live) region, and the body
		// cursor/user-select overrides are released.
		await screen.unmount();
		window.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 0 }));
		expect(resizable._onResizeMove).toHaveBeenCalledTimes(1);
		expect(document.body.style.cursor).toBe('');
		expect(document.body.style.userSelect).toBe('');
	});

	// --- Prop composition (the handler sits after the rest spread) ---

	it('runs a consumer onkeydown alongside keyboard resizing', async () => {
		const onkeydown = vi.fn();
		const screen = await render(Harness, { props: { handleProps: { onkeydown } } });
		const separator = separatorOf(screen);
		separator.focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(onkeydown).toHaveBeenCalledTimes(1);
		expect(separator).toHaveAttribute('aria-valuenow', String(200 + KEYBOARD_STEP));
	});
});
