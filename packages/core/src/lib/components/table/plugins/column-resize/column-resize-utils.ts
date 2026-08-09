import { DEFAULT_MIN_COLUMN_WIDTH } from '../../column-utils.js';
import type { ColumnWidth } from '../../table-types.js';

/**
 * The module-scope helpers, constants and drag types of Astryx's
 * `Table/plugins/columnResize/useTableColumnResize.tsx`, split out so the hook
 * (`.ts`) and the handle component (`.svelte`) can share them — the same split
 * `plugins/sortable/sort-utils.ts` makes, and for the same reason.
 *
 * Everything upstream declares at module scope transcribes verbatim:
 * `FALLBACK_MIN_WIDTH` / `KEYBOARD_STEP` / `KEYBOARD_LARGE_STEP`,
 * `resolveColumnMinWidth`, `isProportionalColumn`, `computeColumnWidths`, and
 * the `ColumnSnapshot` / `DragState` shapes.
 *
 * Two additions are **not** new behaviour. `applyColumnWidths` and
 * `buildWidthUpdates` are the two `snapshots.forEach(…)` loops upstream repeats
 * inline — the first at three call sites (pointer-down, pointer-move,
 * keyboard), the second at two (pointer-up, keyboard) — lifted so the drag and
 * keyboard paths provably run the same code, which is the property upstream's
 * own comment on `buildSnapshotAndResize` claims for `computeColumnWidths`.
 *
 * `ResizeSession` is likewise not new: it is upstream's `dragStateRef` /
 * `isDraggingRef` / `tableRef` in one bag. Those three are genuine mutable
 * drag + DOM state (deliberately *outside* React state so a drag never
 * re-renders), so they carry over as plain mutable fields — not `$state` — and
 * are created once per hook call so every handle in one table shares them, as
 * upstream's refs do.
 */

// =============================================================================
// Constants
// =============================================================================

export const FALLBACK_MIN_WIDTH = 50;
export const KEYBOARD_STEP = 10;
export const KEYBOARD_LARGE_STEP = 50;

// =============================================================================
// Width Helpers
// =============================================================================

/**
 * Derive the effective minimum width for a column based on its width config.
 * - Proportional columns: use their declared minWidth (default 120px)
 * - Pixel columns: use their declared value (you set 200px, min is 200px)
 * - No width / unknown: use DEFAULT_MIN_COLUMN_WIDTH
 *
 * A global override (from config.minWidth) takes precedence when set.
 */
export function resolveColumnMinWidth(
	colWidth: ColumnWidth | undefined,
	globalOverride: number | undefined
): number {
	if (globalOverride != null) {
		return globalOverride;
	}
	if (!colWidth) {
		return DEFAULT_MIN_COLUMN_WIDTH;
	}
	if (colWidth.type === 'proportional') {
		return colWidth.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
	}
	if (colWidth.type === 'pixel') {
		return colWidth.value;
	}
	return FALLBACK_MIN_WIDTH;
}

/**
 * Check whether a column is proportional (or has no explicit width,
 * which defaults to proportional(1) in BaseTable).
 */
export function isProportionalColumn(colWidth: ColumnWidth | undefined): boolean {
	return !colWidth || colWidth.type === 'proportional';
}

// =============================================================================
// Drag State (mutable, not reactive — avoids re-renders during drag)
// =============================================================================

export interface ColumnSnapshot {
	key: string;
	th: HTMLTableCellElement;
	initialWidth: number;
	minWidth: number;
	maxWidth: number;
}

export interface DragState {
	columnKey: string;
	startX: number;
	/** Index of the column being resized in the snapshots array */
	resizeIndex: number;
	/** When resizing a proportional column, we resize the next column instead */
	neighborIndex: number | null;
	/** Snapshot of ALL columns at drag start */
	snapshots: ColumnSnapshot[];
	/** Table width at drag start — last column fills remainder */
	tableWidth: number;
}

/**
 * The mutable drag + DOM state one `useTableColumnResize` call shares with
 * every resize handle it renders. Upstream's three `useRef`s, in one object.
 */
export interface ResizeSession {
	/** The in-flight drag, or `null` when nothing is being dragged. */
	drag: DragState | null;
	/** Whether a pointer drag is currently active. */
	isDragging: boolean;
	/** The `<table>` this plugin instance is attached to, once measured. */
	table: HTMLTableElement | null;
}

// =============================================================================
// Central width computation
// =============================================================================

/**
 * Given a drag delta, compute pixel widths for ALL columns.
 * Only the target column (or neighbor in proportional mode) changes;
 * all others stay at their snapshot values. The last column gets the
 * remainder (tableWidth - sum of others).
 *
 * Every width is clamped to its column's min. This is the single source
 * of truth for column widths during drag — no other code path should
 * compute widths independently.
 */
export function computeColumnWidths(drag: DragState, delta: number): number[] {
	const { snapshots, resizeIndex, neighborIndex, tableWidth } = drag;
	const widths = snapshots.map((s) => s.initialWidth);
	const lastIndex = snapshots.length - 1;

	if (neighborIndex != null) {
		// Proportional-preserving: adjust the neighbor column inversely.
		const neighbor = snapshots[neighborIndex];
		const self = snapshots[resizeIndex];

		// Clamp: neighbor can't go below its min
		const maxDelta = neighbor.initialWidth - neighbor.minWidth;
		// Clamp: self can't go below its min
		const minDelta = self.minWidth - self.initialWidth;
		const clampedDelta = Math.max(minDelta, Math.min(delta, maxDelta));

		widths[neighborIndex] = neighbor.initialWidth - clampedDelta;
		widths[resizeIndex] = self.initialWidth + clampedDelta;
	} else {
		// Direct resize: clamp to min/max
		const self = snapshots[resizeIndex];
		const newWidth = Math.min(self.maxWidth, Math.max(self.minWidth, self.initialWidth + delta));
		widths[resizeIndex] = newWidth;
	}

	// Last column = remainder (table can grow horizontally if needed)
	if (lastIndex >= 0 && tableWidth > 0) {
		const sumOthers = widths.reduce((sum, w, i) => (i === lastIndex ? sum : sum + w), 0);
		widths[lastIndex] = Math.max(snapshots[lastIndex].minWidth, tableWidth - sumOthers);
	}

	return widths;
}

// =============================================================================
// DOM application
// =============================================================================

/**
 * Freeze every snapshotted `<th>` at its computed pixel width. Setting all
 * three of width/min/max is what pins a `table-layout: fixed` column against
 * the browser's own distribution.
 */
export function applyColumnWidths(snapshots: ColumnSnapshot[], widths: number[]): void {
	snapshots.forEach((s, i) => {
		const px = `${widths[i]}px`;
		s.th.style.width = px;
		s.th.style.minWidth = px;
		s.th.style.maxWidth = px;
	});
}

/**
 * The map handed to `onColumnResizeEnd` — every snapshotted column **except
 * the last**, which is left to flex into the remainder.
 */
export function buildWidthUpdates(
	snapshots: ColumnSnapshot[],
	widths: number[]
): Record<string, number> {
	const updates: Record<string, number> = {};
	const lastIndex = snapshots.length - 1;
	snapshots.forEach((s, i) => {
		if (i === lastIndex) {
			return;
		}
		updates[s.key] = widths[i];
	});
	return updates;
}
