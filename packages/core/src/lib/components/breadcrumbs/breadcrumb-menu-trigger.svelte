<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { DropdownMenuSize } from '../dropdown-menu/dropdown-menu-item.stylex.js';
	import type { DropdownMenuOption } from '../dropdown-menu/dropdown-menu-types.js';

	/**
	 * Module-private, exactly as upstream's `BreadcrumbMenuTrigger` is: it lives
	 * beside `BreadcrumbItem` in one `.tsx` file there, and Svelte allows one
	 * component per file, so it becomes a sibling that the barrel does not export.
	 */
	interface BreadcrumbMenuTriggerProps {
		/**
		 * Upstream's `ref` — attached to the trigger button, which *is* the item's
		 * content element. `BreadcrumbItem`'s auto-current detection stamps
		 * `aria-current` through it.
		 */
		attachContent: Attachment<HTMLElement>;
		/** The link-styled label content rendered inside the trigger button. */
		children: Snippet;
		/**
		 * Accessible name for the menu surface (the crumb's own label). Only a
		 * string can name the surface — a snippet is opaque, exactly as upstream's
		 * `typeof label === 'string'` check treats a non-text React node.
		 */
		label: Snippet | string;
		menu: DropdownMenuOption[] | Snippet;
		menuSize: DropdownMenuSize;
		isSupporting: boolean;
		isCurrent?: boolean;
	}
</script>

<script lang="ts">
	import PopoverLayer from '../popover/popover-layer.svelte';
	import RenderDropdownItems from '../dropdown-menu/render-dropdown-items.svelte';
	import { setDropdownMenuContext } from '../dropdown-menu/dropdown-menu-context.svelte.js';
	import {
		MENU_BOUNDARY_SELECTOR,
		MENU_ITEM_ROLES,
		MENU_ITEM_SELECTOR
	} from '../dropdown-menu/menu-item-roles.js';
	import Icon from '../icon/icon.svelte';
	import { layerAnimations } from '../layer/layer-animations.stylex.js';
	import { usePopover } from '../popover/use-popover.svelte.js';
	import { useListFocus } from '../../hooks/use-list-focus.svelte.js';
	import { useTypeahead } from '../../hooks/use-typeahead.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { cx } from '../../internal/sx.js';
	import {
		breadcrumbButtonAttrs,
		breadcrumbChevronStyle,
		breadcrumbMenuAttrs,
		breadcrumbMenuPopoverXstyle
	} from './breadcrumb-item.stylex.js';

	/**
	 * The link-styled `<button>` trigger plus its `role="menu"` popover.
	 *
	 * Reuses the DropdownMenu item pipeline (`RenderDropdownItems` for arrays,
	 * the item components for a snippet) inside a `useListFocus` container that
	 * provides `DropdownMenuContext` — the same wiring `ContextMenu` uses — so a
	 * consumer's menu-item definitions are portable into a breadcrumb with no
	 * rewrite.
	 */
	let {
		attachContent,
		children,
		label,
		menu,
		menuSize,
		isSupporting,
		isCurrent = false
	}: BreadcrumbMenuTriggerProps = $props();

	// Upstream mints one `useId` for the menu and lets `usePopover` mint the
	// layer's own inside `useLayer`. `$props.id()` may be called once per
	// component, so both derive from a single uid — `ContextMenu`'s arrangement.
	const uid = $props.id();
	const layerId = `${uid}-layer`;
	const menuId = `${uid}-menu`;

	let buttonEl = $state<HTMLButtonElement | null>(null);

	const popover = usePopover(() => ({
		id: layerId,
		onHide: () => {
			buttonEl?.focus();
		},
		hasLightDismiss: true,
		hasCloseButton: false,
		hasAutoFocus: false,
		// The popup's own role="menu" is the exposed semantics; a modal dialog
		// wrapper would announce an unnamed dialog around the menu.
		role: 'none'
	}));

	function closeMenu(): void {
		popover.hide();
	}

	const list = useListFocus(() => ({
		itemSelector: MENU_ITEM_SELECTOR,
		boundarySelector: MENU_BOUNDARY_SELECTOR,
		wrap: false,
		onEscape: closeMenu
	}));

	const getMenuItems = list.getItems;

	const typeahead = useTypeahead(() => ({
		getItemLabels: () => getMenuItems().map((el) => el.textContent),
		onMatch: list.focusItem,
		getCurrentIndex: () =>
			getMenuItems().findIndex(
				(el) => el === document.activeElement || el.contains(document.activeElement)
			)
	}));

	function listKeyDown(e: KeyboardEvent): void {
		// A submenu flyout renders inline inside this menu; its key events bubble
		// up here. Let that level own them — only handle events from this level.
		if (!list.ownsEvent(e)) {
			return;
		}
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			const focused = document.activeElement as HTMLElement | null;
			if (focused && MENU_ITEM_ROLES.has(focused.getAttribute('role') ?? '')) {
				focused.click();
			}
			return;
		}
		// APG menu-button pattern: Tab closes the menu (items are tabindex="-1").
		if (e.key === 'Tab') {
			closeMenu();
			return;
		}
		if (typeahead.onKeyDown(e)) {
			e.preventDefault();
			return;
		}
		list.handleKeyDown(e);
	}

	function openAndFocus(): void {
		popover.show();
		requestAnimationFrame(() => list.focusFirst());
	}

	function handleClick(): void {
		if (popover.isOpen) {
			popover.hide();
		} else {
			openAndFocus();
		}
	}

	function handleKeyDown(e: KeyboardEvent): void {
		if (!popover.isOpen) {
			if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				openAndFocus();
			}
		}
	}

	setDropdownMenuContext(() => ({ closeMenu, menuSize }));

	const triggerTheme = themeProps('breadcrumb-item-menu-trigger');
	const menuTheme = themeProps('breadcrumb-menu');
	const buttonAttrs = $derived(breadcrumbButtonAttrs(isSupporting));
	const menuAttrs = breadcrumbMenuAttrs();
	const layerXstyle = [breadcrumbMenuPopoverXstyle, layerAnimations.below];
</script>

<button
	bind:this={buttonEl}
	{@attach attachContent}
	{@attach popover.attachTrigger}
	type="button"
	onclick={handleClick}
	onkeydown={handleKeyDown}
	aria-expanded={popover.triggerProps['aria-expanded']}
	aria-haspopup="menu"
	aria-controls={menuId}
	aria-current={isCurrent ? 'page' : undefined}
	{...triggerTheme}
	class={cx(triggerTheme.class, buttonAttrs.class)}
	style={buttonAttrs.style}
>
	{@render children()}
	<Icon icon="chevronDown" size="xsm" color="inherit" xstyle={breadcrumbChevronStyle} />
</button>

<PopoverLayer {popover} placement="below" alignment="start" xstyle={layerXstyle}>
	<div
		{@attach list.attachList}
		id={menuId}
		role="menu"
		aria-label={typeof label === 'string' ? label : undefined}
		onkeydown={listKeyDown}
		{...menuTheme}
		class={cx(menuTheme.class, menuAttrs.class)}
		style={menuAttrs.style}
	>
		{#if Array.isArray(menu)}
			<RenderDropdownItems items={menu} />
		{:else}
			{@render menu()}
		{/if}
	</div>
</PopoverLayer>
