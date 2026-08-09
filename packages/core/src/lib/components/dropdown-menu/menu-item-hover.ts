/**
 * Ported from Astryx's `DropdownMenu/menuItemHover.ts`.
 *
 * Menus keep a single highlighted item by using DOM focus as the sole
 * highlight source. Mouse hover moves focus onto the pointed-at item so the
 * one focus highlight follows the pointer — instead of a separate `:hover`
 * background leaving the keyboard-focused item highlighted at the same time.
 *
 * Used by `DropdownMenuItem`, `DropdownMenuCheckboxItem`,
 * `DropdownMenuRadioItem` and `DropdownMenuSubMenu`'s trigger row.
 */

/**
 * Move focus to a menu item as the pointer moves over it, so hover and
 * keyboard navigation share a single focus-driven highlight. Only reacts to a
 * real mouse (not touch/pen, which have no hover), and skips disabled items.
 */
export function focusMenuItemOnHover(e: PointerEvent, isDisabled?: boolean): void {
	if (isDisabled || e.pointerType !== 'mouse') {
		return;
	}
	const el = e.currentTarget as HTMLElement | null;
	if (!el) {
		return;
	}
	if (el !== el.ownerDocument.activeElement) {
		el.focus();
	}
}
