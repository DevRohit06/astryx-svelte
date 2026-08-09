<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { NavHeadingMenuSize } from './nav-menu-context.svelte.js';
	import type { SizeValue } from '../../internal/types.js';

	export interface NavHeadingMenuProps extends BaseProps<HTMLDivElement> {
		/** Menu items (`NavHeadingMenuItem`, dividers, custom content). */
		children: Snippet;

		/**
		 * Size — controls min-width and flows to items for padding.
		 * @default 'md'
		 */
		size?: NavHeadingMenuSize;

		/**
		 * Minimum width override. Takes precedence over size-based defaults.
		 */
		minWidth?: SizeValue;
	}

	/**
	 * Both the roving-focus and typeahead item lists. Disabled items are excluded
	 * by the selector itself, not filtered afterwards — which is what makes
	 * typeahead's index line up with `focusItem`'s (menus-11).
	 */
	const ENABLED_ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])';
</script>

<script lang="ts">
	import { cx, mergeStyle, toCssLength } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useListFocus } from '../../hooks/use-list-focus.svelte.js';
	import { useTypeahead } from '../../hooks/use-typeahead.js';
	import {
		setNavHeadingMenuContext,
		useNavHeadingCloseContext
	} from './nav-menu-context.svelte.js';
	import { navHeadingMenuAttrs } from './nav-heading-menu.stylex.js';

	/**
	 * Accessible menu container for nav heading popovers.
	 *
	 * Provides `role="menu"` with arrow-key navigation (Home/End/Escape) and a
	 * size context that flows to child items for consistent padding. Pass as the
	 * `menu` prop of `SideNavHeading` or `TopNavHeading`.
	 *
	 * The parent heading component injects the close callback via context, so
	 * items automatically dismiss the popover on selection.
	 *
	 * @example
	 * ```svelte
	 * <NavHeadingMenu size="lg">
	 *   <NavHeadingMenuItem label="Dashboard" href="/dashboard" />
	 *   <NavHeadingMenuItem label="Analytics" href="/analytics" />
	 * </NavHeadingMenu>
	 * ```
	 */
	let {
		children,
		size = 'md',
		minWidth,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: NavHeadingMenuProps = $props();

	const closeCtx = useNavHeadingCloseContext();
	const closeMenu = $derived(closeCtx?.().closeMenu);

	const list = useListFocus(() => ({
		itemSelector: ENABLED_ITEM_SELECTOR,
		onEscape: closeMenu
	}));

	// Upstream reads `listRef.current` for the typeahead's item list. `useListFocus`
	// keeps its container private (the attachment is the whole seam), so the same
	// element is captured a second time here rather than widening the hook's return.
	let menuEl: HTMLDivElement | null = null;

	function getMenuItems(): HTMLElement[] {
		return menuEl ? Array.from(menuEl.querySelectorAll<HTMLElement>(ENABLED_ITEM_SELECTOR)) : [];
	}

	// First-character typeahead over the (enabled) menu items (menus-11).
	const typeahead = useTypeahead(() => ({
		getItemLabels: () => getMenuItems().map((el) => el.textContent),
		onMatch: list.focusItem,
		getCurrentIndex: () =>
			getMenuItems().findIndex(
				(el) => el === document.activeElement || el.contains(document.activeElement)
			)
	}));

	/**
	 * Extends `useListFocus` with Enter/Space activation. Items rendered without an
	 * `href` are `<div role="menuitem">` elements, which have no native keyboard
	 * activation — without this, Enter/Space on a focused onClick-only item does
	 * nothing. Anchor items (with `href`) already activate on Enter natively.
	 */
	function listKeyDown(e: KeyboardEvent): void {
		if (e.key === 'Enter' || e.key === ' ') {
			const focused = document.activeElement as HTMLElement | null;
			if (focused?.getAttribute('role') === 'menuitem') {
				e.preventDefault();
				focused.click();
				return;
			}
		}
		if (typeahead.onKeyDown(e)) {
			e.preventDefault();
			return;
		}
		list.handleKeyDown(e);
	}

	setNavHeadingMenuContext(() => ({
		closeMenu: closeMenu ?? (() => {}),
		size
	}));

	const theme = $derived(themeProps('nav-heading-menu', { size }));
	const attrs = $derived(navHeadingMenuAttrs(size, xstyle));
	// Upstream's `{...styleProp, minWidth}` — the override wins over a caller's
	// own `min-width`, so it is serialised last.
	const minWidthStyle = $derived(
		minWidth != null ? `min-width:${toCssLength(minWidth)}` : undefined
	);
</script>

<div
	{...rest}
	bind:this={menuEl}
	{@attach list.attachList}
	role="menu"
	onkeydown={listKeyDown}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined, minWidthStyle)}
>
	{@render children()}
</div>
