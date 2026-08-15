import type { Snippet } from 'svelte';
import type { IconName } from '../icon/icon-registry.js';

/** A single actionable row in data mode. */
export interface DropdownMenuItemData {
	label: string;
	onClick?: () => void;
	isDisabled?: boolean;
	/** A registry name, or a snippet for a custom icon. */
	icon?: Snippet | IconName;
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
	title?: string;
	items: DropdownMenuItemData[];
}

export type DropdownMenuOption =
	DropdownMenuItemData | DropdownMenuDividerData | DropdownMenuSection;
