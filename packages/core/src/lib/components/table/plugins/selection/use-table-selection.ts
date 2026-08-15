import type { Snippet } from 'svelte';
import { mergeStyle } from '../../../../internal/sx.js';
import { withProps } from '../../../../internal/with-props.js';
import type { BodyRowRenderProps, TableColumn, TablePlugin } from '../../table-types.js';
import { pixel } from '../../column-utils.js';
import SelectionScope from './selection-scope.svelte';
import { selectionCell, selectionHeader } from './selection-slots.svelte';
import { selectedBgColor } from './selection.stylex.js';

/**
 * Ported from Astryx's `Table/plugins/selection/useTableSelection.tsx`.
 *
 * ## What the port changes, and why
 *
 * Upstream's architecture note describes three mechanisms. Two of them are
 * React scheduling and have no counterpart:
 *
 * - **The external store.** `SelectionStore` + `useSyncExternalStore` exist so
 *   a selection change re-renders one row's checkbox rather than the whole
 *   body. Svelte is already fine-grained; the store collapses into the config
 *   getter it was wrapping. See `selection-context.svelte.ts`.
 * - **The imperative row styling.** Upstream applies `aria-selected` and the
 *   background from a `ref` callback that subscribes to the store, because
 *   re-rendering every `<tr>` to restyle one is the thing it is avoiding. Here
 *   `transformBodyRow` runs inside a `{@const}` in `BaseTable` — a derived — so
 *   writing both into `htmlProps` restyles exactly the row whose selection
 *   changed. `mergeRefs` goes with it.
 *
 * The third — the synthetic checkbox column via `transformColumns`, flowing
 * through the normal cell pipeline so component overrides apply — is upstream's
 * design and is kept exactly.
 *
 * No runes are needed, so this is a plain `.ts` module: the plugin object holds
 * closures over the `config` **getter**, which is what upstream's `useRef` +
 * `useMemo` pair is for — a stable plugin identity that still reads fresh
 * config. That stability is load-bearing here and not merely tidy, because
 * `transformTableContext` must return a **stable component reference** or the
 * table remounts on every selection change (port/todo.md, batch 11).
 */

// =============================================================================
// Config Type
// =============================================================================

export interface UseTableSelectionConfig<T extends Record<string, unknown>> {
	/** Is this item currently selected? */
	getIsItemSelected: (item: T) => boolean;
	/** Called when a row checkbox is toggled. isSelected = new desired state. */
	onSelectItem: (event: { item: T; isSelected: boolean }) => void;
	/** Called when select-all checkbox is toggled. */
	onSelectAll: (event: { isAllSelected: boolean }) => void;
	/** Are all selectable items currently selected? */
	getIsAllSelected: () => boolean;
	/** Is the selection partial (some but not all)? Shows indeterminate checkbox. */
	getIsIndeterminate?: () => boolean;
	/** Should this row show a checkbox? Non-selectable rows render nothing. @default () => true */
	getIsItemSelectable?: (item: T) => boolean;
	/** Is this row's checkbox interactive? Disabled rows show disabled checkbox. @default () => true */
	getIsItemEnabled?: (item: T) => boolean;
	/**
	 * Derive a human-readable identity for a row, used in the row checkbox's
	 * hidden label as `Select ${getRowLabel(item)}`. Without it, every row
	 * checkbox announces an undifferentiated "Select row" to screen readers.
	 * With `getRowLabel: item => item.name`, checkbox accessible names become
	 * "Select Alice", "Select Bob", and so on.
	 *
	 * @example
	 * ```ts
	 * getRowLabel: (item) => item.name
	 * ```
	 */
	getRowLabel?: (item: T) => string;
}

/** Selection column key — prefixed to avoid collisions with user columns. */
const SELECTION_COLUMN_KEY = '__xds_selection';

/** Fixed width for the selection column. Content is centered with no horizontal padding. */
const SELECTION_COLUMN_WIDTH = pixel(36);

// =============================================================================
// Hook
// =============================================================================

/**
 * Returns a {@link TablePlugin} that prepends a checkbox column and marks
 * selected rows.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let selectedKeys = $state(new Set<string>());
 *   const { selectionConfig } = useTableSelectionState(() => ({
 *     data: users, idKey: 'id', selectedKeys,
 *     setSelectedKeys: (next) => (selectedKeys = next)
 *   }));
 *   const selection = useTableSelection(() => selectionConfig);
 * </script>
 * <Table data={users} {columns} idKey="id" plugins={{ selection }} />
 * ```
 */
export function useTableSelection<T extends Record<string, unknown>>(
	config: () => UseTableSelectionConfig<T>
): TablePlugin<T> {
	// Bound once, not per `transformTableContext()` call: a provider whose
	// component *reference* changes tears down and rebuilds the table's whole
	// subtree, losing scroll position, focus and child state on every selection
	// change. Upstream's element-wrapping form cannot express that hazard, which
	// is why batch 11 recorded it as a contract note for this batch.
	const provider = withProps(SelectionScope, {
		config: config as () => UseTableSelectionConfig<Record<string, unknown>>
	});

	// The synthetic selection column. Both slots are module-exported snippets
	// that render context-reading components — see `selection-slots.svelte` for
	// why that is the shape, and why it reproduces upstream's markup exactly.
	const selectionColumn: TableColumn<T> = {
		key: SELECTION_COLUMN_KEY,
		header: selectionHeader,
		width: SELECTION_COLUMN_WIDTH,
		resizable: false,
		// The snippet is declared over the erased row type, as the context is.
		// `TableColumn<T>` narrows it back for the consumer; there is one row
		// shape at runtime either way.
		renderCell: selectionCell as unknown as Snippet<[T]>
	};

	return {
		transformTableContext() {
			return provider;
		},

		transformColumns(columns: TableColumn<T>[]) {
			return [selectionColumn, ...columns];
		},

		transformBodyRow(props: BodyRowRenderProps, item: T) {
			const isSelected = config().getIsItemSelected(item);

			return {
				...props,
				htmlProps: {
					...props.htmlProps,
					...(isSelected ? { 'aria-selected': true } : {}),
					style: mergeStyle(
						props.htmlProps.style as string | undefined,
						isSelected ? `background-color:${selectedBgColor}` : null
					)
				}
			};
		}
	};
}
