<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { ResizableConfig } from '../resizable/use-resizable.svelte.js';

	export interface SideNavProps extends BaseProps<HTMLElement> {
		/** Header area — typically a `SideNavHeading`. Sticky at the top. */
		header?: Snippet;
		/** Content pinned below the header (a create button, top-level items). Sticky. */
		topContent?: Snippet;
		/** Navigation sections and items. Scrollable. */
		children: Snippet;
		/** Footer area above the icon bar (e.g. promo cards). */
		footer?: Snippet;
		/** Footer icon bar (help, notifications, avatar). */
		footerIcons?: Snippet;

		/**
		 * Enables a resize handle at the inline-end edge. Uses `useResizable`
		 * internally and renders a `ResizeHandle` in overlay mode; the handle is
		 * hidden while collapsed.
		 *
		 * - `true` — resizable with defaults (260px initial, 180–480px range)
		 * - Object — a {@link ResizableConfig}
		 *
		 * @default false
		 */
		resizable?: boolean | ResizableConfig;

		/**
		 * Enables collapse behaviour. The sidebar can shrink to a narrow icon-only
		 * rail.
		 *
		 * - `true` — collapse with the built-in button and uncontrolled state
		 * - Object:
		 *   - `defaultIsCollapsed` — start collapsed (uncontrolled)
		 *   - `isCollapsed` + `onCollapsedChange` — controlled mode
		 *   - `hasButton` — render the built-in collapse button (default: true)
		 *   - `buttonLabel` — declared upstream and never read; see the component
		 *
		 * @default false
		 */
		collapsible?:
			| boolean
			| {
					defaultIsCollapsed?: boolean;
					isCollapsed?: boolean;
					onCollapsedChange?: (isCollapsed: boolean) => void;
					hasButton?: boolean;
					buttonLabel?: string;
			  };
	}
</script>

<script lang="ts">
	import { useTranslator } from '../../i18n/index.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import MobileNav from '../mobile-nav/mobile-nav.svelte';
	import ResizeHandle from '../resizable/resize-handle.svelte';
	import { useResizable } from '../resizable/use-resizable.svelte.js';
	import SideNavCollapseButton from './side-nav-collapse-button.svelte';
	import SideNavCollapseScope from './side-nav-collapse-scope.svelte';
	import type { SideNavCollapseState } from './side-nav-collapse-context.svelte.js';
	import {
		sideNavDrawerFooterAttrs,
		sideNavDrawerFooterIconsAttrs,
		sideNavFooterRowAttrs,
		sideNavResizableContainerAttrs,
		sideNavRootAttrs,
		sideNavScrollableAttrs,
		sideNavStickyBottomAttrs,
		sideNavStickyTopAttrs,
		sideNavTopContentAttrs,
		sideNavTopbarAttrs,
		sideNavTopbarIconsAttrs
	} from './side-nav.stylex.js';
	import { useSideNavRenderMode } from './side-nav-render-context.svelte.js';

	/** Width below which dragging collapses the sidebar (when collapsible). */
	const COLLAPSE_THRESHOLD = 160;

	/**
	 * The sidebar navigation container.
	 *
	 * Five vertical zones: a sticky `header` + `topContent` at the top, scrollable
	 * `children` in the middle, and a sticky `footer` + `footerIcons` at the
	 * bottom. Optionally resizable by a drag handle, and optionally collapsible to
	 * an icon-only rail.
	 *
	 * Four shapes, picked by `SideNavRenderContext` — which is how `AppShell`
	 * renders one `SideNav` in several places at once on a small viewport:
	 * `'default'` (the full sidebar), `'topbar'` (header + footer icons in a
	 * horizontal bar), `'drawer'` (wrapped in its own `MobileNav`), and
	 * `'drawer-content'` (bare items, when a `TopNav` owns the drawer).
	 *
	 * **The imperative collapse handle is an instance export.** Upstream takes a
	 * `handleRef` prop and fills it with `useImperativeHandle`; Svelte has no ref
	 * objects, so — as `Tokenizer`'s `focus()`/`blur()` already do —
	 * `getCollapseState()` is reached through `bind:this` and handed to a
	 * `SideNavCollapseButton` as its `handle`.
	 *
	 * @example
	 * ```svelte
	 * <SideNav>
	 *   {#snippet header()}<SideNavHeading heading="My App" headingHref="/" />{/snippet}
	 *   <SideNavSection title="Main">
	 *     <SideNavItem label="Dashboard" isSelected href="/dashboard" />
	 *   </SideNavSection>
	 * </SideNav>
	 * ```
	 */
	let {
		header,
		topContent,
		children,
		footer,
		footerIcons,
		collapsible = false,
		resizable = false,
		xstyle,
		class: className,
		style: styleProp,
		'data-testid': testId,
		...rest
	}: SideNavProps = $props();

	const t = useTranslator();
	const renderMode = useSideNavRenderMode();

	// Parse the collapsible prop.
	const collapsibleConfig = $derived(typeof collapsible === 'object' ? collapsible : {});
	const isCollapsible = $derived(!!collapsible);
	const hasCollapseButton = $derived(collapsibleConfig.hasButton ?? true);
	const controlledCollapsed = $derived(collapsibleConfig.isCollapsed);
	const isControlled = $derived(controlledCollapsed !== undefined);

	// Resizable config.
	const resizableConfig = $derived(typeof resizable === 'object' ? resizable : {});
	const isResizable = $derived(!!resizable);

	// Collapse state (controlled + uncontrolled). Seeded once, as upstream's
	// `useState` initialiser is.
	let uncontrolledCollapsed = $state(
		(typeof collapsible === 'object' ? collapsible.defaultIsCollapsed : undefined) ?? false
	);
	const collapsed = $derived(isControlled ? !!controlledCollapsed : uncontrolledCollapsed);

	function setCollapsedState(value: boolean): void {
		if (!isControlled) {
			uncontrolledCollapsed = value;
		}
		collapsibleConfig.onCollapsedChange?.(value);
	}

	// Resize hook — callbacks keep SideNav in sync without effects.
	const resizableHook = useResizable(() => ({
		defaultSize: resizableConfig.defaultWidth ?? 260,
		minSizePx: resizableConfig.minWidth ?? 180,
		maxSizePx: resizableConfig.maxWidth ?? 480,
		collapsible: isCollapsible,
		collapsedSize: COLLAPSE_THRESHOLD,
		autoSaveId: resizableConfig.autoSaveId,
		onSizeChange: resizableConfig.onWidthChange,
		onCollapseChange: isCollapsible ? setCollapsedState : undefined
	}));

	function toggle(): void {
		const next = !collapsed;
		setCollapsedState(next);
		if (isResizable) {
			if (next) {
				resizableHook.collapse();
			} else {
				resizableHook.expand();
			}
		}
	}

	const collapseState = $derived<SideNavCollapseState>({
		isCollapsed: collapsed,
		toggle,
		isCollapsible
	});

	/**
	 * The imperative collapse handle, for `SideNavCollapseButton`s rendered
	 * outside this tree. Upstream's `useImperativeHandle(handleRef, …)`.
	 *
	 * This one export *is* the handle: a component instance reached through
	 * `bind:this` already satisfies `SideNavImperativeCollapseHandle`
	 * structurally, so `<SideNavCollapseButton handle={sideNav} />` works with no
	 * second export to unwrap. Upstream has one handle; so does this.
	 */
	export function getCollapseState(): SideNavCollapseState {
		return collapseState;
	}

	const showResizeHandle = $derived(isResizable && !collapsed);
	const hasDrawerFooter = $derived(!!(footer || footerIcons));
	const hasStickyTop = $derived(!!(header || topContent));
	const hasStickyBottom = $derived(!!(footer || footerIcons));
	// The built-in collapse button renders only when collapse is enabled and it
	// has not been opted out via `collapsible.hasButton: false` — the escape
	// hatch for placing a SideNavCollapseButton in the header instead.
	const showCollapseButton = $derived(isCollapsible && hasCollapseButton);

	const isTopbar = $derived(renderMode() === 'topbar');
	const isDrawer = $derived(renderMode() === 'drawer');
	const isDrawerContent = $derived(renderMode() === 'drawer-content');

	const theme = themeProps('side-nav');
	const topbarTheme = themeProps('side-nav', { mode: 'topbar' });
	const rootAttrs = $derived(sideNavRootAttrs(collapsed, xstyle));
	const topbarAttrs = $derived(sideNavTopbarAttrs(xstyle));
	const topbarIconsAttrs = sideNavTopbarIconsAttrs();
	const stickyTopAttrs = $derived(sideNavStickyTopAttrs(collapsed));
	const topContentAttrs = sideNavTopContentAttrs();
	const scrollableAttrs = $derived(
		sideNavScrollableAttrs(collapsed, hasStickyTop, hasStickyBottom)
	);
	const stickyBottomAttrs = $derived(sideNavStickyBottomAttrs(collapsed));
	const footerRowAttrs = $derived(sideNavFooterRowAttrs(collapsed));
	const drawerFooterAttrs = sideNavDrawerFooterAttrs();
	const drawerFooterIconsAttrs = sideNavDrawerFooterIconsAttrs();
	const resizableContainerAttrs = sideNavResizableContainerAttrs();

	// When resizable, the nav's width is an inline override rather than a class.
	const navStyle = $derived(
		isResizable
			? mergeStyle(
					rootAttrs.style,
					styleProp as string | undefined,
					collapsed ? undefined : `width:${resizableHook.size}px`
				)
			: mergeStyle(rootAttrs.style, styleProp as string | undefined)
	);
</script>

{#snippet drawerFooterBlock()}
	{#if hasDrawerFooter}
		<div class={drawerFooterAttrs.class} style={drawerFooterAttrs.style}>
			{#if footer}{@render footer()}{/if}
			{#if footerIcons}
				<div class={drawerFooterIconsAttrs.class} style={drawerFooterIconsAttrs.style}>
					{@render footerIcons()}
				</div>
			{/if}
		</div>
	{/if}
{/snippet}

{#snippet navElement()}
	<nav
		{...rest}
		role="navigation"
		aria-label={t('@astryx.sideNav.label')}
		data-testid={testId}
		{...theme}
		class={cx(theme.class, rootAttrs.class, className)}
		style={navStyle}
	>
		{#if hasStickyTop}
			<div class={stickyTopAttrs.class} style={stickyTopAttrs.style}>
				{#if header}{@render header()}{/if}
				{#if topContent}
					<div class={topContentAttrs.class || undefined}>{@render topContent()}</div>
				{/if}
			</div>
		{/if}
		<div class={scrollableAttrs.class} style={scrollableAttrs.style}>
			{@render children()}
		</div>
		{#if hasStickyBottom || showCollapseButton}
			<div class={stickyBottomAttrs.class} style={stickyBottomAttrs.style}>
				{#if footer}{@render footer()}{/if}
				<div class={footerRowAttrs.class} style={footerRowAttrs.style}>
					{#if showCollapseButton}<SideNavCollapseButton />{/if}
					{#if footerIcons}{@render footerIcons()}{/if}
				</div>
			</div>
		{/if}
	</nav>
{/snippet}

{#snippet fullSidebar()}
	{#if showResizeHandle}
		<!--
			The drag handle overlays the nav rather than sitting beside it, so it
			stays inside the panel's own clipping bounds.
		-->
		<div class={resizableContainerAttrs.class} style={resizableContainerAttrs.style}>
			{@render navElement()}
			<ResizeHandle
				data-testid="astryx-sidenav-resize-handle"
				direction="horizontal"
				position="overlay"
				pillPlacement="end"
				isAlwaysVisible={false}
				resizable={resizableHook.props}
				label={t('@astryx.sideNav.resizeSidebar')}
			/>
		</div>
	{:else}
		{@render navElement()}
	{/if}
{/snippet}

{#if isTopbar}
	<!-- Topbar mode — header + footerIcons in a horizontal bar. -->
	<div
		data-testid={testId}
		{...topbarTheme}
		class={cx(topbarTheme.class, topbarAttrs.class, className)}
		style={mergeStyle(topbarAttrs.style, styleProp as string | undefined)}
	>
		{#if header}{@render header()}{/if}
		<div class={topbarIconsAttrs.class} style={topbarIconsAttrs.style}>
			{#if footerIcons}{@render footerIcons()}{/if}
		</div>
	</div>
{:else if isDrawer}
	<!-- Drawer mode — the whole sidebar inside its own MobileNav. -->
	<MobileNav {header} data-testid={testId}>
		{#if topContent}{@render topContent()}{/if}
		{@render children()}
		{@render drawerFooterBlock()}
	</MobileNav>
{:else if isDrawerContent}
	<!--
		Drawer-content mode — just the items, no MobileNav wrapper. Used when a
		TopNav owns the drawer and the SideNav's rows are nested inside it.
	-->
	{#if topContent}{@render topContent()}{/if}
	{@render children()}
	{@render drawerFooterBlock()}
{:else if isCollapsible}
	<SideNavCollapseScope state={collapseState}>
		{@render fullSidebar()}
	</SideNavCollapseScope>
{:else}
	{@render fullSidebar()}
{/if}
