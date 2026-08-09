import { Context } from '../../internal/context.js';
import type { TableVerticalAlign } from './table-types.js';

/**
 * Svelte equivalent of Astryx's `Table/TableContext.ts`.
 *
 * `TableRow`, `TableCell` and `TableHeaderCell` read the enclosing table's
 * appearance configuration. Stored as a **getter** so a cell re-reads a changing
 * `density`/`dividers`, where upstream re-renders on the memoised value.
 *
 * The context is *optional* and deliberately so: upstream's `use(TableContext)`
 * yields `null` outside a `<Table>` and every consumer renders a bare, unstyled
 * element in that case — a `<TableCell>` dropped into a hand-written `<table>`
 * still works. `getOr(null)` is the exact counterpart.
 */

export interface TableContextValue {
	density: 'compact' | 'balanced' | 'spacious';
	dividers: 'rows' | 'columns' | 'grid' | 'none';
	isStriped: boolean;
	hasHover: boolean;
	verticalAlign: TableVerticalAlign;
	textOverflow: 'wrap' | 'truncate';
}

/**
 * Published, as upstream publishes its `TableContext` from `Table/index.ts`.
 * A `Context` (`internal/context.ts`) is the value counterpart of a React context object, and
 * this barrel already exports ten of them (`SizeContext`, `RadioListContext`,
 * `ThemeContext`, …). The *reader* is what stays private here — upstream has a
 * `useTableContext` too (in `useTableCellStyles.ts`) and deliberately keeps it
 * off its barrel.
 */
export const TableContext: Context<() => TableContextValue> = new Context<() => TableContextValue>(
	'astryx.table'
);

export function setTableContext(get: () => TableContextValue): void {
	TableContext.set(get);
}

/**
 * Read the table context. Returns `null` when outside a `Table`, signalling
 * that the component should render unstyled.
 */
export function useTableContext(): (() => TableContextValue) | null {
	return TableContext.getOr(null);
}
