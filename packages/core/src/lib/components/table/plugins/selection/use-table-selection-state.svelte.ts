import type { UseTableSelectionConfig } from './use-table-selection.js';

/**
 * Ported from Astryx's
 * `Table/plugins/selection/useTableSelectionState.tsx`.
 *
 * The logic transcribes verbatim — the select-all rules (preserve
 * disabled-but-selected rows, toggle only actionable ones, and never read an
 * empty selectable set as "all selected") are subtle and are upstream's
 * exactly. Two translations:
 *
 * - **`setSelectedKeys` is a plain setter**, not
 *   `React.Dispatch<SetStateAction<Set<string>>>`. The updater form exists
 *   because a React setter may see stale state inside a batch; `$state` reads
 *   are always current, so `onSelectItem` derives the next set from the
 *   `selectedKeys` it was handed. This is the first hook in the port to take a
 *   React setter, so it is the shape the rest should follow.
 * - **The two `useRef`s are gone.** `frozenSelectedIDsRef` and
 *   `allSelectableIDsRef` exist only to keep `onSelectAll` referentially stable
 *   while still reading current values; a closure over a `$derived` is both.
 *
 * Every `Set` here is a plain one, and `svelte/prefer-svelte-reactivity` is
 * disabled at each site. Two reasons: `selectedKeys` is `Set<string>` in
 * upstream's published config type, so it is not ours to change; and the rest
 * are built fresh inside a `$derived` and never mutated afterwards, so the
 * derived is already the reactive boundary and a `SvelteSet` would add signal
 * bookkeeping with no reader. Same argument as `table-context-menu.svelte`.
 */

// =============================================================================
// Config Type
// =============================================================================

export interface UseTableSelectionStateConfig<T extends Record<string, unknown>> {
	/**
	 * The data array currently rendered in the table.
	 * Pass the **filtered/visible** data, not the full dataset — select-all
	 * operates on this array, so passing unfiltered data would select hidden rows.
	 */
	data: T[];
	/**
	 * Key extractor — returns a unique string ID for each item.
	 * Can be a property name or a function.
	 */
	idKey: (keyof T & string) | ((item: T) => string);
	/**
	 * Should this row show a checkbox? Non-selectable rows are excluded
	 * from select-all and don't render a checkbox.
	 * @default () => true
	 */
	getIsItemSelectable?: (item: T) => boolean;
	/**
	 * Is this row's checkbox interactive? Disabled rows are frozen —
	 * select-all won't add or remove them from the selection.
	 * A disabled row that was selected before becoming disabled stays selected.
	 * @default () => true
	 */
	getIsItemEnabled?: (item: T) => boolean;
	// No `getRowLabel` here, deliberately: upstream's state hook neither accepts
	// nor forwards one (`useTableSelectionState.tsx:28-63`, `:188-195`). It is a
	// member of the *plugin* config only, which a consumer spreads onto the
	// returned `selectionConfig` themselves — see `use-table-selection.ts`.
	/**
	 * Controlled selected keys. The hook manages the selection set and
	 * calls the setter when it changes.
	 */
	selectedKeys: Set<string>;
	/**
	 * Setter for the controlled selected keys. Receives the next set;
	 * upstream's updater-function form has no counterpart, because a `$state`
	 * read is never stale.
	 */
	setSelectedKeys: (next: Set<string>) => void;
}

export interface UseTableSelectionStateResult<T extends Record<string, unknown>> {
	/** Ready-to-use config for `useTableSelection`. */
	selectionConfig: UseTableSelectionConfig<T>;
}

// =============================================================================
// Hook
// =============================================================================

const stableTrue = () => true;

export function useTableSelectionState<T extends Record<string, unknown>>(
	config: () => UseTableSelectionStateConfig<T>
): UseTableSelectionStateResult<T> {
	const getId = (item: T): string => {
		const { idKey } = config();
		return typeof idKey === 'function' ? idKey(item) : String(item[idKey]);
	};

	// Items that are both selectable and enabled — the "actionable" set
	const getIsItemSelectableAndEnabled = (item: T): boolean => {
		const c = config();
		return (c.getIsItemSelectable ?? stableTrue)(item) && (c.getIsItemEnabled ?? stableTrue)(item);
	};

	// IDs of all actionable items
	const selectableIDs = $derived(
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		new Set(config().data.filter(getIsItemSelectableAndEnabled).map(getId))
	);

	// Selected IDs that are NOT actionable (disabled-but-selected).
	// These are preserved across select-all / deselect-all.
	const frozenSelectedIDs = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const frozen = new Set<string>();
		for (const id of config().selectedKeys) {
			if (!selectableIDs.has(id)) {
				frozen.add(id);
			}
		}
		return frozen;
	});

	// All IDs that *would* be selected if select-all is checked
	// (all actionable items + any frozen selected items)
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const allSelectableIDs = $derived(new Set([...config().selectedKeys, ...selectableIDs]));

	const getAllSelected = (): boolean => {
		// Require at least one actionable row: with zero visible selectable
		// rows (e.g. a filter with no matches while a selection exists), the
		// union-based size comparison would read any non-empty selection as
		// "all selected" — a checked header checkbox over an empty table that
		// deselect-all can't clear, since the invisible keys count as frozen.
		if (selectableIDs.size === 0) {
			return false;
		}
		return allSelectableIDs.size === config().selectedKeys.size;
	};

	const selectionConfig: UseTableSelectionConfig<T> = {
		getIsItemSelected: (item) => config().selectedKeys.has(getId(item)),

		onSelectItem: ({ item, isSelected }) => {
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const next = new Set(config().selectedKeys);
			const id = getId(item);
			if (isSelected) {
				next.add(id);
			} else {
				next.delete(id);
			}
			config().setSelectedKeys(next);
		},

		onSelectAll: ({ isAllSelected }) => {
			config().setSelectedKeys(
				isAllSelected
					? // Select all actionable + preserve frozen
						allSelectableIDs
					: // Deselect all actionable, keep frozen
						frozenSelectedIDs
			);
		},

		getIsAllSelected: getAllSelected,

		getIsIndeterminate: () => {
			const c = config();
			const selectedActionableCount = c.data.filter(
				(item) => getIsItemSelectableAndEnabled(item) && c.selectedKeys.has(getId(item))
			).length;
			return selectedActionableCount > 0 && selectedActionableCount < selectableIDs.size;
		},

		// Forwarded through a wrapper rather than by reference: upstream passes
		// the *defaulted* callbacks it destructured once, and reading them at call
		// time keeps a config change live without re-creating the object.
		getIsItemSelectable: (item) => (config().getIsItemSelectable ?? stableTrue)(item),
		getIsItemEnabled: (item) => (config().getIsItemEnabled ?? stableTrue)(item)
	};

	return { selectionConfig };
}
