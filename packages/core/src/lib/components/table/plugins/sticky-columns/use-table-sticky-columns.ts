import { createAttachmentKey } from 'svelte/attachments';
import { mergeStyle } from '../../../../internal/sx.js';
import { observeResize, unobserveResize } from '../../../../internal/shared-resize-observer.js';
import { DEFAULT_MIN_COLUMN_WIDTH } from '../../column-utils.js';
import type {
	BodyCellRenderProps,
	HeaderCellRenderProps,
	ScrollWrapperRenderProps,
	TableColumn,
	TablePlugin
} from '../../table-types.js';
import {
	SHADOW_VAR_END,
	SHADOW_VAR_START,
	stickyBodyCellStyle,
	stickyCellStyle,
	stickyHeaderCellStyle,
	stickyShadowEndStyle,
	stickyShadowStartStyle
} from './sticky-columns.stylex.js';

/**
 * Ported from Astryx's
 * `Table/plugins/stickyColumns/useTableStickyColumns.tsx`.
 *
 * The offset arithmetic transcribes verbatim. Three translations:
 *
 * - **The scroll-shadow ref becomes an attachment**, keyed by
 *   `createAttachmentKey()` in the wrapper's `htmlProps` bag. That is the shape
 *   `table-types.ts` documents for every plugin that needs a DOM node, and it
 *   removes upstream's `mergedRef` entirely: attachments **compose**, so a
 *   prior plugin's attachment on the same element survives without this plugin
 *   knowing about it. Upstream has to hand-merge a `RefCallback` with a
 *   possible `RefObject`; there is nothing here to merge.
 * - **`htmlProps.style` is a string, not an object.** React takes
 *   `{...style, ...offsetStyle}`; Svelte takes a serialised declaration, so the
 *   merge is `mergeStyle`. Later declarations win in both, so precedence is
 *   unchanged — which matters because upstream notes the resize plugin also
 *   writes inline style on header cells.
 * - **`ResizeObserver` goes through the shared observer.** `internal/
 *   shared-resize-observer.ts` is upstream's own `utils/sharedResizeObserver`,
 *   already ported; using it keeps one observer for the whole page instead of
 *   one per table, and it carries the `typeof ResizeObserver !== 'undefined'`
 *   guard upstream writes inline.
 *
 * The `useRef` state snapshot and `EMPTY` stable-array default are React
 * memo-hygiene with no counterpart: the config getter is read at call time.
 */

// =============================================================================
// Config
// =============================================================================

/**
 * Config for {@link useTableStickyColumns}. Provide at least one of
 * `startKeys` / `endKeys` to pin columns.
 *
 * @remarks Every field is optional by design, so `useTableStickyColumns(() => ({}))`
 * compiles and is an intentional no-op that pins nothing — the hook returns a
 * plugin that passes every cell through untouched. This lets callers compute
 * the config conditionally (e.g. `endKeys: enabled ? ['notes'] : undefined`)
 * without branching on whether to install the plugin at all.
 */
export interface UseTableStickyColumnsConfig {
	/**
	 * Column keys pinned to the START (inline-start / left in LTR) edge — the
	 * contiguous run from the first column through the last listed key.
	 */
	startKeys?: string[];
	/**
	 * Column keys pinned to the END (inline-end / right in LTR) edge — the
	 * contiguous run from the first listed key through the last column.
	 */
	endKeys?: string[];
}

// =============================================================================
// Width helpers
// =============================================================================

/**
 * Resolve a column's pixel width for cumulative offset math. Mirrors the
 * resize plugin's fallback so offsets line up with rendered widths:
 * pixel columns use their value; proportional columns use their declared
 * minWidth (or the default); unknown widths use the default.
 */
function getColumnWidth(col: TableColumn<Record<string, unknown>>): number {
	const w = col.width;
	if (!w) {
		return DEFAULT_MIN_COLUMN_WIDTH;
	}
	if (w.type === 'pixel') {
		return w.value;
	}
	// proportional
	return w.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
}

/**
 * Columns pinned to the START edge → cumulative inline offset (px). The pinned
 * block is the contiguous run from column 0 through the last key in `startKeys`
 * (inclusive of any synthetic columns before it). `null` if none / no context.
 */
function computeStartOffsets(
	columns: ReadonlyArray<TableColumn<Record<string, unknown>>> | undefined,
	startKeys: string[]
): Map<string, number> | null {
	if (!columns || columns.length === 0 || startKeys.length === 0) {
		return null;
	}
	let lastStickyIndex = -1;
	for (let i = 0; i < columns.length; i++) {
		if (startKeys.includes(columns[i].key)) {
			lastStickyIndex = i;
		}
	}
	if (lastStickyIndex === -1) {
		return null;
	}
	const offsets = new Map<string, number>();
	let cumulative = 0;
	for (let i = 0; i <= lastStickyIndex; i++) {
		offsets.set(columns[i].key, cumulative);
		cumulative += getColumnWidth(columns[i]);
	}
	return offsets;
}

/**
 * Mirror of {@link computeStartOffsets} for the END edge — contiguous run from
 * the first key in `endKeys` through the last column, offsets accumulating from
 * the end (last column = 0). `null` if none.
 */
function computeEndOffsets(
	columns: ReadonlyArray<TableColumn<Record<string, unknown>>> | undefined,
	endKeys: string[]
): Map<string, number> | null {
	if (!columns || columns.length === 0 || endKeys.length === 0) {
		return null;
	}
	let firstStickyIndex = -1;
	for (let i = 0; i < columns.length; i++) {
		if (endKeys.includes(columns[i].key)) {
			firstStickyIndex = i;
			break;
		}
	}
	if (firstStickyIndex === -1) {
		return null;
	}
	const offsets = new Map<string, number>();
	let cumulative = 0;
	for (let i = columns.length - 1; i >= firstStickyIndex; i--) {
		offsets.set(columns[i].key, cumulative);
		cumulative += getColumnWidth(columns[i]);
	}
	return offsets;
}

interface StickySide {
	edge: 'start' | 'end';
	offset: number;
}

/**
 * Resolve how a single column should be pinned given the start/end configs and
 * the full column list. A key (mis)configured on both edges resolves to start.
 * Returns `null` for columns that should not be pinned.
 */
function resolveStickySide(
	columns: ReadonlyArray<TableColumn<Record<string, unknown>>> | undefined,
	columnKey: string,
	startKeys: string[],
	endKeys: string[]
): StickySide | null {
	const startOffsets = computeStartOffsets(columns, startKeys);
	if (startOffsets?.has(columnKey)) {
		return { edge: 'start', offset: startOffsets.get(columnKey) ?? 0 };
	}
	const endOffsets = computeEndOffsets(columns, endKeys);
	if (endOffsets?.has(columnKey)) {
		return { edge: 'end', offset: endOffsets.get(columnKey) ?? 0 };
	}
	return null;
}

/** The inline declaration pinning a cell to its edge. */
function offsetStyle(side: StickySide): string {
	return side.edge === 'start'
		? `inset-inline-start:${side.offset}px`
		: `inset-inline-end:${side.offset}px`;
}

// =============================================================================
// Hook
// =============================================================================

export function useTableStickyColumns<T extends Record<string, unknown>>(
	config: () => UseTableStickyColumnsConfig
): TablePlugin<T> {
	const resolved = () => {
		const { startKeys, endKeys } = config();
		const start = startKeys ?? [];
		const end = endKeys ?? [];
		return { start, end, hasStart: start.length > 0, hasEnd: end.length > 0 };
	};

	// Scroll-aware shadows: toggle CSS variables on the scroll container so each
	// edge's shadow only paints when there is hidden, horizontally-scrolled
	// content behind that edge. Kept out of reactive state entirely, as upstream
	// keeps it out of React state — scrolling must never trigger a re-render.
	const shadowAttachmentKey = createAttachmentKey();

	function attachScrollShadow(el: HTMLDivElement): () => void {
		const update = () => {
			const { hasStart, hasEnd } = resolved();
			const maxScroll = el.scrollWidth - el.clientWidth;
			const hasOverflow = maxScroll > 1;
			// RTL-safe scroll position. Spec-compliant browsers report a NEGATIVE
			// `scrollLeft` under RTL (0 at the inline-start edge, decreasing toward
			// the inline-end edge), so a raw `scrollLeft > 1` start test would never
			// fire and the end test would be wrong-signed — the start shadow would
			// never appear and the end shadow would never clear. `Math.abs` collapses
			// both conventions to a distance-from-inline-start, matching
			// `useScrollOverflow`, which already did this. A no-op under LTR, where
			// `scrollLeft` is already >= 0.
			const pos = Math.abs(el.scrollLeft);
			if (hasStart) {
				el.style.setProperty(SHADOW_VAR_START, hasOverflow && pos > 1 ? '1' : '0');
			}
			if (hasEnd) {
				el.style.setProperty(SHADOW_VAR_END, hasOverflow && pos < maxScroll - 1 ? '1' : '0');
			}
		};
		el.addEventListener('scroll', update, { passive: true });
		observeResize(el, update);
		update();
		return () => {
			el.removeEventListener('scroll', update);
			unobserveResize(el);
		};
	}

	return {
		transformHeaderCell(props: HeaderCellRenderProps, column: TableColumn<T>) {
			const { start, end } = resolved();
			const side = resolveStickySide(props.columns, column.key, start, end);
			if (!side) {
				return props;
			}
			// position/inline-offset are runtime values → set via inline style so
			// they are authoritative regardless of plugin composition order (the
			// resize plugin also writes inline style on header cells).
			return {
				...props,
				htmlProps: {
					...props.htmlProps,
					style: mergeStyle(props.htmlProps.style as string | undefined, offsetStyle(side))
				},
				xstyle: [
					...props.xstyle,
					stickyCellStyle,
					stickyHeaderCellStyle,
					side.edge === 'start' ? stickyShadowStartStyle : stickyShadowEndStyle
				]
			};
		},

		transformBodyCell(props: BodyCellRenderProps, column: TableColumn<T>) {
			const { start, end } = resolved();
			const side = resolveStickySide(props.columns, column.key, start, end);
			if (!side) {
				return props;
			}
			return {
				...props,
				htmlProps: {
					...props.htmlProps,
					style: mergeStyle(props.htmlProps.style as string | undefined, offsetStyle(side))
				},
				xstyle: [
					...props.xstyle,
					stickyCellStyle,
					stickyBodyCellStyle,
					side.edge === 'start' ? stickyShadowStartStyle : stickyShadowEndStyle
				]
			};
		},

		transformScrollWrapper(props: ScrollWrapperRenderProps) {
			// No pinned edges → nothing to gate; leave the wrapper untouched.
			const { hasStart, hasEnd } = resolved();
			if (!hasStart && !hasEnd) {
				return props;
			}
			// No ref merging: attachments compose, so a prior plugin's attachment
			// on the same element is untouched by adding ours under our own key.
			return {
				...props,
				htmlProps: {
					...props.htmlProps,
					[shadowAttachmentKey]: (el: HTMLDivElement) => attachScrollShadow(el)
				}
			};
		}
	};
}
