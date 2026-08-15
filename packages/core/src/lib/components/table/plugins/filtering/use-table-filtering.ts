import { createSlotBinder } from '../../../../internal/bind-snippet.js';
import { withProps } from '../../../../internal/with-props.js';
import { proportional } from '../../column-utils.js';
import type { HeaderCellRenderProps, TableColumn, TablePlugin } from '../../table-types.js';
import FilteringScope from './filtering-scope.svelte';
import {
	filterAfter,
	filterBelow,
	type FilterAfterArg,
	type FilterBelowArg
} from './filtering-slots.svelte';
import type {
	FilterValue,
	OperatorValue,
	PowerSearchConfig,
	PowerSearchField,
	PowerSearchFilter,
	PowerSearchOperator
} from '../../../power-search/types.js';

/**
 * Ported from Astryx's `Table/plugins/filtering/useTableFiltering.tsx`.
 *
 * The pure resolution layer — `resolveOperator`, `resolveFilterConfig`,
 * `toSearchFilters`, `tableValueToFilterValue` — transcribes verbatim, switch
 * arms and all. What changes is everything that touched React:
 *
 * - **`config` is a getter.** Upstream keeps `configRef.current = config` on
 *   every render and reads it through a `useMemo`'d `FilterStore` so the plugin
 *   object can stay referentially stable while the config it sees stays fresh.
 *   A closure over a getter is already both, so `configRef`, `storeRef`, the
 *   `FilterStore` interface and the outer `useMemo` all go. The plugin object is
 *   built once, for the component's lifetime.
 * - **`variant` is read at call time, not captured.** Upstream computes
 *   `config.variant ?? 'popover'` per render and lists it in the `useMemo`
 *   dependency array, so changing it produces a *new plugin object*. Here the
 *   object is built once and each transform reads the variant through the
 *   getter — same observable behaviour, and it has to be that way: batch 11's
 *   contract note says a plugin must return a **stable** component reference
 *   from `transformTableContext` or the table remounts, so `provider` is bound
 *   once, outside the transform.
 * - **`transformColumns` is always present and no-ops for `popover`.** Upstream
 *   sets the member to `undefined` in that variant, which it can do because the
 *   plugin object is rebuilt when the variant changes. A single object cannot,
 *   so the branch moves inside. `applyPlugins` runs it and gets its input back.
 * - **The two markup slots are keyed bound snippets.** Upstream fills `after:`
 *   and `below:` with JSX closing over the column, the resolved operator value
 *   and whatever a prior plugin left in the slot. All three are per-cell data
 *   that no context can carry, so they travel through `createSlotBinder`, keyed
 *   by `column.key` — see `filtering-slots.svelte` and
 *   `internal/bind-snippet.ts`. The keying is what keeps a filter input's focus
 *   and caret across a keystroke: `{@render}` branches on the bound snippet's
 *   function identity, so an unkeyed binding would replace the input the user is
 *   typing into on every transform. One binder per source snippet — sharing one
 *   between `filterAfter` and `filterBelow` would let a column's `after` key
 *   collide with its `below` key and serve the wrong markup.
 * - **`transformTableContext` returns a component**, not wrapped children.
 *   Svelte reads context at component init; `filtering-scope.svelte` carries
 *   both of upstream's context providers and `withProps` binds the hook's state
 *   onto it.
 *
 * The React-only `'use client'` directive has no counterpart and is dropped, as
 * everywhere else in this port.
 */

// =============================================================================
// Filter Value Types
// =============================================================================

/** Union of all filter value types (text=string, number=number, enum/list=string[]) */
export type TableFilterValue = string | number | string[];

/**
 * Reference to a PowerSearch field.
 * Instead of defining the filter inline, point to a field in a shared
 * `PowerSearchConfig`. The plugin resolves the operator's value type
 * and renders the appropriate control.
 *
 * - **String form** — field key only, uses the field's `defaultOperator`:
 *   `filter: 'status'`
 *
 * - **Object form** — field key + explicit operator:
 *   `filter: { field: 'status', operator: 'is_not' }`
 *
 * Both require `searchConfig` on the plugin config.
 */
export interface TableFilterFieldRef {
	/** Key of the PowerSearchField in the searchConfig. */
	field: string;
	/**
	 * Key of the operator on that field. When omitted, uses the field's
	 * `defaultOperator` or the first operator.
	 */
	operator?: string;
}

// =============================================================================
// PowerSearch → Table Filter Resolution
// =============================================================================

/**
 * Resolve the operator for a PowerSearch field.
 * Uses the specified operator key, the field's defaultOperator, or the first.
 */
function resolveOperator(
	field: PowerSearchField,
	operatorKey?: string
): PowerSearchOperator | undefined {
	if (operatorKey) {
		return field.operators.find((o) => o.key === operatorKey);
	}
	if (field.defaultOperator) {
		return field.operators.find((o) => o.key === field.defaultOperator);
	}
	return field.operators[0];
}

/**
 * Resolve a column's filter field reference to a concrete OperatorValue.
 *
 * - String → field key, uses defaultOperator.
 * - Object with `field` → look up field + optional operator.
 * - Returns undefined if the field/operator can't be resolved.
 */
function resolveFilterConfig(
	filter: TableFilterFieldRef | string,
	searchConfig: PowerSearchConfig
): OperatorValue | undefined {
	const fieldKey = typeof filter === 'string' ? filter : filter.field;
	const operatorKey = typeof filter === 'string' ? undefined : filter.operator;

	const field = searchConfig.fields.find((f) => f.key === fieldKey);
	if (!field) {
		return undefined;
	}

	const operator = resolveOperator(field, operatorKey);
	if (!operator) {
		return undefined;
	}

	return operator.value;
}

/**
 * Convert table filter state to PowerSearchFilter[] for use with `applyFilters`.
 *
 * Maps each non-empty entry in the filter state to a `PowerSearchFilter`,
 * resolving the field and operator from the column config + searchConfig.
 * This bridges the table filtering UI with PowerSearch's client-side
 * filter engine — define filters once, apply everywhere.
 *
 * @example
 * ```ts
 * const searchFilters = toSearchFilters(filters, columns, config);
 * const filteredData = applyFilters(searchFilters, data);
 * ```
 */
export function toSearchFilters<_T extends Record<string, unknown>>(
	filters: TableFilterState,
	columns: ReadonlyArray<{
		key: string;
		filter?: TableFilterFieldRef | string;
	}>,
	searchConfig: PowerSearchConfig
): PowerSearchFilter[] {
	const result: PowerSearchFilter[] = [];

	for (const col of columns) {
		if (!col.filter) {
			continue;
		}
		const value = filters[col.key];
		if (value == null) {
			continue;
		}

		const fieldKey = typeof col.filter === 'string' ? col.filter : col.filter.field;
		const operatorKey = typeof col.filter === 'string' ? undefined : col.filter.operator;

		const field = searchConfig.fields.find((f) => f.key === fieldKey);
		if (!field) {
			continue;
		}

		const operator = resolveOperator(field, operatorKey);
		if (!operator) {
			continue;
		}

		const filterValue = tableValueToFilterValue(value, operator.value);
		if (!filterValue) {
			continue;
		}

		result.push({ field: fieldKey, operator: operator.key, value: filterValue });
	}

	return result;
}

/**
 * Convert a table filter value to a PowerSearch FilterValue
 * based on the operator's value type.
 */
function tableValueToFilterValue(
	value: TableFilterValue,
	opValue: OperatorValue
): FilterValue | undefined {
	switch (opValue.type) {
		case 'string':
			return typeof value === 'string' ? { type: 'string', value } : undefined;
		case 'integer':
			return typeof value === 'number' ? { type: 'integer', value } : undefined;
		case 'float':
			return typeof value === 'number' ? { type: 'float', value } : undefined;
		case 'enum':
			return typeof value === 'string' ? { type: 'enum', value } : undefined;
		case 'enum_list':
			return Array.isArray(value) ? { type: 'enum_list', value: value } : undefined;
		case 'date_absolute':
			return typeof value === 'string'
				? {
						type: 'date_absolute',
						unixSeconds: Math.floor(new Date(value).getTime() / 1000)
					}
				: undefined;
		case 'time':
			return typeof value === 'string' ? { type: 'time', value } : undefined;
		case 'string_list':
			return Array.isArray(value) ? { type: 'string_list', value: value } : undefined;
		case 'entity_list':
			return Array.isArray(value)
				? {
						type: 'entity_list',
						value: value.map((id) => ({ id, label: id }))
					}
				: undefined;
		case 'nested':
		case 'empty':
		case 'date_relative':
		case 'date_range':
		case 'custom':
			return undefined;
	}
}

// =============================================================================
// Filter State
// =============================================================================

/**
 * Complete filter state — a map from column key to filter value.
 * Missing keys or `undefined` values mean "no filter applied" for that column.
 *
 * @example
 * ```ts
 * const filters: TableFilterState = {
 *   name: 'alice',
 *   status: 'active',
 *   tags: ['admin', 'user']
 * };
 * ```
 */
export type TableFilterState = Record<string, TableFilterValue | undefined>;

/**
 * Display variant for the filter UI.
 *
 * - `'popover'` — filter icon in header; clicking opens a popover with the filter control
 * - `'inline'` — filter control rendered directly below header text inside the header cell
 * - `'inline-compact'` — same as inline but with compact-sized controls
 */
export type TableFilterVariant = 'popover' | 'inline' | 'inline-compact';

// =============================================================================
// Hook Config
// =============================================================================

/**
 * Configuration for {@link useTableFiltering}.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const filterState = useTableFilterState();
 *   const filterPlugin = useTableFiltering(() => ({
 *     filters: filterState.filters,
 *     onFilterChange: filterState.onFilterChange,
 *     variant: 'inline',
 *     searchConfig
 *   }));
 * </script>
 * <Table plugins={[filterPlugin]} {columns} {data} />
 * ```
 */
export interface UseTableFilteringConfig {
	/** Current filter state — map from column key to filter value. */
	filters: TableFilterState;
	/** Called when the user changes a filter value. `null` clears the filter. */
	onFilterChange: (columnKey: string, value: TableFilterValue | null) => void;
	/**
	 * Display variant for filter controls.
	 *
	 * @default 'popover'
	 */
	variant?: TableFilterVariant;
	/**
	 * PowerSearch configuration that defines the available filter fields.
	 * Columns reference fields by key; the plugin resolves the operator's
	 * value type and renders the matching control.
	 */
	searchConfig: PowerSearchConfig;
}

// =============================================================================
// Helper
// =============================================================================

function getHeaderString(column: TableColumn<Record<string, unknown>>): string {
	if (typeof column.header === 'string') {
		return column.header;
	}
	return column.key;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * `useTableFiltering` — table plugin for column filtering.
 *
 * Returns a stable `TablePlugin` that transforms header cells to add
 * filter controls. Follows the headless pattern: consumer owns filter state,
 * plugin provides UI and interaction.
 *
 * Filter types are configured per-column via the `filter` field on
 * `TableColumn`. The plugin reads filter config from columns and
 * renders the appropriate control (text input, selector, etc.).
 *
 * @template T - Row data type
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const filterState = useTableFilterState();
 *   const filterPlugin = useTableFiltering(() => ({
 *     filters: filterState.filters,
 *     onFilterChange: filterState.onFilterChange,
 *     variant: 'popover',
 *     searchConfig
 *   }));
 * </script>
 * <Table
 *   data={users}
 *   columns={[
 *     { key: 'name', header: 'Name', filter: 'name' },
 *     { key: 'status', header: 'Status', filter: 'status' }
 *   ]}
 *   plugins={[filterPlugin]}
 * />
 * ```
 */
export function useTableFiltering<T extends Record<string, unknown>>(
	config: () => UseTableFilteringConfig
): TablePlugin<T> {
	const variant = (): TableFilterVariant => config().variant ?? 'popover';

	// Bound once, not per `transformTableContext()` call: a provider whose
	// component *reference* changes tears down and rebuilds the table's whole
	// subtree (port/todo.md, batch 11). Upstream can afford to rebuild its plugin
	// object when `variant` changes because React re-uses the element type; here
	// the variant travels into the provider as a getter instead.
	const provider = withProps(FilteringScope, { config, variant });

	// Bound once per hook call, keyed by column, and one binder per source
	// snippet: a filter control must keep its element identity across a filter
	// change, or typing into it destroys the input that has focus. See
	// `createSlotBinder`'s note.
	const bindAfter = createSlotBinder<FilterAfterArg>(filterAfter);
	const bindBelow = createSlotBinder<FilterBelowArg>(filterBelow);

	return {
		// For inline variants, upgrade columns with filters and no explicit width
		// to proportional(1) so they get a default minWidth from the width resolver.
		// Without this, inline filter inputs can collapse to unusable sizes.
		transformColumns(columns: TableColumn<T>[]) {
			const v = variant();
			if (v !== 'inline' && v !== 'inline-compact') {
				return columns;
			}
			return columns.map((col) => {
				if (col.filter != null && col.width == null) {
					return { ...col, width: proportional(1) };
				}
				return col;
			});
		},

		transformTableContext() {
			return provider;
		},

		transformHeaderCell(
			props: HeaderCellRenderProps,
			column: TableColumn<T>
		): HeaderCellRenderProps {
			const rawFilter = column.filter;
			const header = getHeaderString(column as TableColumn<Record<string, unknown>>);

			// Resolve field references to concrete OperatorValue
			const operatorValue = rawFilter
				? resolveFilterConfig(rawFilter, config().searchConfig)
				: undefined;

			if (variant() === 'popover') {
				// No operator value on this column — nothing to render.
				if (!operatorValue) {
					return props;
				}

				const prior = props.after;

				return {
					...props,
					after: bindAfter(column.key, () => ({
						prior,
						columnKey: column.key,
						header,
						operatorValue
					}))
				};
			}

			// Inline or inline-compact: render filter controls below the header
			// label row. Uses the `below` slot so controls sit underneath the
			// header content rather than inline after it.
			const prior = props.below;

			return {
				...props,
				below: bindBelow(column.key, () => ({
					prior,
					columnKey: column.key,
					header,
					operatorValue
				}))
			};
		}
	};
}
