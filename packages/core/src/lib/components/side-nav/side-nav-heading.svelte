<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { LinkComponentType } from '../link/types.js';

	export interface SideNavHeadingProps extends BaseProps<HTMLDivElement> {
		/** Product/app icon. */
		icon?: Snippet;
		/**
		 * Custom component to render instead of `<a>`.
		 * Overrides the provider-level default set by `LinkProvider`.
		 */
		as?: LinkComponentType;
		/** Product/app name. */
		heading: string;
		/** Link for the heading (e.g. product home). */
		headingHref?: string;
		/** Text above the heading (e.g. suite name). */
		superheading?: string;
		/** Link for the superheading (e.g. suite home). */
		superheadingHref?: string;
		/** Text below the heading (e.g. account context). */
		subheading?: string;
		/** Link for the subheading. */
		subheadingHref?: string;
		/**
		 * Content rendered at the trailing edge of the heading row.
		 * Hidden in collapsed mode.
		 */
		headerEndContent?: Snippet;
		/**
		 * Menu content shown in a popover. When provided, the heading composes
		 * `usePopover` internally and shows a dropdown chevron. The trigger
		 * boundary is worked out automatically:
		 * - No hrefs → the whole heading is the trigger
		 * - With hrefs → the links stay independent and the chevron is the trigger
		 */
		menu?: Snippet;
	}
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import { useTranslator } from '../../i18n/index.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useMenuHover } from '../../internal/use-menu-hover.svelte.js';
	import { useIcon } from '../icon/use-icon.svelte.js';
	import { useLinkComponent } from '../link/link-context.svelte.js';
	import LinkElement from '../link/link-element.svelte';
	import Link from '../link/link.svelte';
	import NavHeadingCloseScope from '../nav-menu/nav-heading-close-scope.svelte';
	import PopoverLayer from '../popover/popover-layer.svelte';
	import { usePopover } from '../popover/use-popover.svelte.js';
	import Tooltip from '../tooltip/tooltip.svelte';
	import { useSideNavCollapse } from './side-nav-collapse-context.svelte.js';
	import {
		sideNavHeadingChevronAttrs,
		sideNavHeadingChevronButtonAttrs,
		sideNavHeadingCollapsedLinkAttrs,
		sideNavHeadingCollapsedRootAttrs,
		sideNavHeadingCollapsedTriggerAttrs,
		sideNavHeadingEndContentAttrs,
		sideNavHeadingHeadingAttrs,
		sideNavHeadingHeadingLinkAttrs,
		sideNavHeadingIconAttrs,
		sideNavHeadingPopover,
		sideNavHeadingPopoverChevronAttrs,
		sideNavHeadingPopoverContentAttrs,
		sideNavHeadingPopoverHeadingAttrs,
		sideNavHeadingPopoverOverlap,
		sideNavHeadingRootAttrs,
		sideNavHeadingRowAttrs,
		sideNavHeadingSubheadingAttrs,
		sideNavHeadingSuperheadingAttrs,
		sideNavHeadingTextContainerAttrs,
		sideNavHeadingTriggerRootAttrs
	} from './side-nav-heading.stylex.js';

	/**
	 * The product / suite / account heading for `SideNav`.
	 *
	 * The interaction boundary is worked out from the props rather than
	 * configured, exactly as `TopNavHeading`'s is:
	 *
	 * - no hrefs + `menu` → the whole heading is the popover trigger
	 * - `headingHref` only, no menu → the whole heading is one link
	 * - `headingHref` + `superheadingHref`, no menu → each is an independent link
	 * - `menu` + hrefs → links stay independent, the chevron becomes the trigger
	 *
	 * Collapsed, it shrinks to the icon alone with a tooltip carrying the heading
	 * — and renders **nothing** without an icon, since there would be nothing to
	 * show. The collapsed menu variant uses the `popover` layer offset (below the
	 * trigger) where the expanded ones use `popoverOverlap` (over it).
	 *
	 * Unlike `TopNavHeading`, this one does **not** wrap its menu in
	 * `NavHeadingCloseContext`. That asymmetry is upstream's and is replicated:
	 * a `NavHeadingMenu` inside a `SideNavHeading` gets no working `closeMenu`.
	 *
	 * `rootRef` is dropped: upstream creates it, merges it into the trigger ref
	 * and never reads it.
	 */
	let {
		as,
		icon,
		heading,
		headingHref,
		superheading,
		superheadingHref,
		subheading,
		subheadingHref,
		headerEndContent,
		menu,
		xstyle,
		class: className,
		style: styleProp,
		'data-testid': testId,
		...rest
	}: SideNavHeadingProps = $props();

	const t = useTranslator();
	const resolveLink = useLinkComponent();
	const linkResolved = $derived(resolveLink(as));
	const sideNavCollapse = useSideNavCollapse();
	const popoverId = $props.id();

	const chevronIcon = useIcon(() => 'chevronDown');

	// The element the collapsed tooltip anchors to. The link branch has no DOM
	// node of its own here (the resolved link component owns it), so it is
	// captured with a stable attachment threaded through the props — the
	// `ClickableCard`/`BreadcrumbItem` precedent, and the counterpart of
	// upstream's `mergeRefs(collapsedItemRef, ref)`.
	let collapsedItemEl = $state<HTMLElement | null>(null);
	const collapsedAttach = {
		[createAttachmentKey()]: (node: HTMLElement) => {
			collapsedItemEl = node;
			return () => {
				collapsedItemEl = null;
			};
		}
	};

	const isCollapsed = $derived(sideNavCollapse().isCollapsed);

	const popover = usePopover(() => ({
		id: popoverId,
		dialogLabel: t('@astryx.sideNav.heading.dialogLabel'),
		// The popup exposes its own role="menu" semantics; a role="dialog"
		// aria-modal wrapper would announce "dialog, Navigation menu" around a menu.
		// `dialogLabel` stays because upstream keeps passing it — with role 'none'
		// it no longer names a wrapper, and the two are set together upstream too.
		role: 'none',
		hasCloseButton: false
	}));

	const menuHover = useMenuHover(() => ({
		show: popover.show,
		hide: popover.hide,
		isOpen: popover.isOpen,
		isEnabled: !!menu,
		showDelay: 0
	}));

	const showChevron = $derived(!!menu);
	const hasAnyHref = $derived(!!(headingHref || superheadingHref || subheadingHref));
	const hasCompactHeading = $derived(!!(superheading || subheading));

	const isWholeHeadingTrigger = $derived(!!menu && !hasAnyHref);
	const isWholeHeadingLink = $derived(
		!!headingHref && !menu && !superheadingHref && !subheadingHref
	);
	const isStaticWithLinks = $derived(hasAnyHref && !isWholeHeadingLink);

	const theme = themeProps('side-nav-heading');
	const rootAttrs = $derived(sideNavHeadingRootAttrs(xstyle));
	const triggerRootAttrs = $derived(sideNavHeadingTriggerRootAttrs(xstyle));
	const collapsedRootAttrs = $derived(sideNavHeadingCollapsedRootAttrs(xstyle));
	const collapsedLinkAttrs = $derived(sideNavHeadingCollapsedLinkAttrs(xstyle));
	const collapsedTriggerAttrs = $derived(sideNavHeadingCollapsedTriggerAttrs(xstyle));
	const iconAttrs = sideNavHeadingIconAttrs();
	const textContainerAttrs = sideNavHeadingTextContainerAttrs();
	const superheadingAttrs = sideNavHeadingSuperheadingAttrs();
	const headingAttrs = sideNavHeadingHeadingAttrs();
	const compactHeadingAttrs = $derived(sideNavHeadingHeadingAttrs(hasCompactHeading));
	const headingLinkAttrs = sideNavHeadingHeadingLinkAttrs();
	const subheadingAttrs = sideNavHeadingSubheadingAttrs();
	const rowAttrs = sideNavHeadingRowAttrs();
	const chevronAttrs = sideNavHeadingChevronAttrs();
	const chevronButtonAttrs = sideNavHeadingChevronButtonAttrs();
	const endContentAttrs = sideNavHeadingEndContentAttrs();
	const popoverContentAttrs = sideNavHeadingPopoverContentAttrs();
	const popoverHeadingAttrs = sideNavHeadingPopoverHeadingAttrs();
	const popoverChevronAttrs = sideNavHeadingPopoverChevronAttrs();

	function openMenuFromChevron(event: MouseEvent): void {
		event.stopPropagation();
		menuHover.triggerProps.onclick();
	}

	const collapsedLinkProps = $derived({
		...collapsedAttach,
		href: headingHref,
		...(linkResolved.isNative ? {} : { to: headingHref }),
		'aria-label': heading,
		'data-testid': testId,
		...theme,
		class: cx(theme.class, collapsedLinkAttrs.class, className),
		style: mergeStyle(collapsedLinkAttrs.style, styleProp as string | undefined)
	});

	const wholeHeadingLinkProps = $derived({
		...rest,
		href: headingHref,
		...(linkResolved.isNative ? {} : { to: headingHref }),
		'data-testid': testId,
		...theme,
		class: cx(theme.class, triggerRootAttrs.class, className),
		style: mergeStyle(triggerRootAttrs.style, styleProp as string | undefined)
	});

	const headingAsLinkProps = $derived({
		href: headingHref,
		...(linkResolved.isNative ? {} : { to: headingHref }),
		class: headingLinkAttrs.class,
		style: headingLinkAttrs.style
	});

	const iconAsLinkProps = $derived({
		href: headingHref,
		...(linkResolved.isNative ? {} : { to: headingHref }),
		'aria-label': heading,
		class: iconAttrs.class,
		style: iconAttrs.style
	});
</script>

<!--
	The text column, optionally carrying an inline chevron after the heading.
	Upstream's `renderTextContent(inlineChevron?)`. Unlike `TopNavHeading`'s, these
	links carry no `stopPropagation` — upstream's SideNav version omits it.
-->
{#snippet textContent(inlineChevron?: Snippet)}
	<span class={textContainerAttrs.class} style={textContainerAttrs.style}>
		{#if superheading}
			{#if hasAnyHref && superheadingHref && menu}
				<Link href={superheadingHref} color="secondary" size="xsm">{superheading}</Link>
			{:else}
				<span class={superheadingAttrs.class} style={superheadingAttrs.style}>
					{superheading}
				</span>
			{/if}
		{/if}
		<span class={rowAttrs.class} style={rowAttrs.style}>
			{#if hasAnyHref && headingHref && menu}
				<LinkElement component={linkResolved.component} props={headingAsLinkProps}>
					{heading}
				</LinkElement>
			{:else}
				<span class={headingAttrs.class} style={headingAttrs.style}>{heading}</span>
			{/if}
			{#if inlineChevron}{@render inlineChevron()}{/if}
		</span>
		{#if subheading}
			{#if hasAnyHref && subheadingHref && menu}
				<Link href={subheadingHref} color="secondary" size="xsm">{subheading}</Link>
			{:else}
				<span class={subheadingAttrs.class} style={subheadingAttrs.style}>{subheading}</span>
			{/if}
		{/if}
	</span>
{/snippet}

{#snippet chevronElement()}
	<span class={chevronAttrs.class} style={chevronAttrs.style}
		>{@render chevronIcon.current?.()}</span
	>
{/snippet}

{#snippet headerEndContentElement()}
	{#if headerEndContent}
		<span class={endContentAttrs.class} style={endContentAttrs.style}>
			{@render headerEndContent()}
		</span>
	{/if}
{/snippet}

{#snippet chevronTriggerButton()}
	<button
		type="button"
		aria-label={t('@astryx.sideNav.heading.openMenu')}
		onclick={openMenuFromChevron}
		{...popover.triggerProps}
		class={chevronButtonAttrs.class}
		style={chevronButtonAttrs.style}
	>
		{@render chevronIcon.current?.()}
	</button>
{/snippet}

{#snippet popoverFlippedChevron()}
	<span class={popoverChevronAttrs.class} style={popoverChevronAttrs.style}>
		{@render chevronIcon.current?.()}
	</span>
{/snippet}

{#snippet popoverHeadingContent()}
	<button
		type="button"
		class={popoverHeadingAttrs.class}
		style={popoverHeadingAttrs.style}
		onclick={menuHover.triggerProps.onclick}
	>
		{#if icon}
			<span class={iconAttrs.class} style={iconAttrs.style}>{@render icon()}</span>
		{/if}
		{@render textContent(popoverFlippedChevron)}
	</button>
{/snippet}

{#snippet menuPopover()}
	<PopoverLayer {popover} placement="below" alignment="start" xstyle={sideNavHeadingPopoverOverlap}>
		<div
			{@attach menuHover.attachMenu}
			onmouseenter={menuHover.contentProps.onmouseenter}
			onmouseleave={menuHover.contentProps.onmouseleave}
			onkeydown={menuHover.contentProps.onkeydown}
			class={popoverContentAttrs.class}
			style={popoverContentAttrs.style}
		>
			{@render popoverHeadingContent()}
			<!--
				The menu role is scoped to the actual menu items so the heading button
				above stays a valid *sibling*, not an invalid child of a `role="menu"`
				element. It used to sit on the container that holds both.
			-->
			<div role="menu" aria-label={heading}>
				{#if menu}{@render menu()}{/if}
			</div>
		</div>
	</PopoverLayer>
{/snippet}

{#if isCollapsed && !icon}
	<!-- Collapsed with no icon: nothing to show. -->
{:else if isCollapsed}
	{#if headingHref}
		<LinkElement component={linkResolved.component} props={collapsedLinkProps}>
			<span class={iconAttrs.class} style={iconAttrs.style}>
				{#if icon}{@render icon()}{/if}
			</span>
		</LinkElement>
	{:else if menu}
		<button
			bind:this={collapsedItemEl}
			{@attach popover.attachTrigger}
			type="button"
			aria-label={heading}
			data-testid={testId}
			{...popover.triggerProps}
			onclick={menuHover.triggerProps.onclick}
			onmouseenter={menuHover.triggerProps.onmouseenter}
			onmouseleave={menuHover.triggerProps.onmouseleave}
			{...theme}
			class={cx(theme.class, collapsedTriggerAttrs.class, className)}
			style={mergeStyle(collapsedTriggerAttrs.style, styleProp as string | undefined)}
		>
			<span class={iconAttrs.class} style={iconAttrs.style}>
				{#if icon}{@render icon()}{/if}
			</span>
		</button>
		<PopoverLayer {popover} placement="below" alignment="start" xstyle={sideNavHeadingPopover}>
			<div
				{@attach menuHover.attachMenu}
				onmouseenter={menuHover.contentProps.onmouseenter}
				onmouseleave={menuHover.contentProps.onmouseleave}
				onkeydown={menuHover.contentProps.onkeydown}
				class={popoverContentAttrs.class}
				style={popoverContentAttrs.style}
			>
				<button
					type="button"
					class={popoverHeadingAttrs.class}
					style={popoverHeadingAttrs.style}
					onclick={menuHover.triggerProps.onclick}
				>
					{#if icon}
						<span class={iconAttrs.class} style={iconAttrs.style}>{@render icon()}</span>
					{/if}
					<span class={textContainerAttrs.class} style={textContainerAttrs.style}>
						{#if superheading}
							<span class={superheadingAttrs.class} style={superheadingAttrs.style}>
								{superheading}
							</span>
						{/if}
						<span class={rowAttrs.class} style={rowAttrs.style}>
							<span class={compactHeadingAttrs.class} style={compactHeadingAttrs.style}>
								{heading}
							</span>
							{@render popoverFlippedChevron()}
						</span>
						{#if subheading}
							<span class={subheadingAttrs.class} style={subheadingAttrs.style}>
								{subheading}
							</span>
						{/if}
					</span>
				</button>
				<!--
					The menu role is scoped to the actual menu items so the heading button
					above stays a valid *sibling*, not an invalid child of a `role="menu"`
					element — the same rescope the other popover branch takes.
				-->
				<div role="menu" aria-label={heading}>
					{#if menu}
						<NavHeadingCloseScope closeMenu={popover.hide}>
							{@render menu()}
						</NavHeadingCloseScope>
					{/if}
				</div>
			</div>
		</PopoverLayer>
	{:else}
		<div
			bind:this={collapsedItemEl}
			{...rest}
			data-testid={testId}
			{...theme}
			class={cx(theme.class, collapsedRootAttrs.class, className)}
			style={mergeStyle(collapsedRootAttrs.style, styleProp as string | undefined)}
		>
			<span class={iconAttrs.class} style={iconAttrs.style}>
				{#if icon}{@render icon()}{/if}
			</span>
		</div>
	{/if}
	<Tooltip content={heading} placement="end" anchor={collapsedItemEl} />
{:else if isWholeHeadingLink && headingHref}
	<!-- Whole heading is a link (no menu, single headingHref) -->
	<LinkElement component={linkResolved.component} props={wholeHeadingLinkProps}>
		{#if icon}
			<span class={iconAttrs.class} style={iconAttrs.style}>{@render icon()}</span>
		{/if}
		{@render textContent()}
		{@render headerEndContentElement()}
		{#if showChevron}{@render chevronElement()}{/if}
	</LinkElement>
{:else if isWholeHeadingTrigger}
	<!-- Whole header is the popover trigger (menu, no hrefs) -->
	<div
		{@attach popover.attachTrigger}
		data-testid={testId}
		onclick={menuHover.triggerProps.onclick}
		onmouseenter={menuHover.triggerProps.onmouseenter}
		onmouseleave={menuHover.triggerProps.onmouseleave}
		{...theme}
		class={cx(theme.class, triggerRootAttrs.class, className)}
		style={mergeStyle(triggerRootAttrs.style, styleProp as string | undefined)}
	>
		{#if icon}
			<span class={iconAttrs.class} style={iconAttrs.style}>{@render icon()}</span>
		{/if}
		{@render textContent(chevronTriggerButton)}
		{@render headerEndContentElement()}
	</div>
	{@render menuPopover()}
{:else if menu && hasAnyHref}
	<!--
		Mixed mode: independent links + a chevron trigger for the menu. The popover
		anchors to the whole heading div, not the chevron, so it lands in the same
		place as the no-links case.
	-->
	<div
		{@attach popover.attachTrigger}
		data-testid={testId}
		onclick={menuHover.triggerProps.onclick}
		onmouseenter={menuHover.triggerProps.onmouseenter}
		onmouseleave={menuHover.triggerProps.onmouseleave}
		{...theme}
		class={cx(theme.class, rootAttrs.class, className)}
		style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	>
		{#if icon}
			{#if headingHref}
				<LinkElement component={linkResolved.component} props={iconAsLinkProps}>
					{@render icon()}
				</LinkElement>
			{:else}
				<span class={iconAttrs.class} style={iconAttrs.style}>{@render icon()}</span>
			{/if}
		{/if}
		{@render textContent(showChevron ? chevronTriggerButton : undefined)}
		{@render headerEndContentElement()}
	</div>
	{@render menuPopover()}
{:else if isStaticWithLinks}
	<!-- Static heading with independent links (no menu) -->
	<div
		{...rest}
		data-testid={testId}
		{...theme}
		class={cx(theme.class, rootAttrs.class, className)}
		style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	>
		{#if icon}
			{#if headingHref}
				<LinkElement component={linkResolved.component} props={iconAsLinkProps}>
					{@render icon()}
				</LinkElement>
			{:else}
				<span class={iconAttrs.class} style={iconAttrs.style}>{@render icon()}</span>
			{/if}
		{/if}
		<span class={textContainerAttrs.class} style={textContainerAttrs.style}>
			{#if superheading}
				{#if superheadingHref}
					<Link href={superheadingHref} color="secondary" size="xsm">{superheading}</Link>
				{:else}
					<span class={superheadingAttrs.class} style={superheadingAttrs.style}>
						{superheading}
					</span>
				{/if}
			{/if}
			{#if headingHref}
				<Link href={headingHref} color="primary" weight="semibold">{heading}</Link>
			{:else}
				<span class={compactHeadingAttrs.class} style={compactHeadingAttrs.style}>
					{heading}
				</span>
			{/if}
			{#if subheading}
				{#if subheadingHref}
					<Link href={subheadingHref} color="secondary" size="xsm">{subheading}</Link>
				{:else}
					<span class={subheadingAttrs.class} style={subheadingAttrs.style}>{subheading}</span>
				{/if}
			{/if}
		</span>
		{@render headerEndContentElement()}
		{#if showChevron}{@render chevronElement()}{/if}
	</div>
{:else}
	<!-- Default: static heading, no links, no menu -->
	<div
		{...rest}
		data-testid={testId}
		{...theme}
		class={cx(theme.class, rootAttrs.class, className)}
		style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	>
		{#if icon}
			<span class={iconAttrs.class} style={iconAttrs.style}>{@render icon()}</span>
		{/if}
		{@render textContent()}
		{@render headerEndContentElement()}
		{#if showChevron}{@render chevronElement()}{/if}
	</div>
{/if}
