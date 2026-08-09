<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ResizeSession } from './column-resize-utils.js';
	import type { UseTableColumnResizeConfig } from './use-table-column-resize.js';

	/**
	 * Props for the internal resize handle. Upstream's `ResizeHandleProps`
	 * verbatim, with its four `React.RefObject` members collapsed: `configRef`
	 * becomes the config **getter** the hook already takes, and the other three
	 * (`dragStateRef`, `isDraggingRef`, `tableRef`) become the one `session`
	 * object — see `column-resize-utils.ts`.
	 */
	export interface ColumnResizeHandleProps {
		/** Key of the column this handle resizes. */
		columnKey: string;
		/**
		 * The column's header. Upstream types this `ReactNode` and uses it only to
		 * decide the aria-label, falling back to the key when it isn't a string;
		 * `string | Snippet` is the port's shape for that slot and reads the same.
		 */
		columnHeader: string | Snippet;
		/** The column's committed pixel override, when it has one. */
		currentWidth: number | undefined;
		/** Effective minimum width for this column, in pixels. */
		minWidth: number;
		/** Effective maximum width in pixels, or `Infinity` when unbounded. */
		maxWidth: number;
		/** For proportional-preserving: the neighbor column to resize instead. */
		neighborKey: string | null;
		/** Getter for the live plugin config. */
		config: () => UseTableColumnResizeConfig;
		/** Mutable drag/DOM state shared by every handle in one table. */
		session: ResizeSession;
	}
</script>

<script lang="ts">
	import {
		applyColumnWidths,
		buildWidthUpdates,
		computeColumnWidths,
		resolveColumnMinWidth,
		KEYBOARD_LARGE_STEP,
		KEYBOARD_STEP,
		type ColumnSnapshot,
		type DragState
	} from './column-resize-utils.js';
	import { resizeHandleAttrs } from './column-resize.stylex.js';

	/**
	 * Ported from Astryx's `ResizeHandle`, the component
	 * `useTableColumnResize.transformHeaderCell` puts in the header cell's
	 * `overlay` slot.
	 *
	 * The interaction transcribes statement for statement. What changes:
	 *
	 * - **Every `useCallback` is gone.** They exist to keep handler identity
	 *   stable across React renders; a Svelte component's functions are created
	 *   once per instance and the handlers read `config()` / `session` at event
	 *   time, so the memo has nothing to buy. The dependency arrays go with them.
	 * - **`configRef.current` is `config()`.** The ref exists so a handler sees
	 *   the *current* config rather than the one captured at render; a getter is
	 *   that, without the mirror. Each handler reads it **once** and reuses the
	 *   value, since a getter typically mints a fresh object per call.
	 * - **The snapshot builder is called, not copied.** Upstream duplicates ~40
	 *   lines of snapshot construction verbatim between `handlePointerDown` and
	 *   `buildSnapshotAndResize`; `buildDragState` below is that code once. No
	 *   behavioural difference — the two copies are identical, statement for
	 *   statement, including the order they read config.
	 * - **`Map` is plain.** `colsByKey` is scratch inside one event handler,
	 *   never read reactively and never mutated after construction, so a
	 *   `SvelteMap`'s signal bookkeeping would have no reader.
	 *   (`svelte/prefer-svelte-reactivity` does not fire on a seeded
	 *   `new Map(entries)`, so there is no directive to disable.)
	 *
	 * Window listeners, the imperative `<th>` width writes and the
	 * `data-resizing` / `--indicator-*` toggles stay imperative exactly as
	 * upstream leaves them: a drag must not re-render the table.
	 */
	let {
		columnKey,
		columnHeader,
		currentWidth,
		minWidth,
		maxWidth,
		neighborKey,
		config,
		session
	}: ColumnResizeHandleProps = $props();

	const attrs = resizeHandleAttrs();

	const ariaLabel = $derived(
		typeof columnHeader === 'string'
			? `Resize column ${columnHeader}`
			: `Resize column ${columnKey}`
	);

	function setTableDragging(dragging: boolean): void {
		const table = session.table;
		if (table) {
			// Imperative DOM: disable text selection during drag.
			table.style.userSelect = dragging ? 'none' : '';
		}
	}

	function getRTLMultiplier(el: HTMLElement): number {
		const dir = getComputedStyle(el).direction;
		return dir === 'rtl' ? -1 : 1;
	}

	/**
	 * Snapshot the header row's current geometry into a `DragState`.
	 *
	 * Only resizable columns are snapshotted — non-resizable synthetic columns
	 * (e.g. a selection checkbox) would otherwise shift indices and take part in
	 * width redistribution during drag.
	 */
	function buildDragState(headerRow: HTMLElement, startX: number): DragState {
		const cfg = config();
		const cols = cfg.columns;
		// Plain `Map`, not `SvelteMap`: scratch inside one event handler, never
		// read reactively and never mutated after construction.
		const colsByKey = new Map(cols?.map((col) => [col.key, col] as const));
		const allThs = Array.from(headerRow.querySelectorAll<HTMLTableCellElement>(':scope > th'));
		const tableWidth = session.table?.getBoundingClientRect().width ?? 0;
		const currentWidths = cfg.columnWidths ?? {};

		const snapshots: ColumnSnapshot[] = [];
		for (const cell of allThs) {
			const key = cell.getAttribute('data-column-key');
			if (!key) {
				continue;
			}
			const col = colsByKey.get(key);
			if (col?.resizable === false) {
				continue;
			}
			const rendered = cell.getBoundingClientRect().width;
			const override = currentWidths[key];
			snapshots.push({
				key,
				th: cell,
				initialWidth: override ?? (rendered > 0 ? rendered : 0),
				minWidth: col ? resolveColumnMinWidth(col.width, cfg.minWidth) : minWidth,
				maxWidth: cfg.maxWidth ?? Infinity
			});
		}

		// Find our column and neighbor in the snapshots by key
		const resizeIndex = snapshots.findIndex((s) => s.key === columnKey);
		let neighborIndex: number | null = null;
		if (neighborKey) {
			const idx = snapshots.findIndex((s) => s.key === neighborKey);
			if (idx >= 0) {
				neighborIndex = idx;
			}
		}

		return { columnKey, startX, resizeIndex, neighborIndex, snapshots, tableWidth };
	}

	function handlePointerDown(e: PointerEvent): void {
		e.preventDefault();
		e.stopPropagation();

		const handle = e.currentTarget as HTMLDivElement;
		const th = handle.closest('th');
		if (!th) {
			return;
		}

		const table = th.closest('table');
		if (table) {
			session.table = table;
		}

		const headerRow = th.parentElement;
		if (!headerRow) {
			return;
		}

		const drag = buildDragState(headerRow, e.clientX);
		session.drag = drag;
		session.isDragging = true;
		handle.setAttribute('data-resizing', 'true');
		handle.style.setProperty('--indicator-color', 'var(--color-accent)');
		handle.style.setProperty('--indicator-width', '2px');

		// Apply initial snapshot widths to ALL columns (freezes layout)
		applyColumnWidths(drag.snapshots, computeColumnWidths(drag, 0));
		setTableDragging(true);

		// --- Window-level listeners ---

		function onMove(ev: PointerEvent): void {
			const d = session.drag;
			if (!d || !session.isDragging) {
				return;
			}

			const rawDelta = (ev.clientX - d.startX) * getRTLMultiplier(d.snapshots[d.resizeIndex].th);
			applyColumnWidths(d.snapshots, computeColumnWidths(d, rawDelta));
		}

		function onUp(ev: PointerEvent): void {
			cleanup();
			const d = session.drag;
			if (!d || !session.isDragging) {
				return;
			}

			handle.removeAttribute('data-resizing');
			handle.style.removeProperty('--indicator-color');
			handle.style.removeProperty('--indicator-width');
			session.isDragging = false;
			session.drag = null;
			setTableDragging(false);

			const rawDelta = (ev.clientX - d.startX) * getRTLMultiplier(d.snapshots[d.resizeIndex].th);
			const widths = computeColumnWidths(d, rawDelta);

			// Build updates map — all columns except the last
			const updates = buildWidthUpdates(d.snapshots, widths);

			// Don't clear inline styles — leave them in place so there's no flash
			// between clearing and the table re-rendering with the new columnWidths.
			// The plugin's transformHeaderCell will set the same pixel values on
			// the next render, seamlessly replacing these inline styles.

			if (Object.keys(updates).length > 0) {
				config().onColumnResizeEnd?.(updates);
			}
		}

		function onCancel(): void {
			cleanup();
			const d = session.drag;
			if (!d || !session.isDragging) {
				return;
			}

			handle.removeAttribute('data-resizing');
			handle.style.removeProperty('--indicator-color');
			handle.style.removeProperty('--indicator-width');
			session.isDragging = false;
			session.drag = null;
			setTableDragging(false);

			// Restore to pre-drag state by clearing all inline styles
			d.snapshots.forEach((s) => {
				s.th.style.width = '';
				s.th.style.minWidth = '';
				s.th.style.maxWidth = '';
			});
		}

		function cleanup(): void {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onCancel);
		}

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onCancel);
	}

	/**
	 * Build a DragState snapshot from the current DOM, then use
	 * computeColumnWidths to calculate the result — same code path
	 * as pointer drag. This ensures keyboard and pointer resize
	 * produce identical column width distributions (especially when
	 * hitting min/max limits and the last column absorbs overflow).
	 */
	function buildSnapshotAndResize(th: HTMLTableCellElement, delta: number): void {
		const headerRow = th.parentElement;
		if (!headerRow) {
			return;
		}

		const drag = buildDragState(headerRow, 0);
		const widths = computeColumnWidths(drag, delta);

		// Apply computed widths to DOM
		applyColumnWidths(drag.snapshots, widths);

		// Build updates — all columns except the last (which flexes)
		const updates = buildWidthUpdates(drag.snapshots, widths);

		if (Object.keys(updates).length > 0) {
			config().onColumnResizeEnd?.(updates);
		}
	}

	/**
	 * Keyboard resize per WAI-ARIA Window Splitter pattern.
	 * Arrow keys resize immediately on focus — no activation step.
	 * Each keypress commits the new width directly via computeColumnWidths
	 * (same code path as pointer drag).
	 * Home/End jump to min/max width.
	 */
	function handleKeyDown(e: KeyboardEvent): void {
		const handle = e.currentTarget as HTMLDivElement;
		const th = handle.closest('th');
		if (!th) {
			return;
		}

		const table = th.closest('table');
		if (table) {
			session.table = table;
		}

		const step = e.shiftKey ? KEYBOARD_LARGE_STEP : KEYBOARD_STEP;
		const rtl = getRTLMultiplier(th);

		switch (e.key) {
			case 'ArrowRight':
			case 'ArrowLeft': {
				e.preventDefault();
				const direction = e.key === 'ArrowRight' ? 1 : -1;
				const delta = step * direction * rtl;
				buildSnapshotAndResize(th, delta);
				break;
			}
			case 'Home': {
				e.preventDefault();
				// Jump to minimum: delta that brings current width to min
				const curWidth = currentWidth ?? th.getBoundingClientRect().width;
				buildSnapshotAndResize(th, minWidth - curWidth);
				break;
			}
			case 'End': {
				e.preventDefault();
				if (maxWidth !== Infinity) {
					const curWidth = currentWidth ?? th.getBoundingClientRect().width;
					buildSnapshotAndResize(th, maxWidth - curWidth);
				}
				break;
			}
		}
	}
</script>

<!--
	The WAI-ARIA window-splitter pattern *requires* a focusable separator — that
	is where the arrow-key contract lives, and a `separator` with a tabindex is
	interactive by definition, which is why it also carries the pointer and
	keyboard handlers. Svelte's two rules read the bare role instead. Same
	suppression, for the same reason, as `resizable/resize-handle.svelte`.

	`aria-valuenow` falls back to the column's minWidth: a focusable
	`role="separator"` requires a numeric value, and the width has not been
	measured before the first resize.
-->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
	role="separator"
	aria-orientation="vertical"
	aria-valuenow={currentWidth ?? minWidth}
	aria-valuemin={minWidth}
	aria-valuemax={maxWidth === Infinity ? undefined : maxWidth}
	aria-label={ariaLabel}
	tabindex={0}
	onpointerdown={handlePointerDown}
	onkeydown={handleKeyDown}
	class={attrs.class}
	style={attrs.style}
></div>
