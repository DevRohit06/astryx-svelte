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

/** A horizontal rule between groups. */
export interface DropdownMenuDivider {
	type: 'divider';
}

/** A titled group of items. */
export interface DropdownMenuSection {
	type: 'section';
	title?: string;
	items: DropdownMenuItemData[];
}

export type DropdownMenuOption = DropdownMenuItemData | DropdownMenuDivider | DropdownMenuSection;
