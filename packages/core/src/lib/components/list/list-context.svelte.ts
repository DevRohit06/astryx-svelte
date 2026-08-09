import { Context } from '../../internal/context.js';

/**
 * Svelte equivalent of Astryx's `List/ListContext.tsx`. A `ListItem` reads the
 * enclosing list's density, divider mode and marker style.
 *
 * Stored as a **getter** so an item re-reads a changing `density`/`listStyle`,
 * where upstream re-renders on the memoised context value. The context is
 * *optional*: upstream's `use(ListContext)` yields `null` outside a `<List>` and
 * `ListItem` falls back to `balanced` / no dividers / no markers, so a bare
 * `<ListItem>` still renders. `ListContext` is module-private upstream (the
 * barrel exports only the two components and their prop types), so it is not
 * re-exported here either.
 */
export type ListDensity = 'compact' | 'balanced' | 'spacious';
export type ListMarkerStyle = 'none' | 'disc' | 'decimal' | 'circle';

export interface ListContextValue {
	density: ListDensity;
	hasDividers: boolean;
	listStyle: ListMarkerStyle;
}

const ListContext = new Context<() => ListContextValue>('astryx.list');

export function setListContext(get: () => ListContextValue): void {
	ListContext.set(get);
}

/** Returns the enclosing list's getter, or `null` for an item rendered alone. */
export function useList(): (() => ListContextValue) | null {
	return ListContext.getOr(null);
}
