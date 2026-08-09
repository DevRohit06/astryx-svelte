import { Context } from '../../internal/context.js';
import type { DropdownMenuSize } from './dropdown-menu-item.stylex.js';

/**
 * Ported from Astryx's `DropdownMenu/DropdownMenuContext.tsx`.
 *
 * Provided by `DropdownMenu`, read by its items so a selection can close the
 * menu and each item can size itself to the trigger. Stored as a getter, per the
 * port's context convention, so `menuSize` stays reactive.
 *
 * Upstream publishes the raw `DropdownMenuContext` object from 0.2.0 on, with
 * the note "public so consumers can build custom menu items", so this one is
 * published too — a Svelte `Context` is the equivalent value, and the barrel
 * already ships ten of them (`AppShellMobileContext`, `ThemeContext`, …).
 */

export interface DropdownMenuContextValue {
	/** Close the menu and return focus to the trigger. */
	closeMenu: () => void;
	/** The menu's size, from the trigger button. */
	menuSize: DropdownMenuSize;
}

export const DropdownMenuContext = new Context<() => DropdownMenuContextValue>(
	'astryx.dropdownMenu'
);

export function setDropdownMenuContext(get: () => DropdownMenuContextValue): void {
	DropdownMenuContext.set(get);
}

/** A getter for the enclosing menu's context, or `null` outside one. */
export function useDropdownMenuContext(): () => DropdownMenuContextValue | null {
	return DropdownMenuContext.getOr(() => null);
}

// =============================================================================
// Radio group coordination
// =============================================================================

export interface DropdownMenuRadioGroupContextValue {
	/** The currently selected value in the group. */
	value: string | undefined;
	/** Select a value. Called by a `DropdownMenuRadioItem` on activation. */
	onChange: (value: string) => void;
	/** Whether selecting an item should close the menu. @default true */
	hasCloseOnSelect: boolean;
}

const radioGroupContext = new Context<() => DropdownMenuRadioGroupContextValue>(
	'astryx.dropdownMenuRadioGroup'
);

export function setDropdownMenuRadioGroupContext(
	get: () => DropdownMenuRadioGroupContextValue
): void {
	radioGroupContext.set(get);
}

/**
 * Read the enclosing radio group's selection state. Returns a getter yielding
 * `null` outside a `DropdownMenuRadioGroup`, which is what lets
 * `DropdownMenuRadioItem` throw upstream's error.
 */
export function useDropdownMenuRadioGroupContext(): () => DropdownMenuRadioGroupContextValue | null {
	return radioGroupContext.getOr(() => null);
}
