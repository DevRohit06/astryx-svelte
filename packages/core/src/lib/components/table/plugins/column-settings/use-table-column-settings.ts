import type { TableColumn, TablePlugin } from '../../table-types.js';
import type { UseTableColumnSettingsStateConfig } from './use-table-column-settings-state.svelte.js';

/**
 * Ported from Astryx's
 * `Table/plugins/columnSettings/useTableColumnSettings.tsx`.
 *
 * Pure — no markup and no state, so it needs neither a context nor a bound
 * snippet. Upstream's `useRef` + `useMemo(…, [])` pair exists to keep the
 * plugin identity stable while reading the latest config; the config getter is
 * that, so both drop out and the transform is transcribed verbatim.
 */

// =============================================================================
// Config Types
// =============================================================================

/**
 * Definition of a column for the column settings UI.
 * Separate from `TableColumn` because the settings UI needs metadata
 * (label, group, disableability) that the table column doesn't carry.
 */
export interface ColumnSettingsOption<TColumnKey extends string = string> {
	/** Column key — must match `TableColumn.key` */
	key: TColumnKey;
	/** Human-readable label for the column settings UI */
	label: string;
	/**
	 * Whether this column can be hidden.
	 * When true, the column is always visible and its checkbox is disabled.
	 * Use for essential columns like "Name" or "ID".
	 *
	 * @default false
	 */
	isAlwaysVisible?: boolean;
	/**
	 * Optional group name for organized column lists.
	 * Columns with the same group are rendered together under a heading.
	 */
	group?: string;
}

/**
 * Configuration for {@link useTableColumnSettings}.
 *
 * This is the same shape as `UseTableColumnSettingsStateConfig` —
 * you can pass `state.columnSettingsConfig` directly, or construct
 * it manually if you don't need the state hook.
 *
 * @template TColumnKey - String literal union of column keys
 */
export type UseTableColumnSettingsConfig<TColumnKey extends string = string> =
	UseTableColumnSettingsStateConfig<TColumnKey>;

// =============================================================================
// Plugin Hook
// =============================================================================

/**
 * Column settings table plugin — filters and reorders columns based on
 * the active column keys.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const state = useTableColumnSettingsState(() => ({
 *     columns, activeColumnKeys, onChangeActiveColumnKeys: (k) => (activeColumnKeys = k)
 *   }));
 *   const columnSettings = useTableColumnSettings(() => state.columnSettingsConfig);
 * </script>
 * <Table columns={allColumns} {data} plugins={{ columnSettings }} />
 * ```
 */
export function useTableColumnSettings<
	T extends Record<string, unknown>,
	TColumnKey extends string = string
>(config: () => UseTableColumnSettingsConfig<TColumnKey>): TablePlugin<T> {
	return {
		transformColumns(columns: TableColumn<T>[]): TableColumn<T>[] {
			const cfg = config();
			const activeSet = new Set(cfg.activeColumnKeys);
			// Build a map for ordering by activeColumnKeys position
			const orderMap = new Map(cfg.activeColumnKeys.map((key, index) => [key, index]));
			return columns
				.filter((col) => activeSet.has(col.key as TColumnKey))
				.sort((a, b) => {
					const orderA = orderMap.get(a.key as TColumnKey) ?? Infinity;
					const orderB = orderMap.get(b.key as TColumnKey) ?? Infinity;
					return orderA - orderB;
				});
		}
	};
}
