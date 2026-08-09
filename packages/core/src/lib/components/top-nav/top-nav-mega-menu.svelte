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
	import { useIcon } from '../icon/use-icon.svelte.js';
	import PopoverLayer from '../popover/popover-layer.svelte';
	import { usePopover } from '../popover/use-popover.svelte.js';
	import { useTopNavSlot } from './top-nav-context.svelte.js';
	import {
		megaMenuChevronAttrs,
		megaMenuDrawerChevronAttrs,
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
		megaMenuWrapperAttrs
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
	 * Two upstream shapes replicated rather than corrected, both recorded in
	 * TODO.md → Known debts. (A third — the trigger writing `aria-haspopup`/
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

	const chevronIcon = useIcon(() => 'chevronDown');
	const slot = useTopNavSlot();

	const isDrawer = $derived(renderMode() === 'drawer');
	const isMobileBar = $derived(renderMode() === 'mobile-bar');

	let isExpanded = $state(false);
	// Upstream's `mega-menu-${label.toLowerCase().replace(/\s+/g, '-')}`.
	const drawerMenuId = $derived(`mega-menu-${label.toLowerCase().replace(/\s+/g, '-')}`);

	let triggerButton = $state<HTMLButtonElement>();
	// Plain `let`s: upstream's three refs, none of which drive a render.
	let showTimeout: ReturnType<typeof setTimeout> | null = null;
	let hideTimeout: ReturnType<typeof setTimeout> | null = null;
	let clickLocked = false;

	const popover = usePopover(() => ({
		id: popoverId,
		// role: 'none' — the panel exposes its own role="group" labelled by
		// `label`. Focus stays on the trigger while the panel is open, so a
		// role="dialog" aria-modal="true" wrapper (which is what `dialogLabel` used
		// to ask for here) would announce an unnamed modal dialog around a grid of
		// links.
		role: 'none',
		// hasSurface: false — the mega menu provides its own surface
		// (panelContainer) with a border-top and custom overflow. The animation
		// rides <PopoverLayer>'s xstyle, not the hook's.
		hasSurface: false,
		onShow: () => onOpenChange?.(true),
		onHide: () => onOpenChange?.(false)
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

	$effect(() => () => clearTimeouts());

	function clearTimeouts(): void {
		if (showTimeout) {
			clearTimeout(showTimeout);
			showTimeout = null;
		}
		if (hideTimeout) {
			clearTimeout(hideTimeout);
			hideTimeout = null;
		}
	}

	function scheduleShow(): void {
		clearTimeouts();
		showTimeout = setTimeout(() => {
			popover.show({ skipAutoFocus: true });
		}, delay);
	}

	function scheduleHide(): void {
		clearTimeouts();
		hideTimeout = setTimeout(() => {
			popover.hide();
		}, hideDelay);
	}

	function handleMouseEnter(): void {
		if (!clickLocked) {
			scheduleShow();
		}
	}

	function handleMouseLeave(): void {
		if (!clickLocked) {
			scheduleHide();
		}
	}

	function handleClick(): void {
		clearTimeouts();
		if (popover.isOpen) {
			clickLocked = false;
			popover.hide();
			triggerButton?.focus();
		} else {
			clickLocked = true;
			popover.show();
		}
	}

	const theme = themeProps('top-nav-mega-menu');
	const drawerTheme = themeProps('top-nav-mega-menu', { mode: 'drawer' });
	const triggerAttrs = $derived(megaMenuTriggerAttrs(popover.isOpen, xstyle));
	const chevronAttrs = $derived(megaMenuChevronAttrs(popover.isOpen));
	const panelContainerAttrs = megaMenuPanelContainerAttrs();
	const panelContentAttrs = megaMenuPanelContentAttrs();
	const wrapperAttrs = megaMenuWrapperAttrs();
	const featuredAttrs = megaMenuFeaturedAttrs();

	const drawerSectionAttrs = megaMenuDrawerSectionAttrs();
	const drawerHeaderAttrs = megaMenuDrawerHeaderAttrs();
	const drawerChevronAttrs = $derived(megaMenuDrawerChevronAttrs(isExpanded));
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
			<span class={drawerChevronAttrs.class} style={drawerChevronAttrs.style}>
				{@render chevronIcon.current?.()}
			</span>
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
		type="button"
		{...popover.triggerProps}
		onclick={handleClick}
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
		{...theme}
		class={cx(theme.class, triggerAttrs.class, className)}
		style={mergeStyle(triggerAttrs.style, styleProp as string | undefined)}
	>
		{label}
		<span class={chevronAttrs.class} style={chevronAttrs.style}>
			{@render chevronIcon.current?.()}
		</span>
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
			role="group"
			aria-label={label}
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
			class={panelContainerAttrs.class}
			style={panelContainerAttrs.style}
		>
			<div class={panelContentAttrs.class} style={panelContentAttrs.style}>
				<!-- Menu items section -->
				{#if items}
					<div class={wrapperAttrs.class} style={wrapperAttrs.style}>
						<Grid columns={2} gap={2}>
							{@render items()}
						</Grid>
					</div>
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
