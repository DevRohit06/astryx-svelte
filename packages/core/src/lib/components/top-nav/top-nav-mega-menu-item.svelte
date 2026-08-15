<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { LinkComponentType } from '../link/types.js';

	/**
	 * `onclick` is narrowed to a zero-argument callback, as upstream narrows it:
	 * the item's own handler takes no event, and the desktop branch hands it
	 * straight to the element.
	 */
	export interface TopNavMegaMenuItemProps extends Omit<
		BaseProps<HTMLElement>,
		'onclick' | 'title'
	> {
		/** Display title for the menu item. */
		title: string;
		/** Optional description text displayed below the title. */
		description?: string;
		/** Optional icon element displayed to the left. */
		icon?: Snippet;
		/** URL to navigate to when clicked. */
		href?: string;
		/** Callback when the item is clicked. */
		onclick?: () => void;
		/**
		 * Custom component to render instead of `<a>` for link items.
		 * Overrides the provider-level default set by `LinkProvider`.
		 */
		as?: LinkComponentType;
	}
</script>

<script lang="ts">
	import { themeProps } from '../../internal/theme-props.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { useAppShellMobile } from '../app-shell/app-shell-mobile-context.svelte.js';
	import { useLinkComponent } from '../link/link-context.svelte.js';
	import LinkElement from '../link/link-element.svelte';
	import {
		megaMenuItemAttrs,
		megaMenuItemContentAttrs,
		megaMenuItemDescriptionAttrs,
		megaMenuItemDrawerAttrs,
		megaMenuItemDrawerContentAttrs,
		megaMenuItemDrawerDescriptionAttrs,
		megaMenuItemDrawerIconAttrs,
		megaMenuItemIconAttrs,
		megaMenuItemTitleAttrs
	} from './top-nav-mega-menu-item.stylex.js';
	import { useTopNavRenderMode } from './top-nav-render-context.svelte.js';

	/**
	 * An individual row inside a `TopNavMegaMenu`.
	 *
	 * Renders itself in both desktop (a card in the popover grid) and mobile
	 * drawer shapes, switching on `TopNavRenderContext`. In the drawer, activating
	 * it also dismisses the drawer.
	 *
	 * The element is a link when `href` is set and a `<button>`/`<div>` otherwise —
	 * `<button>` in drawer mode (where the row is the tap target) and `<div>` on
	 * the desktop card, which is upstream's split and not a slip.
	 *
	 * **Rest props reach the rendered element, where upstream drops them.**
	 * Upstream destructures a closed eight-prop list off `BaseProps<HTMLElement>`
	 * with no spread, so `id`/`aria-*`/`data-*`/handlers and even `xstyle` are
	 * discarded — and `tabIndex`, the one inherited attribute it does keep,
	 * reaches only the desktop branch. We forward, as `DropdownMenu`/`Timestamp`
	 * do; `tabindex`'s desktop-only routing is replicated. See port/debts.md →
	 * Known debts.
	 */
	let {
		title,
		description,
		icon,
		href,
		onclick,
		as,
		tabindex,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: TopNavMegaMenuItemProps = $props();

	const renderMode = useTopNavRenderMode();
	const resolveLink = useLinkComponent();
	const linkResolved = $derived(resolveLink(as));
	const appShellMobile = useAppShellMobile();

	const isDrawer = $derived(renderMode() === 'drawer');

	const drawerTheme = themeProps('top-nav-mega-menu-item', { mode: 'drawer' });
	const desktopTheme = themeProps('top-nav-mega-menu-item');

	const drawerAttrs = $derived(megaMenuItemDrawerAttrs(xstyle));
	const drawerIconAttrs = megaMenuItemDrawerIconAttrs();
	const drawerContentAttrs = megaMenuItemDrawerContentAttrs();
	const drawerDescriptionAttrs = megaMenuItemDrawerDescriptionAttrs();
	const desktopAttrs = $derived(megaMenuItemAttrs(xstyle));
	const desktopIconAttrs = megaMenuItemIconAttrs();
	const desktopContentAttrs = megaMenuItemContentAttrs();
	const desktopTitleAttrs = megaMenuItemTitleAttrs();
	const desktopDescriptionAttrs = megaMenuItemDescriptionAttrs();

	function handleDrawerClick(): void {
		onclick?.();
		appShellMobile().closeMobileNav();
	}

	const drawerLinkProps = $derived({
		...rest,
		href,
		...(linkResolved.isNative ? {} : { to: href }),
		onclick: handleDrawerClick,
		...drawerTheme,
		class: cx(drawerTheme.class, drawerAttrs.class, className),
		style: mergeStyle(drawerAttrs.style, styleProp as string | undefined)
	});

	const desktopLinkProps = $derived({
		...rest,
		href,
		...(linkResolved.isNative ? {} : { to: href }),
		onclick,
		tabindex,
		...desktopTheme,
		class: cx(desktopTheme.class, desktopAttrs.class, className),
		style: mergeStyle(desktopAttrs.style, styleProp as string | undefined)
	});
</script>

{#snippet drawerBody()}
	{#if icon}
		<div class={drawerIconAttrs.class} style={drawerIconAttrs.style}>{@render icon()}</div>
	{/if}
	<div class={drawerContentAttrs.class} style={drawerContentAttrs.style}>
		{title}
		{#if description}
			<span class={drawerDescriptionAttrs.class} style={drawerDescriptionAttrs.style}>
				{description}
			</span>
		{/if}
	</div>
{/snippet}

{#snippet desktopBody()}
	{#if icon}
		<div class={desktopIconAttrs.class} style={desktopIconAttrs.style}>{@render icon()}</div>
	{/if}
	<div class={desktopContentAttrs.class} style={desktopContentAttrs.style}>
		<span class={desktopTitleAttrs.class} style={desktopTitleAttrs.style}>{title}</span>
		{#if description}
			<span class={desktopDescriptionAttrs.class} style={desktopDescriptionAttrs.style}>
				{description}
			</span>
		{/if}
	</div>
{/snippet}

{#if isDrawer}
	{#if href}
		<LinkElement component={linkResolved.component} props={drawerLinkProps}>
			{@render drawerBody()}
		</LinkElement>
	{:else}
		<button
			{...rest}
			type="button"
			onclick={handleDrawerClick}
			{...drawerTheme}
			class={cx(drawerTheme.class, drawerAttrs.class, className)}
			style={mergeStyle(drawerAttrs.style, styleProp as string | undefined)}
		>
			{@render drawerBody()}
		</button>
	{/if}
{:else if href}
	<LinkElement component={linkResolved.component} props={desktopLinkProps}>
		{@render desktopBody()}
	</LinkElement>
{:else}
	<!-- Upstream renders a bare `<div onClick tabIndex>` for a hrefless desktop
	     item — no role, no key handler. Replicated rather than corrected: adding
	     a role would change the accessibility tree the upstream suite asserts on.
	     A hrefless mega-menu item is a documented-but-unkeyboardable upstream
	     shape; see port/debts.md → Known debts. -->
	<div
		{...rest}
		{onclick}
		{tabindex}
		{...desktopTheme}
		class={cx(desktopTheme.class, desktopAttrs.class, className)}
		style={mergeStyle(desktopAttrs.style, styleProp as string | undefined)}
	>
		{@render desktopBody()}
	</div>
{/if}
