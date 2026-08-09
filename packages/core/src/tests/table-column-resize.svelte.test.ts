import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { pixel, proportional } from '$lib/components/table/column-utils.js';
import type { TableColumn } from '$lib/components/table/table-types.js';
import ResizeTable, {
	pixelColumns,
	testColumns,
	type ResizeRow
} from './fixtures/table-column-resize-fixture.svelte';
import ControlledResizeTable from './fixtures/table-column-resize-controlled-fixture.svelte';
import LegacyResizeTable from './fixtures/table-column-resize-legacy-fixture.svelte';
import ComposedTable from './fixtures/table-column-resize-composed-fixture.svelte';
import ReorderTable from './fixtures/table-column-resize-reorder-fixture.svelte';

/**
 * Ported from Astryx's
 * `Table/plugins/columnResize/useTableColumnResize.test.tsx` — all **37** of its
 * `it` cases, in upstream's order and under upstream's names. Nothing dropped.
 *
 * ## Standing translations
 *
 * - **Upstream's `beforeAll` pointer-capture stub is gone.** It exists because
 *   jsdom does not implement `setPointerCapture` / `releasePointerCapture`; this
 *   suite runs in real Chromium, which does — and the ported handle never calls
 *   either, since the drag listens on `window`.
 * - **`render(<ResizeTable …/>)` becomes a probe fixture** (`ResizeTable`,
 *   `ControlledResizeTable`, `LegacyResizeTable`, `ComposedTable`,
 *   `ReorderTable` in `fixtures/`), one per upstream harness component, because
 *   a hook has to run inside a component's init.
 * - **`fireEvent.pointerDown` / `fireEvent.keyDown` become dispatched native
 *   events**, and the drag's `pointermove` / `pointerup` / `pointercancel` go on
 *   `window` — where the ported handle registers them, exactly as upstream's
 *   own test dispatches them.
 * - **`within(row).getAllByRole('columnheader')` becomes a `<thead> th`
 *   container query.** The assertions are on inline `style`, so the node is what
 *   matters, not the role lookup; `getAllByRole('separator')` is kept as a role
 *   query (`.elements()`) since two of the cases assert on the role itself.
 * - **`rerender(<X …/>)` is `screen.rerender({ … })`**, which is the same
 *   prop-update-without-remount.
 *
 * ## Restated cases (assertion changed; each says so at its site)
 *
 * - "no columns → no crash" — upstream's `expect(() => render(…)).not.toThrow()`
 *   is vacuous here, because `render` is async and returns a promise the
 *   assertion never awaits. Restated as: the table mounts and renders no handle.
 */

// =============================================================================
// Helpers
// =============================================================================

interface Screen {
	container: HTMLElement;
	getByRole: (role: string) => { elements: () => Element[] };
}

/** Upstream's `getResizeHandles()`. */
function getResizeHandles(screen: Screen): HTMLElement[] {
	return screen.getByRole('separator').elements() as HTMLElement[];
}

/** Upstream's `within(headerRow).getAllByRole('columnheader')`. */
function getHeaders(screen: Screen): HTMLElement[] {
	return Array.from(screen.container.querySelectorAll<HTMLElement>('thead tr th'));
}

function pointerDown(el: Element, clientX: number): void {
	el.dispatchEvent(
		new PointerEvent('pointerdown', { clientX, pointerId: 1, bubbles: true, cancelable: true })
	);
}

function windowPointer(type: 'pointermove' | 'pointerup' | 'pointercancel', clientX = 0): void {
	window.dispatchEvent(
		new PointerEvent(type, { clientX, pointerId: 1, bubbles: true, cancelable: true })
	);
}

function keyDown(el: Element, key: string, shiftKey = false): void {
	el.dispatchEvent(
		new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true })
	);
}

// =============================================================================
// 6.1 Unit Tests — Hook Behavior
// =============================================================================

describe('useTableColumnResize', () => {
	describe('hook behavior', () => {
		it('renders resize handles in each header cell (pixel columns)', async () => {
			const screen = await render(ResizeTable, { props: { columns: pixelColumns } });
			const handles = getResizeHandles(screen);
			expect(handles).toHaveLength(2);
		});

		it('applies width override when columnWidths has entry', async () => {
			const screen = await render(ResizeTable, { props: { columnWidths: { name: 200 } } });
			const headers = getHeaders(screen);
			// The first header (Name) should have width and maxWidth override
			// Note: minWidth may be overridden by BaseTable's column min-width logic
			expect(headers[0].style.width).toBe('200px');
			expect(headers[0].style.maxWidth).toBe('200px');
		});

		it('does not override width when columnWidths is empty', async () => {
			const screen = await render(ResizeTable, { props: {} });
			const headers = getHeaders(screen);
			// No pixel override from the plugin — BaseTable sets a percentage width
			// for table-layout:fixed distribution, so width is not empty
			expect(headers[0].style.width).not.toBe('');
			expect(headers[0].style.width).not.toContain('px');
		});

		it('does not add user-select: none when not dragging', async () => {
			const screen = await render(ResizeTable, { props: {} });
			const table = screen.container.querySelector('table') as HTMLTableElement;
			expect(table.style.userSelect).not.toBe('none');
		});
	});

	// =========================================================================
	// 6.2 Integration Tests — Resize Interaction
	// =========================================================================

	describe('resize interaction', () => {
		it('calls onColumnResizeEnd after pointer drag', async () => {
			const onResize = vi.fn();
			const screen = await render(ResizeTable, {
				props: {
					columns: pixelColumns,
					columnWidths: { name: 200 },
					onColumnResizeEnd: onResize
				}
			});
			const handle = getResizeHandles(screen)[0];

			pointerDown(handle, 200);
			windowPointer('pointermove', 300);
			windowPointer('pointerup', 300);

			expect(onResize).toHaveBeenCalledWith({ columnKey: 'name', newWidth: 300 });
		});

		it('respects minWidth during drag', async () => {
			const onResize = vi.fn();
			const screen = await render(ResizeTable, {
				props: {
					columns: pixelColumns,
					columnWidths: { name: 100 },
					onColumnResizeEnd: onResize,
					minWidth: 80
				}
			});
			const handle = getResizeHandles(screen)[0];

			// Drag left past minWidth
			pointerDown(handle, 200);
			windowPointer('pointermove', 50);
			windowPointer('pointerup', 50);

			expect(onResize).toHaveBeenCalledWith({ columnKey: 'name', newWidth: 80 });
		});

		it('respects maxWidth during drag', async () => {
			const onResize = vi.fn();
			const screen = await render(ResizeTable, {
				props: {
					columns: pixelColumns,
					columnWidths: { name: 200 },
					onColumnResizeEnd: onResize,
					maxWidth: 300
				}
			});
			const handle = getResizeHandles(screen)[0];

			pointerDown(handle, 200);
			windowPointer('pointermove', 600);
			windowPointer('pointerup', 600);

			expect(onResize).toHaveBeenCalledWith({ columnKey: 'name', newWidth: 300 });
		});

		it('does not call onColumnResizeEnd on Escape during drag', async () => {
			const onResize = vi.fn();
			const screen = await render(ResizeTable, {
				props: { columnWidths: { name: 200 }, onColumnResizeEnd: onResize }
			});
			const handle = getResizeHandles(screen)[0];

			pointerDown(handle, 200);
			windowPointer('pointermove', 300);
			// Cancel via pointerCancel
			windowPointer('pointercancel');

			expect(onResize).not.toHaveBeenCalled();
		});
	});

	// =========================================================================
	// 6.3 Integration Tests — Table Rendering
	// =========================================================================

	describe('table rendering', () => {
		it('composes with selection plugin', async () => {
			const screen = await render(ComposedTable, { props: {} });

			// Both selection checkboxes and resize handles should be present
			const checkboxes = screen.getByRole('checkbox').elements();
			expect(checkboxes.length).toBeGreaterThan(0);

			const handles = getResizeHandles(screen);
			expect(handles).toHaveLength(2);
		});

		it('resized column persists across re-renders', async () => {
			const screen = await render(ResizeTable, { props: { columnWidths: { name: 250 } } });
			expect(getHeaders(screen)[0].style.width).toBe('250px');

			// Trigger re-render
			await screen.rerender({ columnWidths: { name: 250 } });
			expect(getHeaders(screen)[0].style.width).toBe('250px');
		});

		it('resets column width when key removed from columnWidths', async () => {
			const screen = await render(ControlledResizeTable, {
				props: { columnWidths: { name: 250 } }
			});
			expect(getHeaders(screen)[0].style.width).toBe('250px');

			await screen.rerender({ columnWidths: {} });
			// Plugin override removed — falls back to BaseTable's percentage width
			expect(getHeaders(screen)[0].style.width).not.toContain('px');
		});
	});

	// =========================================================================
	// 6.4 Keyboard Accessibility Tests
	// =========================================================================

	describe('keyboard accessibility', () => {
		it('handle is focusable via Tab', async () => {
			const screen = await render(ResizeTable, { props: {} });
			const handle = getResizeHandles(screen)[0];

			await userEvent.tab();
			// Explicitly focus the handle
			handle.focus();
			expect(document.activeElement).toBe(handle);
		});

		it('ArrowRight resizes immediately on focus (no activation step)', async () => {
			const onResize = vi.fn();
			const screen = await render(ResizeTable, {
				props: {
					columns: pixelColumns,
					columnWidths: { name: 200 },
					onColumnResizeEnd: onResize
				}
			});
			const handle = getResizeHandles(screen)[0];
			handle.focus();

			// Arrow right commits immediately — no Enter activation needed
			keyDown(handle, 'ArrowRight');

			expect(onResize).toHaveBeenCalledWith({ columnKey: 'name', newWidth: 210 });
		});

		it('ArrowLeft decreases width by 10px immediately', async () => {
			const smallPixelColumns: TableColumn<ResizeRow>[] = [
				{ key: 'name', header: 'Name', width: pixel(100) },
				{ key: 'role', header: 'Role', width: pixel(100) }
			];
			const onResize = vi.fn();
			const screen = await render(ResizeTable, {
				props: {
					columns: smallPixelColumns,
					columnWidths: { name: 200 },
					onColumnResizeEnd: onResize
				}
			});
			const handle = getResizeHandles(screen)[0];
			handle.focus();

			keyDown(handle, 'ArrowLeft');

			expect(onResize).toHaveBeenCalledWith({ columnKey: 'name', newWidth: 190 });
		});

		it('Shift+ArrowRight increases by 50px', async () => {
			const onResize = vi.fn();
			const screen = await render(ResizeTable, {
				props: {
					columns: pixelColumns,
					columnWidths: { name: 200 },
					onColumnResizeEnd: onResize
				}
			});
			const handle = getResizeHandles(screen)[0];
			handle.focus();

			keyDown(handle, 'ArrowRight', true);

			expect(onResize).toHaveBeenCalledWith({ columnKey: 'name', newWidth: 250 });
		});

		/**
		 * The case batch 13's `createSlotBinder` exists for: `{@render}` branches on
		 * a bound snippet's function identity, so an unkeyed binding replaces the
		 * focused `role="separator"` on the first commit and the second press lands
		 * on a detached node. Upstream never meets it (React reconciles by key).
		 */
		it('multiple arrow presses accumulate', async () => {
			const onResize = vi.fn();
			const screen = await render(ResizeTable, {
				props: {
					columns: pixelColumns,
					columnWidths: { name: 200 },
					onColumnResizeEnd: onResize
				}
			});
			const handle = getResizeHandles(screen)[0];
			handle.focus();

			keyDown(handle, 'ArrowRight');
			keyDown(handle, 'ArrowRight');
			keyDown(handle, 'ArrowRight');

			// Each press commits independently, building on the previous
			expect(onResize).toHaveBeenCalledTimes(3);
			expect(onResize).toHaveBeenLastCalledWith({
				columnKey: 'name',
				newWidth: 230 // 200 + 10 + 10 + 10
			});
		});

		it('Home key jumps to minimum width', async () => {
			const onResize = vi.fn();
			const screen = await render(ResizeTable, {
				props: {
					columns: pixelColumns,
					columnWidths: { name: 300 },
					onColumnResizeEnd: onResize
				}
			});
			const handle = getResizeHandles(screen)[0];
			handle.focus();

			keyDown(handle, 'Home');

			expect(onResize).toHaveBeenCalledWith({
				columnKey: 'name',
				newWidth: 200 // pixel(200) column min
			});
		});

		it('End key jumps to maximum width when finite', async () => {
			const onResize = vi.fn();
			const screen = await render(ResizeTable, {
				props: {
					columns: pixelColumns,
					columnWidths: { name: 200 },
					onColumnResizeEnd: onResize,
					maxWidth: 500
				}
			});
			const handle = getResizeHandles(screen)[0];
			handle.focus();

			keyDown(handle, 'End');

			expect(onResize).toHaveBeenCalledWith({ columnKey: 'name', newWidth: 500 });
		});

		it('End key does nothing when maxWidth is Infinity', async () => {
			const onResize = vi.fn();
			const screen = await render(ResizeTable, {
				props: {
					columns: pixelColumns,
					columnWidths: { name: 200 },
					onColumnResizeEnd: onResize
				}
			});
			const handle = getResizeHandles(screen)[0];
			handle.focus();

			keyDown(handle, 'End');

			expect(onResize).not.toHaveBeenCalled();
		});
	});

	// =========================================================================
	// 6.5 ARIA Tests
	// =========================================================================

	describe('ARIA attributes', () => {
		it('handle has role="separator"', async () => {
			const screen = await render(ResizeTable, { props: {} });
			const handles = getResizeHandles(screen);
			expect(handles[0]).toHaveAttribute('role', 'separator');
		});

		it('handle has aria-orientation="vertical"', async () => {
			const screen = await render(ResizeTable, { props: {} });
			const handle = getResizeHandles(screen)[0];
			expect(handle).toHaveAttribute('aria-orientation', 'vertical');
		});

		it('handle has aria-valuenow matching column width', async () => {
			const screen = await render(ResizeTable, { props: { columnWidths: { name: 200 } } });
			const handle = getResizeHandles(screen)[0];
			expect(handle).toHaveAttribute('aria-valuenow', '200');
		});

		it('handle has a numeric aria-valuenow on initial render (before any width is measured)', async () => {
			// A focusable role="separator" requires aria-valuenow per the ARIA spec.
			// Before the column width has been measured there is no override width, so
			// the handle must fall back to a defined numeric value (the column
			// minWidth) rather than omitting the attribute.
			const screen = await render(ResizeTable, { props: { minWidth: 80 } });
			const handle = getResizeHandles(screen)[0];
			const valueNow = handle.getAttribute('aria-valuenow');
			expect(valueNow).not.toBeNull();
			expect(Number.isNaN(Number(valueNow))).toBe(false);
			expect(valueNow).toBe('80');
		});

		it('handle has aria-label with column header text', async () => {
			const screen = await render(ResizeTable, { props: {} });
			const handle = getResizeHandles(screen)[0];
			expect(handle).toHaveAttribute('aria-label', 'Resize column Name');
		});

		it('handle has aria-valuemin', async () => {
			const screen = await render(ResizeTable, { props: { minWidth: 80 } });
			const handle = getResizeHandles(screen)[0];
			expect(handle).toHaveAttribute('aria-valuemin', '80');
		});

		it('handle has aria-valuemax when finite', async () => {
			const screen = await render(ResizeTable, { props: { maxWidth: 500 } });
			const handle = getResizeHandles(screen)[0];
			expect(handle).toHaveAttribute('aria-valuemax', '500');
		});
	});

	// =========================================================================
	// 6.6 Edge Cases
	// =========================================================================

	describe('edge cases', () => {
		/**
		 * **Restated.** Upstream writes `expect(() => render(<EmptyTable/>)).not.toThrow()`;
		 * `render` is async here, so that assertion would pass without the component
		 * ever mounting. Asserting the mounted result is what the title claims.
		 */
		it('no columns → no crash', async () => {
			const screen = await render(LegacyResizeTable, { props: { data: [], columns: [] } });
			expect(screen.container.querySelector('table')).not.toBeNull();
			expect(screen.container.querySelectorAll('[role="separator"]')).toHaveLength(0);
		});

		it('single column resize works', async () => {
			const singleColumn: TableColumn<ResizeRow>[] = [{ key: 'name', header: 'Name' }];

			const screen = await render(LegacyResizeTable, {
				props: { columns: singleColumn, columnWidths: { name: 300 } }
			});
			const handles = getResizeHandles(screen);
			expect(handles).toHaveLength(1);
		});

		it('column reorder after resize — widths map correctly', async () => {
			const screen = await render(ReorderTable, { props: {} });
			let headers = getHeaders(screen);
			expect(headers[0].style.width).toBe('200px');
			expect(headers[1].style.width).toBe('150px');

			// Reorder columns
			(screen.getByText('Reorder').element() as HTMLElement).click();

			await expect
				.poll(() => getHeaders(screen)[0].style.width)
				// After reorder, Role is first, Name is second
				.toBe('150px');
			headers = getHeaders(screen);
			expect(headers[1].style.width).toBe('200px');
		});
	});

	// =========================================================================
	// 6.7 Per-Column Min Width
	// =========================================================================

	describe('per-column min width', () => {
		it('uses proportional column minWidth as resize minimum', async () => {
			const columnsWithMinWidth: TableColumn<ResizeRow>[] = [
				{ key: 'name', header: 'Name', width: proportional(1, { minWidth: 150 }) },
				{ key: 'role', header: 'Role', width: pixel(200) }
			];

			const screen = await render(ResizeTable, { props: { columns: columnsWithMinWidth } });
			const handle = getResizeHandles(screen)[0];
			// The handle's aria-valuemin should reflect the column's minWidth
			expect(handle).toHaveAttribute('aria-valuemin', '150');
		});

		it('uses pixel column value as resize minimum', async () => {
			const columnsWithPixel: TableColumn<ResizeRow>[] = [
				{ key: 'name', header: 'Name', width: pixel(180) },
				{ key: 'role', header: 'Role', width: pixel(200) }
			];

			const screen = await render(ResizeTable, { props: { columns: columnsWithPixel } });
			const handle = getResizeHandles(screen)[0];
			expect(handle).toHaveAttribute('aria-valuemin', '180');
		});

		it('global minWidth overrides per-column minimum', async () => {
			const columnsWithMinWidth: TableColumn<ResizeRow>[] = [
				{ key: 'name', header: 'Name', width: proportional(1, { minWidth: 150 }) },
				{ key: 'role', header: 'Role' }
			];

			const screen = await render(ResizeTable, {
				props: { columns: columnsWithMinWidth, minWidth: 60 }
			});
			const handle = getResizeHandles(screen)[0];
			// Global override wins
			expect(handle).toHaveAttribute('aria-valuemin', '60');
		});

		it('defaults to DEFAULT_MIN_COLUMN_WIDTH (120) for proportional without explicit minWidth', async () => {
			const defaultColumns: TableColumn<ResizeRow>[] = [
				{ key: 'name', header: 'Name', width: proportional(1) },
				{ key: 'role', header: 'Role', width: pixel(200) }
			];

			const screen = await render(ResizeTable, { props: { columns: defaultColumns } });
			const handle = getResizeHandles(screen)[0];
			// proportional() helper defaults minWidth to 120
			expect(handle).toHaveAttribute('aria-valuemin', '120');
		});
	});

	// =========================================================================
	// 6.8 Proportional-Preserving Resize
	// =========================================================================

	describe('proportional-preserving resize', () => {
		it('does not render resize handle on last proportional column', async () => {
			// Default columns have no explicit width → proportional
			// The last column (role) should have no handle
			const screen = await render(ResizeTable, { props: {} });
			const handles = getResizeHandles(screen);
			// Only the first column should get a handle (proportional with a neighbor)
			// The last proportional column has no handle
			expect(handles).toHaveLength(1);
		});

		it('renders resize handle on last column if it is pixel', async () => {
			const columnsWithPixelLast: TableColumn<ResizeRow>[] = [
				{ key: 'name', header: 'Name' },
				{ key: 'role', header: 'Role', width: pixel(200) }
			];

			const screen = await render(ResizeTable, { props: { columns: columnsWithPixelLast } });
			const handles = getResizeHandles(screen);
			// Both columns get handles — last is pixel, not proportional
			expect(handles).toHaveLength(2);
		});

		it('all pixel columns get handles including last', async () => {
			const allPixel: TableColumn<ResizeRow>[] = [
				{ key: 'name', header: 'Name', width: pixel(200) },
				{ key: 'role', header: 'Role', width: pixel(200) }
			];

			const screen = await render(ResizeTable, { props: { columns: allPixel } });
			const handles = getResizeHandles(screen);
			expect(handles).toHaveLength(2);
		});

		it('without columns config, all columns get handles (backward compat)', async () => {
			// Don't pass columns to the plugin — falls back to old behavior
			const screen = await render(LegacyResizeTable, { props: { columns: testColumns } });
			const handles = getResizeHandles(screen);
			expect(handles).toHaveLength(2);
		});
	});
});
