<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface TopNavMegaMenuProps extends BaseProps<HTMLButtonElement> {
		/** The visible label for the nav item trigger. */
		label: string;
		/**
		 * Menu items slot — typically one or more `TopNavMegaMenuItem`s, but
		 * anything is accepted for custom layouts.
		 */
		items?: Snippet;
		/**
		 * Featured content slot — the right panel on desktop, below the items in
		 * the mobile drawer.
		 */
		featured?: Snippet;
		/**
		 * Delay before showing the menu on hover (ms).
		 * @default 150
		 */
		delay?: number;
		/**
		 * Delay before hiding the menu after the mouse leaves (ms).
		 * @default 250
		 */
		hideDelay?: number;
		/**
		 * Callback fired when the mega menu opens or closes.
		 * Useful for coordinating wrapper styles (e.g. hiding other shadows).
		 */
		onOpenChange?: (isOpen: boolean) => void;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import Grid from '../grid/grid.svelte';
	import Icon from '../icon/icon.svelte';
	import PopoverLayer from '../popover/popover-layer.svelte';
	import { usePopover } from '../popover/use-popover.svelte.js';
	import { useMenuHover } from '../../internal/use-menu-hover.svelte.js';
	import { useTopNavSlot } from './top-nav-context.svelte.js';
	import {
		megaMenuChevronStyle,
		megaMenuDrawerChevronStyle,
		megaMenuDrawerFeaturedAttrs,
		megaMenuDrawerHeaderAttrs,
		megaMenuDrawerItemsAttrs,
		megaMenuDrawerItemsInnerAttrs,
		megaMenuDrawerSectionAttrs,
		megaMenuFeaturedAttrs,
		megaMenuPanelAnimation,
		megaMenuPanelContainerAttrs,
		megaMenuPanelContentAttrs,
		megaMenuPanelViewportFit,
		megaMenuTriggerAttrs,
		megaMenuWrapperStyle
	} from './top-nav-mega-menu.stylex.js';
	import { useTopNavRenderMode } from './top-nav-render-context.svelte.js';

	/**
	 * A `TopNav` item that opens a full-width mega menu on hover or click.
	 *
	 * Three shapes, picked by `TopNavRenderContext`:
	 * - `'default'`: a top-layer popover panel **anchored to the enclosing
	 *   `<nav>`**, not to its own button — that is what makes the panel span the
	 *   bar rather than hang off the trigger.
	 * - `'mobile-bar'`: nothing at all.
	 * - `'drawer'`: an inline collapsible, matching `TopNavMenu`'s.
	 *
	 * Upstream declares its two render shapes as two sibling components in one
	 * file; Svelte has no in-file component declaration, so both live in this
	 * template's branches — the same arrangement `Lightbox` and `TreeList` take.
	 *
	 * The desktop trigger opens on hover *and* click. Hover opens are transient;
	 * click and keyboard opens are pinned (`sticky`). A click landing within
	 * `CLICK_GUARD_MS` of a hover open **confirms** that open rather than toggling
	 * it shut — without the guard, moving the pointer onto a trigger and then
	 * clicking it dismissed the panel the hover had just produced. The panel stays
	 * an `auto` popover for native dismissal and sibling exclusivity, and the
	 * trigger's `popovertarget` registers it as the native invoker so this guard
	 * runs before any light dismiss.
	 *
	 * Two upstream shapes replicated rather than corrected, both recorded in
	 * port/debts.md → Known debts. (A third — the trigger writing `aria-haspopup`/
	 * `aria-expanded` by hand and never spreading `popover.triggerProps`, so it
	 * carried no `aria-controls` — was fixed upstream in 0.1.9 and here with it.)
	 * - `delay`, `hideDelay` and `onOpenChange` are inert in drawer mode:
	 *   upstream forwards only `label`/`items`/`featured` to its drawer
	 *   sub-component, so the disclosure's expand/collapse fires no callback.
	 * - The drawer's `aria-controls` id is derived from the label rather than
	 *   minted, so two mega menus sharing a label collide.
	 */
	let {
		label,
		items,
		featured,
		delay = 150,
		hideDelay = 250,
		onOpenChange,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: TopNavMegaMenuProps = $props();

	const popoverId = $props.id();
	const renderMode = useTopNavRenderMode();

	const slot = useTopNavSlot();

	const isDrawer = $derived(renderMode() === 'drawer');
	const isMobileBar = $derived(renderMode() === 'mobile-bar');

	let isExpanded = $state(false);
	// Upstream's `mega-menu-${label.toLowerCase().replace(/\s+/g, '-')}`.
	const drawerMenuId = $derived(`mega-menu-${label.toLowerCase().replace(/\s+/g, '-')}`);

	/** The panel is a grid of links, not `role="menuitem"` rows. */
	const PANEL_ITEM_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

	let triggerButton = $state<HTMLButtonElement>();

	const popover = usePopover(() => ({
		id: popoverId,
		// role: 'none' — the panel exposes its own role="group" labelled by
		// `label`. Pointer/hover opens keep focus on the trigger; keyboard and
		// assistive-tech opens move focus into the panel (a labelled group you exit
		// with Escape or by tabbing out). Either way role="dialog"
		// aria-modal="true" would be wrong: it announces an unnamed modal dialog
		// around a grid of links (and, when focus stays on the trigger, marks the
		// focused control inert).
		role: 'none',
		// hasSurface: false — the mega menu provides its own surface
		// (panelContainer) with a border-top and custom overflow. The animation
		// rides <PopoverLayer>'s xstyle, not the hook's.
		hasSurface: false,
		// Keep native outside-click/Escape dismissal and sibling exclusivity. The
		// trigger's `popovertarget` association prevents its activation from being
		// treated as an ordinary outside interaction.
		hasLightDismiss: true,
		onShow: () => onOpenChange?.(true),
		onHide: () => onOpenChange?.(false)
	}));

	// The whole hover machine — open/hide delays, the hover→click guard, keyboard
	// activation and focus restoration — is the shared `useMenuHover` as of 0.4.2.
	// This component used to carry its own copy (#4555); #3121 moved that logic
	// into the hook so every hover-opening menu behaves the same way.
	const menuHover = useMenuHover(() => ({
		show: popover.show,
		hide: popover.hide,
		isOpen: popover.isOpen,
		isEnabled: true,
		showDelay: delay,
		hideDelay,
		itemSelector: PANEL_ITEM_SELECTOR,
		// Trigger sits outside an auto popover; the invoker relationship exempts it
		// from light dismiss.
		popoverId: popover.id
	}));

	// Anchor the popover to the parent <nav> (the TopNav), not to the trigger —
	// which is what makes the panel full-width. Upstream reads
	// `triggerButtonRef.current?.closest('nav')` in an effect and calls
	// `popover.triggerRef(nav)`; `attachTrigger` is the same call, invoked
	// imperatively, with its returned cleanup standing in for `triggerRef(null)`.
	$effect(() => {
		const nav = triggerButton?.closest('nav');
		if (!nav) {
			return;
		}
		return popover.attachTrigger(nav as HTMLElement);
	});

	const theme = themeProps('top-nav-mega-menu');
	const drawerTheme = themeProps('top-nav-mega-menu', { mode: 'drawer' });
	const triggerAttrs = $derived(megaMenuTriggerAttrs(popover.isOpen, xstyle));
	const chevronStyle = $derived(megaMenuChevronStyle(popover.isOpen));
	const panelContainerAttrs = megaMenuPanelContainerAttrs();
	const panelContentAttrs = megaMenuPanelContentAttrs();
	const featuredAttrs = megaMenuFeaturedAttrs();

	const drawerSectionAttrs = megaMenuDrawerSectionAttrs();
	const drawerHeaderAttrs = megaMenuDrawerHeaderAttrs();
	const drawerChevronStyle = $derived(megaMenuDrawerChevronStyle(isExpanded));
	const drawerItemsAttrs = $derived(megaMenuDrawerItemsAttrs(isExpanded));
	const drawerItemsInnerAttrs = megaMenuDrawerItemsInnerAttrs();
	const drawerFeaturedAttrs = megaMenuDrawerFeaturedAttrs();
</script>

{#if isMobileBar}
	<!-- Mobile bar: hidden. -->
{:else if isDrawer}
	<div class={drawerSectionAttrs.class} style={drawerSectionAttrs.style}>
		<!-- Header toggle — same pattern as TopNavMenu drawer -->
		<button
			type="button"
			onclick={() => (isExpanded = !isExpanded)}
			aria-expanded={isExpanded}
			aria-controls="{drawerMenuId}-items"
			{...drawerTheme}
			class={cx(drawerTheme.class, drawerHeaderAttrs.class)}
			style={drawerHeaderAttrs.style}
		>
			{label}
			<Icon icon="chevronDown" size="sm" color="inherit" xstyle={drawerChevronStyle} />
		</button>

		<!-- Animated expand/collapse container -->
		<div id="{drawerMenuId}-items" class={drawerItemsAttrs.class} style={drawerItemsAttrs.style}>
			<div class={drawerItemsInnerAttrs.class} style={drawerItemsInnerAttrs.style}>
				<!-- Items render themselves in drawer mode via TopNavRenderContext -->
				{#if items}{@render items()}{/if}

				<!-- Featured card -->
				{#if featured}
					<div class={drawerFeaturedAttrs.class} style={drawerFeaturedAttrs.style}>
						{@render featured()}
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<!--
		`popover.triggerProps` is spread rather than hand-writing `aria-haspopup`/
		`aria-expanded`, which is what 0.1.9 changed: the hand-written pair carried
		no `aria-controls`, so AT could not navigate from the trigger to the panel.
		With `role: 'none'` the spread emits `aria-haspopup="true"`.
	-->
	<button
		{...rest}
		bind:this={triggerButton}
		{@attach menuHover.attachTrigger}
		type="button"
		{...popover.triggerProps}
		{...menuHover.triggerProps}
		{...theme}
		class={cx(theme.class, triggerAttrs.class, className)}
		style={mergeStyle(triggerAttrs.style, styleProp as string | undefined)}
	>
		{label}
		<Icon icon="chevronDown" size="sm" color="inherit" xstyle={chevronStyle} />
	</button>
	<!--
		Two styles on the layer, not one: `megaMenuPanelViewportFit` caps the panel
		at the space below the nav (the layer's containing block) and makes it a
		flex column, so `panelContainer` can shrink and `panelContent` scrolls
		internally instead of the panel running off the bottom of the screen.
	-->
	<PopoverLayer
		{popover}
		placement="below"
		alignment={slot()}
		xstyle={[megaMenuPanelAnimation, megaMenuPanelViewportFit]}
	>
		<!--
			`role="group"` — a mega menu is a browsing grid of links, not an ARIA menu
			of menuitems (per the WAI-ARIA APG, the `menu` role is for action menus;
			link mega menus are the documented anti-case). It was `role="menu"` here,
			which is what 0.1.9 corrected.
		-->
		<div
			{@attach menuHover.attachMenu}
			role="group"
			aria-label={label}
			onmouseenter={menuHover.contentProps.onmouseenter}
			onmouseleave={menuHover.contentProps.onmouseleave}
			onkeydown={menuHover.contentProps.onkeydown}
			class={panelContainerAttrs.class}
			style={panelContainerAttrs.style}
		>
			<div class={panelContentAttrs.class} style={panelContentAttrs.style}>
				<!-- Menu items section -->
				{#if items}
					<Grid columns={2} gap={2} xstyle={megaMenuWrapperStyle}>
						{@render items()}
					</Grid>
				{/if}

				<!-- Featured section -->
				{#if featured}
					<div class={featuredAttrs.class} style={featuredAttrs.style}>
						{@render featured()}
					</div>
				{/if}
			</div>
		</div>
	</PopoverLayer>
{/if}
