import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { isRtlElement } from './is-rtl-element.js';

/**
 * Two-dimensional grid navigation, ported from Astryx's `hooks/useGridFocus.ts`.
 *
 * The WAI-ARIA grid pattern, as Calendar needs it: arrows move by cell and by
 * row, Home/End bound the row and Ctrl+Home/End the grid, PageUp/PageDown call
 * back (month navigation), and running off an edge calls back with the column
 * and offset so the consumer can page the data rather than the focus.
 *
 * The load-bearing detail — and the reason this is not `useListFocus` with a
 * stride — is that the cell set is *never* collapsed to only the focusable
 * cells. Row and column are computed over every cell `cellSelector` matches, so
 * a month grid with leading blanks keeps its true geometry; a move that lands on
 * a non-focusable cell continues in the same direction instead.
 *
 * The translations are the ones {@link import('./use-list-focus.svelte.js')}
 * documents: the ref becomes an attachment, the options come in as a getter read
 * at event time, and upstream's dependency-less layout effect — which repairs
 * the roving tab stop after every commit — becomes a `MutationObserver`, since
 * the cells belong to the consumer's template and nothing the hook can read
 * reports that they changed.
 *
 * One limit of that mechanism is worth naming: it observes the DOM, so a custom
 * {@link UseGridFocusOptions.isCellFocusable} that decides focusability from
 * something *other* than the cell's own markup will not trigger a repair on its
 * own. `handleFocus` still repairs on the next focus, which is the path
 * upstream's own test for this exercises.
 */

/** Configuration for grid focus behavior */
export interface UseGridFocusOptions {
	/**
	 * Number of columns in the grid.
	 * Used for up/down navigation (moves by this many cells).
	 */
	columns: number;

	/**
	 * Selector for cells within the grid. This should match ALL grid cell
	 * positions in DOM order (including disabled/empty ones) so the hook can
	 * preserve the true grid geometry when computing rows and columns.
	 *
	 * Use {@link UseGridFocusOptions.isCellFocusable} to distinguish cells that
	 * can receive focus from those that cannot (disabled or empty). Navigation
	 * moves to a target row/column and, if that cell is not focusable, continues
	 * in the same direction to the next focusable cell — the geometry is never
	 * collapsed to only-focusable cells.
	 *
	 * @default 'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
	 */
	cellSelector?: string;

	/**
	 * Predicate determining whether a cell matched by {@link cellSelector} can
	 * receive focus. When omitted, every matched cell is considered focusable.
	 *
	 * @param cell A cell element matched by `cellSelector`.
	 */
	isCellFocusable?: (cell: HTMLElement) => boolean;

	/**
	 * Resolves the element to focus for a given cell. Useful when the cell is a
	 * wrapper element (e.g. a `role="gridcell"` div) whose focusable content is a
	 * descendant (e.g. a `<button>`). When omitted, the cell itself is focused.
	 *
	 * @param cell A cell element matched by `cellSelector`.
	 */
	getFocusTarget?: (cell: HTMLElement) => HTMLElement | null;

	/**
	 * Callback when navigation would go before the first cell.
	 * Useful for navigating to previous month in calendars.
	 * @param column The column index (0-based) that was focused when navigating
	 * @param offset Number of cells to move (1 for horizontal, columns for vertical)
	 */
	onNavigateBefore?: (column: number, offset: number) => void;

	/**
	 * Callback when navigation would go after the last cell.
	 * Useful for navigating to next month in calendars.
	 * @param column The column index (0-based) that was focused when navigating
	 * @param offset Number of cells to move (1 for horizontal, columns for vertical)
	 */
	onNavigateAfter?: (column: number, offset: number) => void;

	/** Callback for Page Up key (e.g., previous month). */
	onPageUp?: () => void;

	/** Callback for Page Down key (e.g., next month). */
	onPageDown?: () => void;

	/**
	 * @deprecated Direction is auto-detected from the container's computed
	 * `direction` — omit this. The explicit override is redundant (there's no
	 * valid reason to force RTL arrows in an LTR context) and will be removed in
	 * an upcoming major.
	 *
	 * When set, forces whether the grid is right-to-left: ArrowLeft/ArrowRight
	 * are swapped so horizontal navigation follows visual direction. When
	 * omitted (preferred), the direction is auto-detected from the container's
	 * computed `direction` (read lazily on keydown, horizontal arrows only).
	 * @default undefined (auto-detect from the container)
	 */
	isRtl?: boolean;

	/**
	 * Roving-tabindex ownership. When true, the hook manages a single tab stop
	 * across the grid: exactly one focusable cell carries `tabindex="0"` and the
	 * rest `tabindex="-1"`. The tab stop is stamped on mount and repaired
	 * whenever cells mount/unmount or toggle focusable, and moves with arrow
	 * navigation. Attach the returned {@link UseGridFocusReturn.handleFocus} to
	 * the container's `onfocusin` to keep the stop in sync after clicks or
	 * programmatic focus.
	 *
	 * The tab stop is stamped on the resolved focus target (see
	 * {@link UseGridFocusOptions.getFocusTarget}), not the cell wrapper, so it
	 * works when the focusable element is a descendant of the cell. An existing
	 * `tabindex="0"` on a focus target is honored, letting the caller seed which
	 * cell is initially tabbable.
	 *
	 * When false (the default), the hook only *moves* focus (`.focus()`) and
	 * never touches `tabindex` — the caller owns tab-stop management.
	 * @default false
	 */
	hasRovingTabIndex?: boolean;
}

/** Return type for useGridFocus hook */
export interface UseGridFocusReturn {
	/**
	 * Attach to the grid container element with `{@attach grid.attachGrid}`.
	 * Upstream's `gridRef`.
	 */
	readonly attachGrid: Attachment<HTMLElement>;

	/** Key down handler to attach to the grid container. */
	handleKeyDown: (event: KeyboardEvent) => void;

	/**
	 * Focus handler to attach to the container's `onfocusin`. Keeps the roving tab
	 * stop in sync when `hasRovingTabIndex` is enabled; a no-op otherwise, so it
	 * is always safe to attach.
	 */
	handleFocus: (event: FocusEvent) => void;

	/** Focus a specific cell by index. */
	focusCell: (index: number) => void;

	/** Focus the first focusable cell. */
	focusFirst: () => void;

	/** Focus the last focusable cell. */
	focusLast: () => void;
}

const DEFAULT_CELL_SELECTOR = 'button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Set `tabindex` on an element, but only when it differs (avoids redundant DOM
 * writes, and is what keeps the repair MutationObserver from cascading). Uses
 * setAttribute so the value reflects even for elements (like `<button>`) whose
 * default tabIndex is already 0.
 */
function setTabIndex(el: HTMLElement, value: 0 | -1): void {
	if (el.getAttribute('tabindex') !== String(value)) {
		el.setAttribute('tabindex', String(value));
	}
}

/**
 * Hook for managing keyboard navigation within a grid.
 *
 * Implements WAI-ARIA grid pattern:
 * - Arrow keys: Navigate between cells
 * - Home: Move to first cell in row
 * - End: Move to last cell in row
 * - Ctrl+Home: Move to first cell in grid
 * - Ctrl+End: Move to last cell in grid
 * - Page Up/Down: Custom callbacks (e.g., month navigation)
 *
 * The hook enumerates ALL cells matched by `cellSelector` in DOM order and
 * computes row/column over that full set, preserving the true grid geometry
 * even when some cells are disabled or empty. When a move lands on a
 * non-focusable cell (per `isCellFocusable`), it continues in the same
 * direction to the next focusable cell.
 *
 * By default the hook only *moves* focus and leaves `tabindex` management to
 * the caller. Opt into {@link UseGridFocusOptions.hasRovingTabIndex} for a hook
 * that owns a single tab stop (roving tabindex) across the grid.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const grid = useGridFocus(() => ({
 *     columns: 7,
 *     onPageUp: () => navigateMonth(-1),
 *     onPageDown: () => navigateMonth(1)
 *   }));
 * </script>
 *
 * <div {@attach grid.attachGrid} role="grid" onkeydown={grid.handleKeyDown}>
 *   {#each cells as cell}<button role="gridcell">{cell}</button>{/each}
 * </div>
 * ```
 *
 * Roving-tabindex grid (e.g. a date picker where the cell is a wrapper around
 * a focusable button):
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const grid = useGridFocus(() => ({
 *     columns: 7,
 *     cellSelector: '[role="gridcell"]',
 *     isCellFocusable: (cell) => cell.querySelector('button:not([disabled])') != null,
 *     getFocusTarget: (cell) => cell.querySelector('button'),
 *     hasRovingTabIndex: true
 *   }));
 * </script>
 *
 * <div
 *   {@attach grid.attachGrid}
 *   role="grid"
 *   onkeydown={grid.handleKeyDown}
 *   onfocusin={grid.handleFocus}
 * >
 *   {@render children()}
 * </div>
 * ```
 */
export function useGridFocus(options: () => UseGridFocusOptions): UseGridFocusReturn {
	// The one option read reactively: it decides whether the attachment installs
	// the tab-stop repair at all.
	const hasRovingTabIndex = $derived(options().hasRovingTabIndex ?? false);

	let container: HTMLElement | null = null;

	/**
	 * Get all cells in the grid, in DOM order. This includes disabled and empty
	 * cells so the true grid geometry is preserved.
	 */
	function getCells(): HTMLElement[] {
		if (!container) {
			return [];
		}
		const { cellSelector = DEFAULT_CELL_SELECTOR } = options();
		return Array.from(container.querySelectorAll<HTMLElement>(cellSelector));
	}

	/** Whether a cell can receive focus. */
	function cellFocusable(cell: HTMLElement | undefined): boolean {
		if (!cell) {
			return false;
		}
		const { isCellFocusable } = options();
		return isCellFocusable ? isCellFocusable(cell) : true;
	}

	/** Resolve the element that should actually receive focus for a cell. */
	function resolveFocusTarget(cell: HTMLElement | undefined): HTMLElement | null {
		if (!cell) {
			return null;
		}
		const { getFocusTarget } = options();
		return getFocusTarget ? getFocusTarget(cell) : cell;
	}

	// --- Roving tabindex ownership (opt-in via `hasRovingTabIndex`) -------------

	/**
	 * The resolved focus targets of all focusable cells, in DOM order. These are
	 * the elements that carry the roving tab stop (a descendant of each cell when
	 * `getFocusTarget` is provided, otherwise the cell itself).
	 */
	function getFocusTargets(): HTMLElement[] {
		return getCells()
			.filter((cell) => cellFocusable(cell))
			.map((cell) => resolveFocusTarget(cell))
			.filter((el): el is HTMLElement => el !== null);
	}

	/**
	 * Stamp the roving tab stop: exactly one focus target is tabbable (0), the
	 * rest are -1. Prefer keeping the currently-tabbable target if it is still
	 * focusable; otherwise promote the first focusable one (tab-stop repair).
	 */
	function syncTabStops(): void {
		const targets = getFocusTargets();
		if (targets.length === 0) {
			return;
		}
		const current = targets.find((el) => el.getAttribute('tabindex') === '0');
		const tabbable = current ?? targets[0];
		for (const el of targets) {
			setTabIndex(el, el === tabbable ? 0 : -1);
		}
	}

	/**
	 * Upstream's `gridRef`, plus the repair that upstream gets from a
	 * dependency-less layout effect.
	 */
	const attachGrid: Attachment<HTMLElement> = (element) => {
		container = element;

		if (!hasRovingTabIndex) {
			return () => {
				container = null;
			};
		}

		untrack(syncTabStops);

		const observer = new MutationObserver(() => untrack(syncTabStops));
		observer.observe(element, { childList: true, subtree: true, attributes: true });

		return () => {
			observer.disconnect();
			container = null;
		};
	};

	/**
	 * Move the roving tab stop so `target` becomes the sole tabbable focus
	 * target, then focus it. No-op on tab stops unless roving tabindex is on.
	 */
	function focusTarget(target: HTMLElement | null): void {
		if (!target) {
			return;
		}
		if (hasRovingTabIndex) {
			for (const el of getFocusTargets()) {
				setTabIndex(el, el === target ? 0 : -1);
			}
		}
		target.focus();
	}

	/**
	 * Focus a cell by resolving and focusing its target, moving the roving tab
	 * stop when enabled.
	 */
	function focusCellWithStop(cell: HTMLElement | undefined): boolean {
		const target = resolveFocusTarget(cell);
		if (!target) {
			return false;
		}
		focusTarget(target);
		return true;
	}

	/**
	 * Keep the roving stop pointing at whatever ended up focused (e.g. a click
	 * or programmatic focus) so the next Tab behaves correctly. No-op unless
	 * roving tabindex is enabled.
	 */
	function handleFocus(): void {
		if (hasRovingTabIndex) {
			syncTabStops();
		}
	}

	/** Get the currently focused cell index within the full cell set. */
	function getCurrentIndex(): number {
		const cells = getCells();
		const active = document.activeElement;
		return cells.findIndex((cell) => cell === active || cell.contains(active));
	}

	/**
	 * Find the next focusable cell starting at `startIndex`, moving by `step`.
	 * Returns the index of the focusable cell, or -1 if none exists in range
	 * (i.e. we ran off the start/end of the grid).
	 */
	function findFocusableInDirection(
		cells: HTMLElement[],
		startIndex: number,
		step: number
	): number {
		let index = startIndex;
		while (index >= 0 && index < cells.length) {
			if (cellFocusable(cells[index])) {
				return index;
			}
			index += step;
		}
		return -1;
	}

	/**
	 * Focus a cell by index, clamping to valid range. Skips non-focusable cells
	 * toward the nearest edge. Used by public focus helpers (no navigation
	 * callbacks).
	 */
	function focusCell(index: number): void {
		const cells = getCells();
		if (cells.length === 0) {
			return;
		}
		const clampedIndex = Math.max(0, Math.min(index, cells.length - 1));
		// Prefer the requested cell; otherwise search forward, then backward.
		let target = findFocusableInDirection(cells, clampedIndex, 1);
		if (target === -1) {
			target = findFocusableInDirection(cells, clampedIndex, -1);
		}
		if (target !== -1) {
			focusCellWithStop(cells[target]);
		}
	}

	/** Focus the first focusable cell. */
	function focusFirst(): void {
		const cells = getCells();
		const index = findFocusableInDirection(cells, 0, 1);
		if (index !== -1) {
			focusCellWithStop(cells[index]);
		}
	}

	/** Focus the last focusable cell. */
	function focusLast(): void {
		const cells = getCells();
		const index = findFocusableInDirection(cells, cells.length - 1, -1);
		if (index !== -1) {
			focusCellWithStop(cells[index]);
		}
	}

	/** Handle keyboard navigation. */
	function handleKeyDown(e: KeyboardEvent): void {
		const { columns, onNavigateBefore, onNavigateAfter, onPageUp, onPageDown, isRtl } = options();

		const cells = getCells();
		if (cells.length === 0) {
			return;
		}

		const currentIndex = getCurrentIndex();
		if (currentIndex === -1) {
			return;
		}

		const currentRow = Math.floor(currentIndex / columns);
		const currentCol = currentIndex % columns;
		const totalRows = Math.ceil(cells.length / columns);

		let handled = true;

		// In RTL, ArrowLeft/ArrowRight are swapped so horizontal navigation
		// follows visual direction. Vertical keys (Up/Down) are unaffected.
		// Direction is resolved lazily — `getComputedStyle` runs only when a
		// horizontal arrow key is actually pressed — and an explicit `isRtl` wins.
		let key = e.key;
		if ((key === 'ArrowLeft' || key === 'ArrowRight') && (isRtl ?? isRtlElement(container))) {
			if (key === 'ArrowLeft') {
				key = 'ArrowRight';
			} else if (key === 'ArrowRight') {
				key = 'ArrowLeft';
			}
		}

		switch (key) {
			case 'ArrowRight': {
				// Move right, skipping non-focusable cells in the same direction.
				const target = findFocusableInDirection(cells, currentIndex + 1, 1);
				if (target !== -1) {
					focusCellWithStop(cells[target]);
				} else {
					onNavigateAfter?.((currentCol + 1) % columns, 1);
				}
				break;
			}

			case 'ArrowLeft': {
				const target = findFocusableInDirection(cells, currentIndex - 1, -1);
				if (target !== -1) {
					focusCellWithStop(cells[target]);
				} else {
					onNavigateBefore?.(currentCol === 0 ? columns - 1 : currentCol - 1, 1);
				}
				break;
			}

			case 'ArrowDown': {
				if (currentRow < totalRows - 1) {
					// Move to the same column one row down, then continue downward
					// (by whole rows) to the next focusable cell in that column.
					const target = findFocusableInDirection(cells, currentIndex + columns, columns);
					if (target !== -1) {
						focusCellWithStop(cells[target]);
					} else {
						onNavigateAfter?.(currentCol, columns);
					}
				} else {
					onNavigateAfter?.(currentCol, columns);
				}
				break;
			}

			case 'ArrowUp': {
				if (currentRow > 0) {
					const target = findFocusableInDirection(cells, currentIndex - columns, -columns);
					if (target !== -1) {
						focusCellWithStop(cells[target]);
					} else {
						onNavigateBefore?.(currentCol, columns);
					}
				} else {
					onNavigateBefore?.(currentCol, columns);
				}
				break;
			}

			case 'Home':
				if (e.ctrlKey || e.metaKey) {
					// Ctrl+Home: first focusable cell in grid
					focusFirst();
				} else {
					// Home: first focusable cell in current row (searching rightward)
					const rowStart = currentRow * columns;
					const rowEnd = Math.min(rowStart + columns - 1, cells.length - 1);
					const target = findFocusableInDirection(cells, rowStart, 1);
					if (target !== -1 && target <= rowEnd) {
						focusCellWithStop(cells[target]);
					}
				}
				break;

			case 'End':
				if (e.ctrlKey || e.metaKey) {
					// Ctrl+End: last focusable cell in grid
					focusLast();
				} else {
					// End: last focusable cell in current row (searching leftward)
					const rowStart = currentRow * columns;
					const rowEnd = Math.min(rowStart + columns - 1, cells.length - 1);
					const target = findFocusableInDirection(cells, rowEnd, -1);
					if (target !== -1 && target >= rowStart) {
						focusCellWithStop(cells[target]);
					}
				}
				break;

			case 'PageUp':
				onPageUp?.();
				break;

			case 'PageDown':
				onPageDown?.();
				break;

			default:
				handled = false;
		}

		if (handled) {
			e.preventDefault();
			e.stopPropagation();
		}
	}

	return {
		attachGrid,
		handleKeyDown,
		handleFocus,
		focusCell,
		focusFirst,
		focusLast
	};
}
