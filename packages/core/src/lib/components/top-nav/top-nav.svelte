<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface TopNavProps extends BaseProps<HTMLElement> {
		/**
		 * Heading slot — typically a `TopNavHeading` with logo and text.
		 * Positioned at the leading edge of the nav bar.
		 */
		heading?: Snippet;
		/**
		 * Start content slot — typically navigation items or breadcrumbs.
		 * Positioned after the heading, leading-aligned.
		 */
		startContent?: Snippet;
		/**
		 * Alias for `startContent`. Prefer `startContent` when composing with other
		 * slots. If both are provided, `startContent` wins and `children` is
		 * ignored — the alias exists so nav items written as component content do
		 * not silently disappear.
		 */
		children?: Snippet;
		/**
		 * Center content slot — typically tabs, a search box, or primary
		 * navigation. When provided, the layout switches to a three-column CSS grid
		 * so the centre stays centred regardless of start/end content widths.
		 */
		centerContent?: Snippet;
		/**
		 * End content slot — search, icons, user profile, utility menus.
		 * Positioned at the trailing edge.
		 */
		endContent?: Snippet;
		/**
		 * Accessible label for the navigation landmark.
		 * @default 'Top navigation'
		 */
		label?: string;
	}
</script>

<script lang="ts">
	import { useTranslator } from '../../i18n/index.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useAppShellMobile } from '../app-shell/app-shell-mobile-context.svelte.js';
	import Divider from '../divider/divider.svelte';
	import MobileNav from '../mobile-nav/mobile-nav.svelte';
	import MobileNavToggle from '../mobile-nav/mobile-nav-toggle.svelte';
	import { useTopNavMobileContent } from './top-nav-mobile-content-context.svelte.js';
	import { useTopNavRenderMode } from './top-nav-render-context.svelte.js';
	import {
		topNavCenterContentAttrs,
		topNavDrawerDividerStyle,
		topNavDrawerExtraContentAttrs,
		topNavDrawerItemsAttrs,
		topNavEndContentAttrs,
		topNavHeadingSlotAttrs,
		topNavLeftSectionAttrs,
		topNavMobileBarAttrs,
		topNavMobileBarEndAttrs,
		topNavRightSectionAttrs,
		topNavRootAttrs,
		topNavStartContentAttrs
	} from './top-nav.stylex.js';
	import TopNavSlotScope from './top-nav-slot-scope.svelte';

	/**
	 * The top navigation bar for application headers.
	 *
	 * Slot-based: `heading`, `startContent`, `centerContent`, `endContent`.
	 * `children` is an alias for `startContent`, so nav items written as component
	 * content are not silently dropped. Supplying `centerContent` switches the bar
	 * from a flex row to a three-column grid.
	 *
	 * Three shapes, picked by `TopNavRenderContext`:
	 * - `'default'`: the full bar.
	 * - `'mobile-bar'`: heading + end content + the drawer toggle, nav items
	 *   hidden. Falls through to `'default'` only in the sense that it always
	 *   renders — there is no reason to strip the bar down when nothing would go
	 *   in the drawer, which is why the toggle is gated on `hasMobileDrawerContent`.
	 * - `'drawer'`: the nav items stacked vertically inside a `MobileNav`, with
	 *   any `SideNav` content `AppShell` passed through
	 *   `TopNavMobileContentContext` below a `Divider`. That combined drawer is
	 *   the reason both navs never open two overlays at once.
	 *
	 * @example
	 * ```svelte
	 * <TopNav label="Main navigation">
	 *   {#snippet heading()}<TopNavHeading heading="My App" />{/snippet}
	 *   {#snippet startContent()}<TopNavItem label="Home" href="/" isSelected />{/snippet}
	 * </TopNav>
	 * ```
	 */
	let {
		heading,
		startContent,
		children,
		centerContent,
		endContent,
		label: labelFromProps,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: TopNavProps = $props();

	const t = useTranslator();
	const renderMode = useTopNavRenderMode();
	const mobileContent = useTopNavMobileContent();
	const appShellMobile = useAppShellMobile();

	const label = $derived(labelFromProps ?? t('@astryx.topNav.landmarkLabel'));
	const resolvedStartContent = $derived(startContent ?? children);
	const hasCenterContent = $derived(centerContent != null);
	const hasCollapsibleContent = $derived(resolvedStartContent != null || centerContent != null);
	// Show the mobile toggle when there is ANY drawer content — our own items, or
	// SideNav content handed down by AppShell.
	const hasMobileDrawerContent = $derived(hasCollapsibleContent || mobileContent() != null);

	const isMobileBar = $derived(renderMode() === 'mobile-bar');
	const isDrawer = $derived(renderMode() === 'drawer');

	const theme = themeProps('top-nav');
	const mobileBarTheme = themeProps('top-nav', { mode: 'mobile-bar' });
	const rootAttrs = $derived(topNavRootAttrs(hasCenterContent, xstyle));
	const mobileBarAttrs = $derived(topNavMobileBarAttrs(xstyle));
	const leftSectionAttrs = topNavLeftSectionAttrs();
	const headingSlotAttrs = topNavHeadingSlotAttrs();
	const startContentAttrs = topNavStartContentAttrs();
	const centerContentAttrs = topNavCenterContentAttrs();
	const rightSectionAttrs = topNavRightSectionAttrs();
	const endContentAttrs = topNavEndContentAttrs();
	const mobileBarEndAttrs = topNavMobileBarEndAttrs();
	const drawerItemsAttrs = topNavDrawerItemsAttrs();
	// Empty on both sides — kept off the DOM rather than rendered as `class=""`.
	const drawerExtraContentAttrs = topNavDrawerExtraContentAttrs();
</script>

{#if isMobileBar}
	<!--
		Mobile bar mode — heading + endContent + toggle, nav items hidden.
	-->
	<nav
		role="navigation"
		aria-label={label}
		{...mobileBarTheme}
		class={cx(mobileBarTheme.class, mobileBarAttrs.class, className)}
		style={mergeStyle(mobileBarAttrs.style, styleProp as string | undefined)}
		{...rest}
	>
		{#if heading}
			<div class={headingSlotAttrs.class} style={headingSlotAttrs.style}>{@render heading()}</div>
		{/if}
		<div class={mobileBarEndAttrs.class} style={mobileBarEndAttrs.style}>
			{#if endContent}{@render endContent()}{/if}
			{#if hasMobileDrawerContent && appShellMobile().hasAutoToggle}
				<MobileNavToggle />
			{/if}
		</div>
	</nav>
{:else if isDrawer}
	<!--
		Drawer mode — nav items vertically inside a MobileNav, plus any content
		AppShell passed through the mobile-content context (the SideNav's items).
		Renders nothing when there is neither.
	-->
	{#if hasCollapsibleContent || mobileContent()}
		<MobileNav header={heading}>
			{#if hasCollapsibleContent}
				<div class={drawerItemsAttrs.class} style={drawerItemsAttrs.style}>
					{#if resolvedStartContent}{@render resolvedStartContent()}{/if}
					{#if centerContent}{@render centerContent()}{/if}
				</div>
			{/if}
			{#if hasCollapsibleContent && mobileContent()}
				<Divider xstyle={topNavDrawerDividerStyle} />
			{/if}
			{#if mobileContent()}
				{@const extra = mobileContent()}
				<div class={drawerExtraContentAttrs.class || undefined}>
					{#if extra}{@render extra()}{/if}
				</div>
			{/if}
		</MobileNav>
	{/if}
{:else}
	<!-- Default mode — the full top bar -->
	<nav
		role="navigation"
		aria-label={label}
		{...theme}
		class={cx(theme.class, rootAttrs.class, className)}
		style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
		{...rest}
	>
		<div class={leftSectionAttrs.class} style={leftSectionAttrs.style}>
			{#if heading}
				<div class={headingSlotAttrs.class} style={headingSlotAttrs.style}>{@render heading()}</div>
			{/if}
			{#if resolvedStartContent}
				<TopNavSlotScope slot="start">
					<div class={startContentAttrs.class} style={startContentAttrs.style}>
						{@render resolvedStartContent()}
					</div>
				</TopNavSlotScope>
			{/if}
		</div>
		{#if hasCenterContent && centerContent}
			<TopNavSlotScope slot="center">
				<div class={centerContentAttrs.class} style={centerContentAttrs.style}>
					{@render centerContent()}
				</div>
			</TopNavSlotScope>
		{/if}
		{#if hasCenterContent}
			<div class={rightSectionAttrs.class} style={rightSectionAttrs.style}>
				<TopNavSlotScope slot="end">
					{#if endContent}{@render endContent()}{/if}
				</TopNavSlotScope>
			</div>
		{:else if endContent}
			<div class={endContentAttrs.class} style={endContentAttrs.style}>
				<TopNavSlotScope slot="end">
					{@render endContent()}
				</TopNavSlotScope>
			</div>
		{/if}
	</nav>
{/if}
