import { Context } from 'runed';
import type { SearchableItem } from '../typeahead/types.js';

/**
 * Ported from Astryx's `CommandPalette/CommandPaletteContext.ts`.
 *
 * Stored as a **getter**, per the port's context convention: every field here
 * changes on a keystroke, and a stored value would freeze the sub-components at
 * whatever the palette held when they mounted.
 *
 * Optional on both sides — `createContext(null)` upstream, `getOr(null)` here —
 * because every sub-component is documented as usable standalone.
 */
export interface CommandPaletteContextValue {
	/** Current search query. */
	search: string;
	/** Update the search query. */
	setSearch: (search: string) => void;
	/** Currently selected value. */
	value: string;
	/** Update the selected value. */
	setValue: (value: string) => void;
	/** Unique ID prefix for ARIA (listbox id). */
	listId: string;
	/** Index-based highlight from useCombobox. -1 = none. */
	highlightedIndex: number;
	/** Update highlighted index. */
	setHighlightedIndex: (index: number) => void;
	/** Get the DOM id for an item by its flat index. */
	getItemId: (index: number) => string;
	/** Flat list of selectable items in DOM order (after grouping/filtering). */
	selectableItems: { value: string; label?: string; disabled?: boolean }[];
	/** The search result items (typed). */
	searchResults: SearchableItem[];
	/** Select an item by value and close. */
	selectItem: (value: string) => void;
	/** Keyboard handler from useCombobox — attach to the input. */
	onKeyDown: (e: KeyboardEvent) => void;
	/** Close the palette. */
	onClose: () => void;
	/** Whether the palette is open (for aria-expanded). */
	isOpen: boolean;
	/** Whether an async search is in flight. */
	isBusy: boolean;
}

const commandPaletteContext = new Context<() => CommandPaletteContextValue>(
	'astryx.command-palette'
);

export function setCommandPaletteContext(get: () => CommandPaletteContextValue): void {
	commandPaletteContext.set(get);
}

/**
 * Access the command palette context.
 * Returns null when used outside a CommandPalette (for standalone usage).
 */
export function useCommandPaletteContext(): (() => CommandPaletteContextValue) | null {
	return commandPaletteContext.getOr(null);
}
