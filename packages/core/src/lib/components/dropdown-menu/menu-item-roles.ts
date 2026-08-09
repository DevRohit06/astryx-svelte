/**
 * Ported from Astryx's `DropdownMenu/menuItemRoles.ts`.
 *
 * The selectable items (`menuitemradio`/`menuitemcheckbox`) sit alongside plain
 * `menuitem` so every row is reachable by arrow keys, typeahead, and Enter/Space
 * — not just `role="menuitem"`. (The selectable rows themselves land with the
 * checkbox/radio items; the roles are kept here so the selector stays in sync,
 * matching upstream's source.)
 */

export const MENU_ITEM_ROLES: ReadonlySet<string> = new Set([
	'menuitem',
	'menuitemradio',
	'menuitemcheckbox'
]);

export const MENU_ITEM_SELECTOR: string = [...MENU_ITEM_ROLES]
	.map((role) => `[role="${role}"]:not([aria-disabled="true"])`)
	.join(',');

/**
 * Boundary selector for a single menu level. A menu and its submenu flyouts
 * both use `role="menu"`, and flyouts render inline (native popover, not a
 * portal), so a nested menu's items and key events would otherwise be picked
 * up by the parent. Pass this as `useListFocus`'s `boundarySelector` so each
 * level scopes item collection and key handling to its own container.
 */
export const MENU_BOUNDARY_SELECTOR = '[role="menu"]';
