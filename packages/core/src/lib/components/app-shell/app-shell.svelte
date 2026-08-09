<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SpacingStep } from '../../internal/types.js';

	/**
	 * SideNav breakpoint options.
	 * - `sm`: 640px · `md`: 768px · `lg`: 1024px · `none`: never auto-collapse
	 */
	export type AppShellBreakpoint = 'sm' | 'md' | 'lg' | 'none';

	/**
	 * Extensible variant map for `AppShell`.
	 *
	 * Theme packages add custom variants through declaration merging:
	 *
	 * ```ts
	 * declare module '@astryx-svelte/core' {
	 *   interface AppShellVariantMap {
	 *     glass: true;
	 *   }
	 * }
	 * ```
	 */
	export interface AppShellVariantMap {
		wash: true;
		surface: true;
		section: true;
		elevated: true;
	}

	/**
	 * Navigation background style. Extensible through module augmentation of
	 * {@link AppShellVariantMap}.
	 */
	export type AppShellVariant = keyof AppShellVariantMap;

	/**
	 * Configuration for the automatic mobile navigation — for when the auto
	 * behaviour needs tuning rather than replacing.
	 */
	export interface MobileNavConfig {
		/**
		 * Whether to auto-render the hamburger toggle. When false, place a
		 * `<MobileNavToggle />` yourself.
		 * @default true
		 */
		hasToggle?: boolean;
		/** Controlled open state. When set, `AppShell` keeps no state of its own. */
		isOpen?: boolean;
		/** Callback when the drawer's open state changes. */
		onOpenChange?: (isOpen: boolean) => void;
		/** Custom drawer content, replacing the auto-generated drawer. */
		content?: Snippet;
		/**
		 * Breakpoint below which mobile nav activates.
		 * @default 'md'
		 */
		breakpoint?: AppShellBreakpoint;
		/**
		 * SSR hint: whether the first render should assume a mobile layout. Seeds
		 * the breakpoint state so the server HTML matches the client on phones,
		 * avoiding a layout flash. Derive it from the User-Agent header or a
		 * device-detection cookie.
		 * @default false
		 */
		defaultIsMobile?: boolean;
	}

	export interface AppShellProps extends BaseProps<HTMLDivElement> {
		/**
		 * Navigation background style, controlling how nav areas contrast with
		 * content.
		 * - `wash`: nav uses the wash background, no dividers
		 * - `surface`: nav uses the surface background, no dividers
		 * - `section`: dividers between nav and content (the classic look)
		 * - `elevated`: wash nav with an elevated, corner-rounded content area
		 * @default 'elevated'
		 */
		variant?: AppShellVariant;
		/**
		 * Optional banner slot for system-wide announcements. Renders above the top
		 * nav and scrolls away with the page in `auto` mode.
		 */
		banner?: Snippet;
		/** Main content area (rendered as `<main>`). */
		children: Snippet;
		/**
		 * Padding for the main content area, on the spacing scale. Set it from the
		 * dominant content pattern: `4` for forms and text-heavy pages, `0` for
		 * dashboards, maps and tables that need edge-to-edge.
		 */
		contentPadding?: SpacingStep;
		/**
		 * Height behaviour.
		 * - `fill`: the shell fills the viewport and content scrolls internally
		 * - `auto`: the shell grows with content and the page scrolls as a whole
		 * @default 'fill'
		 */
		height?: 'fill' | 'auto';
		/**
		 * Mobile navigation. Three shapes:
		 * - **`false`** — disable mobile nav entirely
		 * - **A {@link MobileNavConfig}** — tune the automatic behaviour
		 * - **A `Snippet`** — the full escape hatch: render your own `<MobileNav>`
		 *
		 * Omitted, `AppShell` generates a drawer from the `sideNav` and `topNav`
		 * content below the breakpoint.
		 *
		 * The `Snippet` arm replaces React's "is this a valid element?" check:
		 * `typeof mobileNav === 'function'` is what discriminates markup from a
		 * config object, the same test every `string | Snippet` slot in this port
		 * uses.
		 */
		mobileNav?: false | MobileNavConfig | Snippet;
		/**
		 * Side navigation — typically a `SideNav`.
		 *
		 * Omit it when a page has no side navigation. Do **not** pass a snippet that
		 * renders nothing: `AppShell` treats any snippet as "a sidenav exists",
		 * exactly as upstream treats any renderable node. Getting this wrong
		 * silently kills the mobile toggle.
		 */
		sideNav?: Snippet;
		/** Top navigation — typically a `TopNav`. Same contract as `sideNav`. */
		topNav?: Snippet;
	}
</script>

<script lang="ts">
	import { useTranslator } from '../../i18n/index.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { observeResize, unobserveResize } from '../../internal/shared-resize-observer.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useMediaQuery } from '../../hooks/use-media-query.svelte.js';
	import Layout from '../layout/layout.svelte';
	import LayoutContent from '../layout/layout-content.svelte';
	import LayoutHeader from '../layout/layout-header.svelte';
	import LayoutPanel from '../layout/layout-panel.svelte';
	import MobileNavToggle from '../mobile-nav/mobile-nav-toggle.svelte';
	import SideNavRenderScope from '../side-nav/side-nav-render-scope.svelte';
	import TopNavMobileContentScope from '../top-nav/top-nav-mobile-content-scope.svelte';
	import TopNavRenderScope from '../top-nav/top-nav-render-scope.svelte';
	import { setAppShellMobileContext } from './app-shell-mobile-context.svelte.js';
	import {
		appShellAutoMobileTopBarAttrs,
		appShellBannerAttrs,
		appShellContentAreaStyle,
		appShellElevatedBackdropAttrs,
		appShellElevatedContentWrapperAttrs,
		appShellHeaderAttrs,
		appShellMainFocusTarget,
		appShellNavAreaStyle,
		appShellRootAttrs,
		appShellSideNavPanelStyle,
		appShellSideNavStickyAttrs,
		appShellSkipLinkAttrs,
		appShellStickyFallbackBg
	} from './app-shell.stylex.js';

	const BREAKPOINT_VALUES: Record<AppShellBreakpoint, number> = {
		sm: 640,
		md: 768,
		lg: 1024,
		none: 0
	};

	const MAIN_CONTENT_ID = 'astryx-app-shell-main';

	/**
	 * The application-level layout shell: top navigation, side navigation and a
	 * main content area, composed over `Layout`.
	 *
	 * Slot-based (`topNav`, `sideNav`, `banner`, `children`), with two height
	 * modes and an automatic mobile layout that turns the navs into one drawer
	 * below a breakpoint.
	 *
	 * The responsive behaviour is the part with real depth. Below the breakpoint
	 * `AppShell` re-renders the *same* nav content in different shapes by
	 * publishing render-mode contexts around it:
	 *
	 * - `TopNav` alone → a `mobile-bar` at the top and a `drawer` copy below.
	 * - `SideNav` alone → a `topbar` copy (heading + footer icons) and a `drawer`.
	 * - **Both** → the top bar is the `TopNav`, and the `SideNav` is handed to it
	 *   through `TopNavMobileContentContext` so the two share **one** drawer
	 *   instead of opening two overlays.
	 *
	 * **There is no `<Activity>` here.** Upstream wraps the drawer in React 19.2's
	 * `<Activity mode>` to keep it mounted-but-hidden, and ships a plain-fragment
	 * fallback for React 19.0/19.1. Svelte has no counterpart, so this port always
	 * takes that fallback shape: the drawer stays mounted and `MobileNav`'s own
	 * `isOpen` owns visibility, which is what it does upstream on those versions
	 * too. `MobileNav`'s teardown-close is kept regardless — see that component.
	 *
	 * `isRenderable` is Svelte-obviated: a `Snippet` is never `''` or a boolean, so
	 * `topNav != null` is the exact analogue, including the documented footgun that
	 * a snippet rendering nothing still counts as present.
	 *
	 * @example
	 * ```svelte
	 * <AppShell>
	 *   {#snippet topNav()}<TopNav label="Navigation" />{/snippet}
	 *   {#snippet sideNav()}<SideNav>{...}</SideNav>{/snippet}
	 *   <Content />
	 * </AppShell>
	 * ```
	 */
	let {
		variant = 'elevated',
		banner,
		children,
		contentPadding,
		'data-testid': dataTestId,
		height = 'fill',
		mobileNav,
		sideNav,
		topNav,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: AppShellProps = $props();

	const t = useTranslator();

	// =========================================================================
	// Parse the mobileNav prop — a config object, a snippet, or disabled.
	// `typeof === 'function'` discriminates a snippet from a config, which is
	// what upstream's `isValidElement` check does.
	// =========================================================================
	const mobileNavDisabled = $derived(mobileNav === false);
	const mobileNavConfig = $derived<MobileNavConfig | null>(
		mobileNav != null && mobileNav !== false && typeof mobileNav === 'object'
			? (mobileNav as MobileNavConfig)
			: null
	);
	const mobileNavSnippet = $derived<Snippet | null>(
		typeof mobileNav === 'function' ? (mobileNav as Snippet) : null
	);
	const mobileNavConfigContent = $derived(mobileNavConfig?.content ?? null);
	const mobileNavHasToggle = $derived(mobileNavConfig?.hasToggle !== false);
	const mobileNavIsControlled = $derived(mobileNavConfig?.isOpen !== undefined);
	const sideNavBreakpoint = $derived<AppShellBreakpoint>(mobileNavConfig?.breakpoint ?? 'md');

	// =========================================================================
	// Mobile nav open state (controlled + uncontrolled)
	// =========================================================================
	const breakpointQuery = $derived(
		sideNavBreakpoint === 'none'
			? '(max-width: 0px)'
			: `(max-width: ${BREAKPOINT_VALUES[sideNavBreakpoint]}px)`
	);
	// `serverDefault` is the SSR hint: it is what the server renders. It does not
	// survive hydration the way upstream's `getServerSnapshot` argument does —
	// `useMediaQuery`'s `$effect.pre` takes the live reading before the template
	// hydrates, so a mismatched viewport re-renders the affected branch rather
	// than hydrating it. See the hook for why that is the better trade here.
	const belowBreakpoint = useMediaQuery(
		() => breakpointQuery,
		mobileNavConfig?.defaultIsMobile ?? false
	);
	const isBelowBreakpoint = $derived(belowBreakpoint.matches);

	let uncontrolledMobileOpen = $state(false);
	const isMobileNavOpen = $derived(mobileNavConfig?.isOpen ?? uncontrolledMobileOpen);

	function setMobileNavOpen(open: boolean): void {
		if (!mobileNavIsControlled) {
			uncontrolledMobileOpen = open;
		}
		mobileNavConfig?.onOpenChange?.(open);
	}

	// Move focus to the main content container when the skip link is activated.
	// Hash navigation alone doesn't reliably move focus in every browser, so
	// focus the target explicitly (it is focusable via tabindex="-1").
	function handleSkipLinkClick(): void {
		document.getElementById(MAIN_CONTENT_ID)?.focus();
	}

	const isFill = $derived(height === 'fill');
	const isAuto = $derived(height === 'auto');

	// Nav-presence derived values. A snippet is never empty-string or boolean, so
	// `!= null` is `isRenderable`'s exact analogue here.
	const hasBanner = $derived(banner != null);
	const hasTopNav = $derived(topNav != null);
	const hasSideNav = $derived(sideNav != null);
	const hasNavContent = $derived(hasTopNav || hasSideNav);
	const mobileNavEnabled = $derived(
		!mobileNavDisabled && hasNavContent && mobileNavSnippet == null
	);
	const navHasDividers = $derived(variant === 'section');
	const isElevated = $derived(variant === 'elevated');

	const navAreaStyle = $derived(appShellNavAreaStyle(variant));
	const contentAreaStyle = $derived(
		appShellContentAreaStyle(variant, hasTopNav, hasSideNav, isBelowBreakpoint)
	);
	// Sticky elements in auto mode need an opaque background so content does not
	// show through when it scrolls underneath. Falls back to the surface tint,
	// which is what `section` always resolves to.
	const stickyBgStyle = $derived(navAreaStyle ?? appShellStickyFallbackBg);

	// =========================================================================
	// Header height measurement for the sticky sideNav offset (auto mode)
	// =========================================================================
	let headerEl = $state<HTMLDivElement>();
	// The measured header height, published as `--appshell-header-height` on the
	// shell root for the sticky sideNav's `top`/`height` to resolve against.
	//
	// **It goes through the `style` attribute Svelte writes, not
	// `element.style.setProperty`.** Upstream writes it imperatively because React
	// has no other option, but doing that here would put the custom property on an
	// element whose `style` Svelte owns — and Svelte applies a changed `style` by
	// assigning `cssText`, which wipes anything written behind its back. That is
	// the exact hazard `useLayer` needs a `MutationObserver` to repair for
	// `anchor-name`, and `src/tests/layer-attribute-repair.svelte.test.ts` exists
	// because of it. Routing the value through the same attribute Svelte already
	// manages removes the hazard instead of policing it. The DOM result is
	// identical; only the mechanism differs.
	let headerHeight = $state<number | null>(null);

	$effect(() => {
		if (!isAuto || !headerEl) {
			headerHeight = null;
			return;
		}
		const header = headerEl;

		observeResize(header, () => {
			headerHeight = header.getBoundingClientRect().height;
		});
		return () => unobserveResize(header);
	});

	const showSideNavInline = $derived(hasSideNav && !isBelowBreakpoint);
	const shouldRenderConfigContent = $derived(
		mobileNavEnabled && mobileNavConfigContent != null && isBelowBreakpoint
	);
	const shouldElevateWithCorner = $derived(isElevated && hasTopNav && showSideNavInline);
	// For sidenav-only layouts with no TopNav, the SideNav renders in topbar mode
	// (heading + footer icons horizontally) beside the hamburger.
	const showAutoMobileTopBar = $derived(
		!mobileNavDisabled && mobileNavHasToggle && isBelowBreakpoint && !hasTopNav && hasSideNav
	);
	// Below the breakpoint TopNav takes mobile-bar mode; above it, or with a
	// caller-supplied drawer, it renders normally.
	const isTopNavMobileBar = $derived(
		isBelowBreakpoint && !mobileNavDisabled && mobileNavSnippet == null
	);
	const shouldRenderAutoDrawer = $derived(
		isBelowBreakpoint && !mobileNavDisabled && mobileNavSnippet == null && !mobileNavConfigContent
	);

	// =========================================================================
	// Mobile context — read by MobileNavToggle, MobileNav, and every nav item
	// =========================================================================
	// One id shared by the toggle's `aria-controls` and the drawer's own `id`, so
	// the reference resolves. Minted here rather than in either of them, because
	// neither can see the other.
	const mobileNavId = $props.id();

	setAppShellMobileContext(() => ({
		isMobile: isBelowBreakpoint,
		isMobileNavOpen,
		mobileNavId,
		toggleMobileNav: () => mobileNavEnabled && setMobileNavOpen(!isMobileNavOpen),
		openMobileNav: () => mobileNavEnabled && setMobileNavOpen(true),
		closeMobileNav: () => setMobileNavOpen(false),
		isMobileNavEnabled: mobileNavEnabled,
		hasAutoToggle: mobileNavHasToggle
	}));

	const theme = $derived(themeProps('app-shell', { variant }));
	const headerTheme = $derived(themeProps('app-shell-header', { variant }));
	const sideNavTheme = $derived(themeProps('app-shell-sidenav', { variant }));
	const rootAttrs = $derived(appShellRootAttrs(variant, isFill, xstyle));
	const skipLinkAttrs = appShellSkipLinkAttrs();
	const bannerAttrs = $derived(appShellBannerAttrs(navAreaStyle));
	const headerAttrs = $derived(appShellHeaderAttrs(navAreaStyle, isAuto));
	const sideNavStickyAttrs = appShellSideNavStickyAttrs();
	const sideNavPanelStyle = $derived(
		appShellSideNavPanelStyle(navAreaStyle, stickyBgStyle, isAuto)
	);
	const elevatedWrapperAttrs = appShellElevatedContentWrapperAttrs();
	const elevatedBackdropAttrs = appShellElevatedBackdropAttrs();
	const autoMobileTopBarAttrs = appShellAutoMobileTopBarAttrs();
</script>

<!--
	The SideNav content AppShell hands to TopNav for the combined drawer. Only
	published when there is a SideNav *and* the auto toggle is on — TopNav reads
	its presence to decide whether to show the hamburger at all.
-->
{#snippet sideNavAsDrawerContent()}
	{#if sideNav}
		<SideNavRenderScope mode="drawer-content">
			{@render sideNav()}
		</SideNavRenderScope>
	{/if}
{/snippet}

{#snippet headerInner()}
	<LayoutHeader padding={0} hasDivider={navHasDividers && hasTopNav}>
		{#if hasBanner && banner}
			<div class={bannerAttrs.class} style={bannerAttrs.style}>{@render banner()}</div>
		{/if}
		{#if hasTopNav && topNav}
			{#if isTopNavMobileBar}
				<TopNavMobileContentScope
					content={hasSideNav && mobileNavHasToggle ? sideNavAsDrawerContent : undefined}
				>
					<TopNavRenderScope mode="mobile-bar">
						{@render topNav()}
					</TopNavRenderScope>
				</TopNavMobileContentScope>
			{:else}
				{@render topNav()}
			{/if}
		{/if}
	</LayoutHeader>
{/snippet}

{#snippet layoutHeader()}
	{#if hasTopNav || hasBanner}
		<!--
			Top-level banner landmark for the header region (topNav + banner). Safe
			here: the wrapper is never nested inside main/nav/other landmarks. The
			sidenav-only mobile top bar below deliberately has none — upstream marks
			only this wrapper, and a second banner landmark would be a duplicate.
		-->
		<div
			bind:this={headerEl}
			role="banner"
			{...headerTheme}
			class={cx(headerTheme.class, headerAttrs.class)}
			style={headerAttrs.style}
		>
			{@render headerInner()}
		</div>
	{/if}
	{#if showAutoMobileTopBar}
		<div
			{...headerTheme}
			class={cx(headerTheme.class, headerAttrs.class)}
			style={headerAttrs.style}
		>
			<LayoutHeader padding={0} hasDivider={navHasDividers}>
				<div
					class={autoMobileTopBarAttrs.class}
					style={autoMobileTopBarAttrs.style}
					role="navigation"
					aria-label={t('@astryx.appShell.mobileNavigation')}
				>
					<SideNavRenderScope mode="topbar">
						{#if sideNav}{@render sideNav()}{/if}
					</SideNavRenderScope>
					<MobileNavToggle />
				</div>
			</LayoutHeader>
		</div>
	{/if}
{/snippet}

{#snippet sideNavPanel()}
	<LayoutPanel
		padding={0}
		hasDivider={navHasDividers}
		isScrollable={isFill}
		{...sideNavTheme}
		xstyle={sideNavPanelStyle}
	>
		{#if sideNav}{@render sideNav()}{/if}
	</LayoutPanel>
{/snippet}

<!--
	No `{#if showSideNavInline}` guard here on purpose — the guard is on the
	*prop* below, so `Layout` receives `undefined` rather than a snippet that
	renders nothing. Upstream's `start={sideNavContent}` is likewise `undefined`
	when there is no inline sidenav, and `Layout` publishes `hasStart` from the
	slot's presence: a snippet that renders nothing would still read as present.
	Currently unobservable — `layoutContentAttrs` only consults `hasStart` when
	`padding == null`, and `AppShell` always passes `padding={contentPadding ?? 0}`
	— but it is the same "a renderable that renders nothing still counts" hazard
	`AppShellProps.sideNav` documents, and it would bite the moment `Layout`
	widened its use of `hasStart`.
-->
{#snippet layoutStart()}
	{#if isAuto}
		<div class={sideNavStickyAttrs.class} style={sideNavStickyAttrs.style}>
			{@render sideNavPanel()}
		</div>
	{:else}
		{@render sideNavPanel()}
	{/if}
{/snippet}

{#snippet mainInner()}
	<LayoutContent
		padding={contentPadding ?? 0}
		role="main"
		id={MAIN_CONTENT_ID}
		tabindex={-1}
		isScrollable={isFill}
		xstyle={[contentAreaStyle, appShellMainFocusTarget]}
	>
		{@render children()}
	</LayoutContent>
{/snippet}

{#snippet layoutContent()}
	{#if shouldElevateWithCorner}
		<div class={elevatedWrapperAttrs.class} style={elevatedWrapperAttrs.style}>
			<div class={elevatedBackdropAttrs.class} style={elevatedBackdropAttrs.style}></div>
			{@render mainInner()}
		</div>
	{:else}
		{@render mainInner()}
	{/if}
{/snippet}

<div
	{...rest}
	data-testid={dataTestId}
	{...theme}
	class={cx(theme.class, rootAttrs.class, className)}
	style={mergeStyle(
		rootAttrs.style,
		styleProp as string | undefined,
		headerHeight != null ? `--appshell-header-height:${headerHeight}px` : undefined
	)}
>
	<!--
		Skip-to-content link (WCAG 2.4.1). The `onclick` is not redundant with the
		hash: several browsers scroll to the target without moving focus, so the
		target is focused explicitly — which is what `tabindex={-1}` on
		`LayoutContent` above is for.
	-->
	<a
		href="#{MAIN_CONTENT_ID}"
		onclick={handleSkipLinkClick}
		class={skipLinkAttrs.class}
		style={skipLinkAttrs.style}
		data-testid="skip-to-content"
	>
		{t('@astryx.appShell.skipToContent')}
	</a>

	<Layout
		{height}
		padding={0}
		header={layoutHeader}
		start={showSideNavInline ? layoutStart : undefined}
		content={layoutContent}
	/>

	<!--
		Mobile nav. Always mounted below the breakpoint — visibility is MobileNav's
		own `isOpen`, not a wrapper's. See the component comment on <Activity>.
	-->
	{#if mobileNavSnippet}{@render mobileNavSnippet()}{/if}
	{#if shouldRenderConfigContent && mobileNavConfigContent}
		{@render mobileNavConfigContent()}
	{/if}
	{#if shouldRenderAutoDrawer}
		<!-- The SideNav drawer is only its own when there is no TopNav; with one,
		     TopNav owns the drawer and receives the SideNav through context. -->
		{#if hasSideNav && !hasTopNav && sideNav}
			<SideNavRenderScope mode="drawer">
				{@render sideNav()}
			</SideNavRenderScope>
		{/if}
		{#if hasTopNav && topNav}
			<TopNavMobileContentScope content={hasSideNav ? sideNavAsDrawerContent : undefined}>
				<TopNavRenderScope mode="drawer">
					{@render topNav()}
				</TopNavRenderScope>
			</TopNavMobileContentScope>
		{/if}
	{/if}
</div>
