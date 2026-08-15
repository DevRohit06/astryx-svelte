import type { Snippet } from 'svelte';
import type { DropdownMenuItemProps } from './dropdown-menu-item.svelte';

/**
 * Data-mode shape for one menu row.
 *
 * The item fields are sourced from `DropdownMenuItemProps` — data mode renders
 * through `DropdownMenuItem`, so the two APIs describe the same thing and must
 * not drift. Only the fields listed here are part of the data API; add a key to
 * the `Pick` to expose more of the item's props to `items`.
 */
export interface DropdownMenuItemData extends Pick<
	DropdownMenuItemProps,
	'icon' | 'onClick' | 'isDisabled' | 'variant' | 'description' | 'endContent' | 'hasCloseOnSelect'
> {
	/**
	 * Stable identity for the row, used as its keyed-`{#each}` key (as on
	 * `TreeListItemData`). Omit it and the row is keyed by position, which is
	 * correct for a fixed menu; set it when `items` can reorder, filter, or grow,
	 * so a row keeps its DOM node — and therefore keyboard focus — as the array
	 * changes around it.
	 */
	id?: string;
	/** Primary label content. */
	label: string | Snippet;
	/**
	 * Nested submenu entries. When present, this row becomes a submenu (a
	 * flyout revealing `items`) instead of a leaf action — no separate item
	 * "type" is needed. Data-mode parity for the compound `DropdownMenuSubMenu`
	 * API.
	 */
	items?: DropdownMenuOption[];
}

/**
 * A horizontal rule between groups, as a `items` data entry.
 *
 * **Renamed from `DropdownMenuDivider` at upstream 0.4.0.** The bare name now
 * belongs to the compound-mode component, and TypeScript cannot re-export a
 * value and a type under one name from a single barrel — so the data-mode
 * option type takes the `Data` suffix its sibling `DropdownMenuItemData`
 * already carried. A missed import fails at compile time rather than silently.
 */
export interface DropdownMenuDividerData {
	type: 'divider';
}

/** A titled group of items. */
export interface DropdownMenuSection {
	type: 'section';
	/** Stable identity for the group; see {@link DropdownMenuItemData.id}. */
	id?: string;
	title?: string;
	items: DropdownMenuItemData[];
}

export type DropdownMenuOption =
	DropdownMenuItemData | DropdownMenuDividerData | DropdownMenuSection;
