import { createSlotBinder } from '../../../../internal/bind-snippet.js';
import { mergeStyle } from '../../../../internal/sx.js';
import { withProps } from '../../../../internal/with-props.js';
import { observeResize, unobserveResize } from '../../../../internal/shared-resize-observer.js';
import type { HeaderCellRenderProps, TableColumn, TablePlugin } from '../../table-types.js';
import ColumnResizeMeasure from './column-resize-measure.svelte';
import { resizeOverlay, type ResizeOverlayArg } from './column-resize-slots.svelte';
import { headerCellRelativeStyle } from './column-resize.stylex.js';
import {
	isProportionalColumn,
	resolveColumnMinWidth,
	type ResizeSession
} from './column-resize-utils.js';

/**
 * Ported from Astryx's
 * `Table/plugins/columnResize/useTableColumnResize.tsx` (866 LOC, the largest
 * file in the plugin batch). The width arithmetic, the neighbor/last-column
 * rules and the WAI-ARIA splitter keyboard contract all transcribe verbatim —
 * see `column-resize-utils.ts` and `column-resize-handle.svelte`, which hold
 * them. What this file records is the translation.
 *
 * **Deleted, with no counterpart:**
 *
 * - **`configRef`.** Upstream mirrors `config` into a ref each render so the
 *   drag handlers read the *current* config rather than the one captured when
 *   they were created. The config arrives here as a **getter**, which is
 *   already both stable and live, so the mirror is not needed and neither is
 *   the assignment that keeps it fresh.
 * - **Both `useMemo`s and every `useCallback`.** `resizableColumns` is
 *   recomputed from `config()` at the point of use — an `O(n)` filter over a
 *   column list, which is what `plugins/sticky-columns` already does per cell
 *   rather than take a `$derived` and the SSR-caching question that comes with
 *   it. The `useMemo` wrapping the returned plugin object has no counterpart
 *   either: the object closes over the getter, so one object serves the
 *   component's lifetime and its members always read current values. The
 *   handlers' `useCallback`s go the same way (see the handle component).
 * - **The `key={\`resize-${column.key}\`}` on the handle.** A React
 *   reconciliation key; `BaseTable`'s `{#each}` is already keyed by column key.
 * - **`observedTableRef` and the unmount `useEffect`.** Upstream's ref callback
 *   fires with `null` on unmount and has to remember what it observed so the
 *   cleanup `useEffect` can unobserve it. A Svelte attachment **returns** its
 *   own teardown, closing over the very element it observed, so both the ref
 *   and the effect collapse into that return.
 *
 * **Translated:**
 *
 * - **`transformTableContext` returns a component**, per this port's
 *   `TablePlugin` contract (Svelte reads context at component init). Upstream's
 *   wrapper is a `display: contents` `<div>` carrying `measureRef`, so the
 *   component renders exactly that div and takes the attachment as a bound
 *   prop. The provider is bound **once, outside the transform** — a changing
 *   component reference would remount the whole table (port/todo.md, batch-11
 *   contract note).
 * - **The resize handle rides a keyed bound snippet.**
 *   `HeaderCellRenderProps.overlay` is a zero-argument `Snippet` closing over
 *   the column and its resolved widths, which a `.ts` module cannot author;
 *   `column-resize-slots.svelte` holds the parameterised snippet and this file
 *   binds its argument through `createSlotBinder`, keyed by `column.key`. The
 *   keying is load-bearing rather than tidy: `{@render}` branches on the
 *   snippet's function identity, so an unkeyed binding would hand it a new
 *   function on every transform and *replace* the handle instead of updating
 *   it — which is exactly what upstream's suite of three successive arrow
 *   presses on a focused splitter would catch. Upstream composes with the prior
 *   overlay via a fragment, so the bound argument carries `props.overlay` and
 *   the snippet renders it first.
 * - **`htmlProps.style` is a string.** React merges
 *   `{...existingStyle, ...widthStyle}`; here the same precedence is the later
 *   declaration in `mergeStyle(existing, widthStyle)`.
 * - **The three drag `useRef`s become one `ResizeSession`**, created per hook
 *   call and shared with every handle — genuine mutable DOM/drag state, not
 *   memo hygiene, and deliberately not `$state`: a drag must not re-render.
 * - **`ResizeObserver` goes through `internal/shared-resize-observer.ts`**, the
 *   already-ported `utils/sharedResizeObserver`. Note its `unobserveResize`
 *   takes only the element.
 *
 * **Not translated, deliberately:** the `Resize column …` aria-label is a
 * literal, as upstream leaves it. `useTableColumnResize` is the one Table
 * plugin upstream does *not* route through its i18n layer, and there is no
 * catalog key for it; adding one would be drift.
 */

// =============================================================================
// Config Type
// =============================================================================

export interface UseTableColumnResizeConfig {
	/**
	 * Column width overrides from resize operations.
	 * Keys are column `key` strings. Values are pixel widths.
	 * When a column key is present here, it overrides the column's
	 * declared `width` (proportional or pixel).
	 *
	 * Controlled: consumer owns this state and persists as needed.
	 */
	columnWidths?: Record<string, number>;

	/**
	 * Called when a resize operation completes (pointerup / Enter key).
	 * Receives a map of ALL column keys that changed width — the resized column
	 * plus any other columns that were committed to pixel widths to prevent
	 * layout shift. Consumer should merge these into their columnWidths state.
	 */
	onColumnResizeEnd?: (updates: Record<string, number>) => void;

	/**
	 * Global minimum column width in pixels during resize.
	 * Overrides per-column defaults when set.
	 * @default undefined (uses column-specific minimum)
	 */
	minWidth?: number;

	/**
	 * Global maximum column width in pixels during resize.
	 * @default Infinity (no max)
	 */
	maxWidth?: number;

	/**
	 * Column definitions — needed to derive per-column min widths
	 * and detect proportional vs pixel columns for last-column behavior.
	 *
	 * When proportional columns are detected, the resize handle
	 * automatically adjusts the neighboring column instead of the
	 * proportional column itself. The last proportional column has
	 * no resize handle (it flexes to fill remaining space).
	 *
	 * When not provided, all columns are treated as pixel columns
	 * and the global minWidth fallback (50px) is used.
	 */
	columns?: TableColumn<Record<string, unknown>>[];
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Returns a {@link TablePlugin} that adds draggable resize handles to column
 * header borders. Supports pointer and keyboard (WAI-ARIA window splitter)
 * resizing, RTL, per-column min/max widths, and proportional-column
 * preservation — resizing the neighbor so the table stays full width. Widths
 * are committed on release.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let columnWidths = $state<Record<string, number>>({});
 *   const resize = useTableColumnResize(() => ({
 *     columnWidths,
 *     columns,
 *     onColumnResizeEnd: (updates) => (columnWidths = { ...columnWidths, ...updates })
 *   }));
 * </script>
 * <Table {data} {columns} plugins={[resize]} />
 * ```
 */
export function useTableColumnResize<T extends Record<string, unknown>>(
	config: () => UseTableColumnResizeConfig
): TablePlugin<T> {
	// Genuine mutable drag + DOM state, shared by every handle this plugin
	// instance renders. Upstream's `dragStateRef` / `isDraggingRef` / `tableRef`.
	const session: ResizeSession = { drag: null, isDragging: false, table: null };

	// Measure the table height and expose it as --table-resize-height on the
	// <table> element, so a handle can extend through the body rows. Initialized
	// entirely by the resize plugin — the base table has no knowledge of it.
	function measure(el: HTMLDivElement): () => void {
		const table = el.querySelector('table');
		if (table) {
			session.table = table;
		}

		if (table && typeof ResizeObserver !== 'undefined') {
			observeResize(table, () => {
				const height = table.getBoundingClientRect().height;
				table.style.setProperty('--table-resize-height', `${height}px`);
			});
			// Upstream needs `observedTableRef` plus an unmount effect to reach this
			// element again; the attachment's teardown already closes over it.
			return () => unobserveResize(table);
		}

		return () => {};
	}

	// Bound once: a plugin must return a *stable* component reference, or the
	// table remounts whenever any plugin object changes identity.
	const provider = withProps(ColumnResizeMeasure, { measure });

	// Bound once per hook call, keyed by column: the splitter must keep its
	// element identity across a resize, or a keyboard drag destroys the very
	// handle that has focus after the first arrow press. See `createSlotBinder`.
	const bindOverlay = createSlotBinder<ResizeOverlayArg>(resizeOverlay);

	return {
		transformTableContext() {
			return provider;
		},

		transformHeaderCell(
			props: HeaderCellRenderProps,
			column: TableColumn<T>
		): HeaderCellRenderProps {
			// Skip columns that opt out of resizing
			if (column.resizable === false) {
				return props;
			}

			// Read the getter once: it typically mints a fresh object per call.
			const cfg = config();
			const columnWidths = cfg.columnWidths;
			const columns = cfg.columns;

			// Central list of resizable columns — filters out non-resizable columns
			// (e.g. selection checkbox) once so that all index-based logic (neighbor
			// detection, last-column checks, drag snapshots) operates on a consistent
			// set. Without this, synthetic columns injected by other plugins shift
			// indices and break width computation.
			const resizableColumns = columns?.filter((c) => c.resizable !== false);

			const overrideWidth = columnWidths?.[column.key];

			// Determine if this is a proportional column that should
			// delegate resize to its neighbor (the next column).
			// This prevents weird behavior when the table is 100% width
			// and the last column is proportional — it just flexes.
			// Uses resizableColumns so indices aren't shifted by non-resizable
			// synthetic columns (e.g. selection).
			let neighborKey: string | null = null;

			if (resizableColumns && isProportionalColumn(column.width)) {
				const colIndex = resizableColumns.findIndex((c) => c.key === column.key);
				if (colIndex >= 0 && colIndex < resizableColumns.length - 1) {
					const nextCol = resizableColumns[colIndex + 1];
					neighborKey = nextCol.key;
				}
			}

			// If this is the last resizable column and it's proportional, skip
			// the handle. There's no neighbor to resize and resizing a flex
			// column in a full-width table produces unpredictable results.
			if (resizableColumns) {
				const colIndex = resizableColumns.findIndex((c) => c.key === column.key);
				const isLastResizable = colIndex === resizableColumns.length - 1;
				if (isLastResizable && isProportionalColumn(column.width)) {
					return props;
				}
			}

			const widthStyle =
				overrideWidth != null
					? `width:${overrideWidth}px;min-width:${overrideWidth}px;max-width:${overrideWidth}px`
					: undefined;

			// Later declaration wins, which is React's `{...existing, ...width}`.
			const mergedStyle = mergeStyle(props.htmlProps.style as string | undefined, widthStyle);

			const priorOverlay = props.overlay;
			const columnHeader = column.header ?? column.key;

			return {
				...props,
				htmlProps: {
					...props.htmlProps,
					style: mergedStyle
				},
				// The width members are resolved **inside** the getter, from a fresh
				// `config()`. A keyed bound snippet keeps its function identity, so the
				// slot's `{@const unwrapSlotArg(arg)}` derived is the only path by which
				// new props reach the handle — and a derived that reads nothing
				// reactive never re-runs. Hoisting these above the getter, as the first
				// cut did, froze the splitter at its mount width, and the damage was not
				// confined to ARIA: `aria-valuenow` went stale, and because the handle
				// computes its Home/End delta from `currentWidth` while `buildDragState`
				// reads `columnWidths` fresh, the two disagreed the moment a width was
				// committed — Home stopped jumping to the minimum after the first arrow
				// press. `aria-valuemin`/`valuemax`/`neighborKey` went stale the same
				// way, and a stale `neighborKey` resizes the wrong column.
				overlay: bindOverlay(column.key, () => {
					const live = config();
					const liveMax = live.maxWidth ?? Infinity;
					return {
						prior: priorOverlay,
						columnKey: column.key,
						columnHeader,
						currentWidth: live.columnWidths?.[column.key],
						minWidth: resolveColumnMinWidth(column.width, live.minWidth),
						maxWidth: liveMax,
						neighborKey,
						config,
						session
					};
				}),
				xstyle: [...props.xstyle, headerCellRelativeStyle]
			};
		}
	};
}
