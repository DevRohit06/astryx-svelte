import type { TableColumn } from '../../table-types.js';
import type { TranslatorFn } from '../../../../i18n/use-translator.svelte.js';

/**
 * The pure helpers Astryx declares at module scope in
 * `Table/plugins/sortable/useTableSortable.tsx`. Split out so both the hook and
 * `sort-header-button.svelte` can reach them — a `.svelte` file cannot import
 * from a module that imports `@stylexjs/stylex`'s authoring API in this port,
 * and keeping them here also keeps the hook free of markup concerns.
 *
 * Transcribed verbatim; there is no React in any of them.
 */

/** Sort direction for a single column. */
export type TableSortDirection = 'ascending' | 'descending';

/** A single sort entry in the sort state array. */
export interface TableSortEntry<TSortKey extends string = string> {
	/** The sort key identifying which column (or derived value) to sort by. */
	sortKey: TSortKey;
	/** The sort direction. */
	direction: TableSortDirection;
}

/**
 * Complete sort state — an ordered array of sort entries.
 * The first entry is the primary sort; subsequent entries are tiebreakers.
 * Empty array = no sort applied.
 *
 * @example
 * ```ts
 * const sort: TableSortState = [
 *   { sortKey: 'name', direction: 'ascending' },
 *   { sortKey: 'age', direction: 'descending' }
 * ];
 * ```
 */
export type TableSortState<TSortKey extends string = string> = TableSortEntry<TSortKey>[];

export function resolveSortKey<T extends Record<string, unknown>>(
	column: TableColumn<T>
): string | null {
	const { sortable } = column;
	if (!sortable) {
		return null;
	}
	if (sortable === true) {
		return column.key;
	}
	return sortable.sortKey ?? column.key;
}

export function getHeaderLabel<T extends Record<string, unknown>>(column: TableColumn<T>): string {
	const { header } = column;
	if (typeof header === 'string') {
		return header;
	}
	return column.key;
}

/**
 * The sort header button's accessible name.
 *
 * Routed through the translator rather than interpolated in English, so these
 * announce in the app's language like the sort *menu* labels already did. The
 * direction word resolves through its own key instead of interpolating the raw
 * enum value — English output is unchanged.
 */
export function buildAriaLabel<T extends Record<string, unknown>>(
	t: TranslatorFn,
	column: TableColumn<T>,
	direction: TableSortDirection | null,
	rank: number | null,
	total: number
): string {
	const label = getHeaderLabel(column);
	if (direction == null) {
		return t('@astryx.table.sort.sortBy', { label });
	}
	const directionLabel =
		direction === 'ascending'
			? t('@astryx.table.sort.direction.ascending')
			: t('@astryx.table.sort.direction.descending');
	if (rank != null && total > 1) {
		return t('@astryx.table.sort.sortedByWithPriority', {
			label,
			direction: directionLabel,
			rank,
			total
		});
	}
	return t('@astryx.table.sort.sortedBy', { label, direction: directionLabel });
}

export function getNextDirection(
	current: TableSortDirection | null,
	allowUnsortedState: boolean
): TableSortDirection | null {
	if (current == null) {
		return 'ascending';
	}
	if (current === 'ascending') {
		return 'descending';
	}
	// current === 'descending'
	return allowUnsortedState ? null : 'ascending';
}
