<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	/** An item in the `TopNav` overflow menu. */
	export interface TopNavMenuItemData {
		/** Display title for the menu item. */
		title: string;
		/** Optional description text displayed below the title. */
		description?: string;
		/** Optional icon displayed to the left. */
		icon?: Snippet;
		/** URL to navigate to when clicked. */
		href?: string;
		/** Callback when the item is clicked. */
		onclick?: () => void;
	}

	export interface TopNavMenuProps extends BaseProps<HTMLButtonElement> {
		/** The visible label for the nav item trigger. */
		label: string;
		/** Menu items to display in the hover popover. */
		items: TopNavMenuItemData[];
		/**
		 * Delay before showing the menu on hover (ms).
		 * @default 150
		 */
		delay?: number;
		/**
		 * Delay before hiding the menu after the mouse leaves (ms).
		 * @default 200
		 */
		hideDelay?: number;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useMenuHover } from '../../internal/use-menu-hover.svelte.js';
	import { useListFocus } from '../../hooks/use-list-focus.svelte.js';
	import { useTypeahead } from '../../hooks/use-typeahead.js';
	import { useAppShellMobile } from '../app-shell/app-shell-mobile-context.svelte.js';
	import { useIcon } from '../icon/use-icon.svelte.js';
	import { useLinkComponent } from '../link/link-context.svelte.js';
	import LinkElement from '../link/link-element.svelte';
	import PopoverLayer from '../popover/popover-layer.svelte';
	import { usePopover } from '../popover/use-popover.svelte.js';
	import { useTopNavSlot } from './top-nav-context.svelte.js';
	import {
		topNavMenuChevronAttrs,
		topNavMenuContainerAttrs,
		topNavMenuDrawerChevronAttrs,
		topNavMenuDrawerHeaderAttrs,
		topNavMenuDrawerItemAttrs,
		topNavMenuDrawerItemDescriptionAttrs,
		topNavMenuDrawerItemIconAttrs,
		topNavMenuDrawerItemTextAttrs,
		topNavMenuDrawerItemsAttrs,
		topNavMenuDrawerItemsInnerAttrs,
		topNavMenuDrawerSectionAttrs,
		topNavMenuItemAttrs,
		topNavMenuItemContentAttrs,
		topNavMenuItemDescriptionAttrs,
		topNavMenuItemIconAttrs,
		topNavMenuItemTitleAttrs,
		topNavMenuTriggerAttrs,
		topNavMenuOffset
	} from './top-nav-menu.stylex.js';
	import { useTopNavRenderMode } from './top-nav-render-context.svelte.js';

	/**
	 * A `TopNav` item that opens a menu of rich rows — icon tile, title,
	 * optional description — on hover or click.
	 *
	 * Three shapes, picked by `TopNavRenderContext`:
	 * - `'default'`: the desktop popover, aligned to the slot the item sits in.
	 * - `'mobile-bar'`: nothing at all.
	 * - `'drawer'`: an inline collapsible section, animated with a
	 *   `grid-template-rows: 0fr → 1fr` disclosure.
	 *
	 * **Rest props reach the desktop trigger, where upstream drops them.**
	 * `TopNavMenuProps extends BaseProps<HTMLButtonElement>` on both sides, but
	 * upstream destructures a closed five-prop list with no spread, so every
	 * `id`/`aria-*`/handler its type promises is silently discarded. We forward
	 * onto the element the type names, as `DropdownMenu` and `Timestamp` already
	 * do. The drawer and mobile-bar branches render no such button, so nothing is
	 * forwarded there — see TODO.md → Known debts.
	 *
	 * @example
	 * ```svelte
	 * <TopNavMenu
	 *   label="Products"
	 *   items={[{ title: 'Analytics', description: 'Track behaviour', href: '/a' }]}
	 * />
	 * ```
	 */
	let {
		label,
		items,
		delay = 150,
		hideDelay = 200,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: TopNavMenuProps = $props();

	const menuId = $props.id();
	const renderMode = useTopNavRenderMode();

	const chevronIcon = useIcon(() => 'chevronDown');
	const appShellMobile = useAppShellMobile();
	const resolveLink = useLinkComponent();
	const linkResolved = $derived(resolveLink());
	const slot = useTopNavSlot();

	let drawerExpanded = $state(false);

	const popover = usePopover(() => ({
		id: menuId,
		// The popup's own role="menu" is the exposed semantics; a modal dialog
		// wrapper would announce an unnamed dialog around the menu and make the
		// trigger claim aria-haspopup="dialog" for menu content (see TabMenu). This
		// used to pass `dialogLabel`, which is exactly the wrapper 0.1.9 removed.
		role: 'none',
		xstyle: topNavMenuOffset
	}));

	const menuHover = useMenuHover(() => ({
		show: popover.show,
		hide: popover.hide,
		isOpen: popover.isOpen,
		isEnabled: true,
		showDelay: delay,
		hideDelay
	}));

	// The desktop popup is a composite menu widget per the APG menu pattern: a
	// single roving tab stop with ArrowUp/ArrowDown traversal (wrapping), Home/End
	// and first-character typeahead. The hook owns item tabindex — items render
	// `tabindex={-1}` and exactly one is promoted to 0. The composition mirrors
	// `NavHeadingMenu`, as upstream's does.
	const list = useListFocus(() => ({
		itemSelector: '[role="menuitem"]',
		hasRovingTabIndex: true,
		onEscape: popover.hide
	}));

	// Upstream reads `listRef.current` for the typeahead's item list, which is the
	// *same* ref it gives roving focus (`mergeRefs(menuRef, listRef)`) — one
	// element, read twice. `list.getItems()` is the counterpart to that, and it
	// exists for exactly this: building typeahead targets from the same source of
	// truth as roving focus rather than re-querying. With no `boundarySelector`
	// and the same `itemSelector`, a second query would return a byte-identical
	// array.
	const typeahead = useTypeahead(() => ({
		getItemLabels: () => list.getItems().map((el) => el.textContent),
		onMatch: list.focusItem,
		getCurrentIndex: () =>
			list
				.getItems()
				.findIndex((el) => el === document.activeElement || el.contains(document.activeElement))
	}));

	/**
	 * Extends `useListFocus` with Enter/Space activation. Items rendered without an
	 * `href` are `<div role="menuitem">` elements, which have no native keyboard
	 * activation — without this, Enter/Space on a focused onClick-only item does
	 * nothing. Anchor items (with `href`) already activate on Enter natively.
	 */
	function menuKeyDown(e: KeyboardEvent): void {
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

	const isDrawer = $derived(renderMode() === 'drawer');
	const isMobileBar = $derived(renderMode() === 'mobile-bar');

	const theme = themeProps('top-nav-menu');
	const triggerAttrs = $derived(topNavMenuTriggerAttrs(popover.isOpen, xstyle));
	const chevronAttrs = $derived(topNavMenuChevronAttrs(popover.isOpen));
	const containerAttrs = topNavMenuContainerAttrs();
	const rowAttrs = topNavMenuItemAttrs();
	const rowIconAttrs = topNavMenuItemIconAttrs();
	const rowContentAttrs = topNavMenuItemContentAttrs();
	const rowTitleAttrs = topNavMenuItemTitleAttrs();
	const rowDescriptionAttrs = topNavMenuItemDescriptionAttrs();

	const drawerSectionAttrs = topNavMenuDrawerSectionAttrs();
	const drawerHeaderAttrs = topNavMenuDrawerHeaderAttrs();
	const drawerChevronAttrs = $derived(topNavMenuDrawerChevronAttrs(drawerExpanded));
	const drawerItemsAttrs = $derived(topNavMenuDrawerItemsAttrs(drawerExpanded));
	const drawerItemsInnerAttrs = topNavMenuDrawerItemsInnerAttrs();
	const drawerItemAttrs = topNavMenuDrawerItemAttrs();
	const drawerItemIconAttrs = topNavMenuDrawerItemIconAttrs();
	const drawerItemTextAttrs = topNavMenuDrawerItemTextAttrs();
	const drawerItemDescriptionAttrs = topNavMenuDrawerItemDescriptionAttrs();

	function drawerItemProps(item: TopNavMenuItemData) {
		return {
			href: item.href,
			...(linkResolved.isNative ? {} : { to: item.href }),
			onclick: () => {
				item.onclick?.();
				appShellMobile().closeMobileNav();
			},
			class: drawerItemAttrs.class,
			style: drawerItemAttrs.style
		};
	}
</script>

{#if isMobileBar}
	<!-- Mobile bar: hide menus entirely. -->
{:else if isDrawer}
	<div class={drawerSectionAttrs.class} style={drawerSectionAttrs.style}>
		<button
			type="button"
			onclick={() => (drawerExpanded = !drawerExpanded)}
			aria-expanded={drawerExpanded}
			aria-controls="{menuId}-items"
			class={drawerHeaderAttrs.class}
			style={drawerHeaderAttrs.style}
		>
			{label}
			<span class={drawerChevronAttrs.class} style={drawerChevronAttrs.style}>
				{@render chevronIcon.current?.()}
			</span>
		</button>
		<div id="{menuId}-items" class={drawerItemsAttrs.class} style={drawerItemsAttrs.style}>
			<div class={drawerItemsInnerAttrs.class} style={drawerItemsInnerAttrs.style}>
				{#each items as item (item.title)}
					<LinkElement component={linkResolved.component} props={drawerItemProps(item)}>
						{#if item.icon}
							<span class={drawerItemIconAttrs.class} style={drawerItemIconAttrs.style}>
								{@render item.icon()}
							</span>
						{/if}
						<span class={drawerItemTextAttrs.class} style={drawerItemTextAttrs.style}>
							{item.title}
							{#if item.description}
								<span
									class={drawerItemDescriptionAttrs.class}
									style={drawerItemDescriptionAttrs.style}
								>
									{item.description}
								</span>
							{/if}
						</span>
					</LinkElement>
				{/each}
			</div>
		</div>
	</div>
{:else}
	<button
		{...rest}
		{@attach popover.attachTrigger}
		type="button"
		{...popover.triggerProps}
		onclick={menuHover.triggerProps.onclick}
		onmouseenter={menuHover.triggerProps.onmouseenter}
		onmouseleave={menuHover.triggerProps.onmouseleave}
		{...theme}
		class={cx(theme.class, triggerAttrs.class, className)}
		style={mergeStyle(triggerAttrs.style, styleProp as string | undefined)}
	>
		{label}
		<span class={chevronAttrs.class} style={chevronAttrs.style}>
			{@render chevronIcon.current?.()}
		</span>
	</button>
	<PopoverLayer {popover} placement="below" alignment={slot()} xstyle={topNavMenuOffset}>
		<!--
			The container carries both the hover hook's attachment (for its open/close
			focus management) and the list-focus one (roving tabindex + typeahead) —
			upstream's `mergeRefs(menuRef, listRef)`, one element read twice.

			`onkeydown`/`onfocus` come *after* the hover hook's handlers so the full
			APG composition (roving tabindex + typeahead + Enter/Space activation)
			replaces the hover hook's basic arrow-key handler, which is the ordering
			upstream gets from spreading `contentProps` first.
		-->
		<div
			{@attach menuHover.attachMenu}
			{@attach list.attachList}
			role="menu"
			aria-label={label}
			onmouseenter={menuHover.contentProps.onmouseenter}
			onmouseleave={menuHover.contentProps.onmouseleave}
			onkeydown={menuKeyDown}
			onfocusin={list.handleFocus}
			class={containerAttrs.class}
			style={containerAttrs.style}
		>
			{#each items as item (item.title)}
				{#if item.href}
					<!-- `item.href` is a consumer-supplied URL of any kind, so SvelteKit's
					     resolve() does not apply — the `Button` precedent. Note this row is
					     a literal `<a>`, not the resolved link component: upstream's desktop
					     branch hardcodes the tag and only its drawer branch goes through
					     LinkComponent. Replicated. -->
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						role="menuitem"
						tabindex={-1}
						href={item.href}
						onclick={item.onclick}
						class={rowAttrs.class}
						style={rowAttrs.style}
					>
						<div class={rowIconAttrs.class} style={rowIconAttrs.style}>
							{#if item.icon}{@render item.icon()}{/if}
						</div>
						<div class={rowContentAttrs.class} style={rowContentAttrs.style}>
							<span class={rowTitleAttrs.class} style={rowTitleAttrs.style}>{item.title}</span>
							{#if item.description}
								<span class={rowDescriptionAttrs.class} style={rowDescriptionAttrs.style}>
									{item.description}
								</span>
							{/if}
						</div>
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{:else}
					<div
						role="menuitem"
						tabindex={-1}
						onclick={item.onclick}
						class={rowAttrs.class}
						style={rowAttrs.style}
					>
						<div class={rowIconAttrs.class} style={rowIconAttrs.style}>
							{#if item.icon}{@render item.icon()}{/if}
						</div>
						<div class={rowContentAttrs.class} style={rowContentAttrs.style}>
							<span class={rowTitleAttrs.class} style={rowTitleAttrs.style}>{item.title}</span>
							{#if item.description}
								<span class={rowDescriptionAttrs.class} style={rowDescriptionAttrs.style}>
									{item.description}
								</span>
							{/if}
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</PopoverLayer>
{/if}
