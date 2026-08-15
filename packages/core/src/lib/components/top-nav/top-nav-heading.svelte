<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { LinkComponentType } from '../link/types.js';

	export interface TopNavHeadingProps extends BaseProps<HTMLElement> {
		/** Logo element — an image, a `NavIcon`, anything. */
		logo?: Snippet;
		/**
		 * Accessible name for the logo when it links somewhere (`headingHref`) and
		 * has no adjacent text to name it — a logo-only heading, for instance.
		 * Defaults to `heading` when available. Ignored when the logo is not a link.
		 */
		logoLabel?: string;
		/** Product/app name. */
		heading?: string;
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
		/** Content rendered at the trailing edge of the heading row. */
		headerEndContent?: Snippet;
		/**
		 * Menu content shown in a popover. When provided, the heading composes
		 * `usePopover` internally and shows a dropdown chevron. The trigger
		 * boundary is worked out automatically:
		 * - No hrefs → the whole heading is the trigger
		 * - With hrefs → the links stay independent and the chevron is the trigger
		 */
		menu?: Snippet;
		/**
		 * Custom component to render instead of `<a>`.
		 * Overrides the provider-level default set by `LinkProvider`.
		 */
		as?: LinkComponentType;
	}
</script>

<script lang="ts">
	import { useTranslator } from '../../i18n/index.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useMenuHover } from '../../internal/use-menu-hover.svelte.js';
	import Icon from '../icon/icon.svelte';
	import { useLinkComponent } from '../link/link-context.svelte.js';
	import LinkElement from '../link/link-element.svelte';
	import Link from '../link/link.svelte';
	import NavHeadingCloseScope from '../nav-menu/nav-heading-close-scope.svelte';
	import PopoverLayer from '../popover/popover-layer.svelte';
	import { usePopover } from '../popover/use-popover.svelte.js';
	import {
		topNavHeadingChevronButtonAttrs,
		topNavHeadingChevronGlyphStyle,
		topNavHeadingChevronStyle,
		topNavHeadingEndContentAttrs,
		topNavHeadingHeadingAttrs,
		topNavHeadingHeadingLinkAttrs,
		topNavHeadingLogoAttrs,
		topNavHeadingPopoverChevronStyle,
		topNavHeadingPopoverContentAttrs,
		topNavHeadingPopoverHeadingAttrs,
		topNavHeadingPopoverOverlap,
		topNavHeadingRootAttrs,
		topNavHeadingRowAttrs,
		topNavHeadingSubheadingAttrs,
		topNavHeadingSuperheadingAttrs,
		topNavHeadingTextContainerAttrs,
		topNavHeadingTriggerRootAttrs
	} from './top-nav-heading.stylex.js';

	/**
	 * The product / suite / account heading for `TopNav`.
	 *
	 * The interaction boundary is worked out from the props rather than
	 * configured, which is what keeps a heading that is *both* a link and a menu
	 * from swallowing its own link:
	 *
	 * - no hrefs + `menu` → the whole heading is the popover trigger
	 * - `headingHref` only, no menu → the whole heading is one link
	 * - `headingHref` + `superheadingHref`, no menu → each is an independent link
	 * - `menu` + hrefs → links stay independent, the chevron becomes the trigger
	 *
	 * The chevron appears whenever `menu` is set.
	 *
	 * Two upstream shapes worth knowing: `styles.popover` is declared and applied
	 * nowhere (only `popoverOverlap` reaches the layer), and the popover's heading
	 * replica is *always* static — it never carries the links the inline heading
	 * has, because clicking it closes the menu.
	 *
	 * `rootRef` is dropped: upstream creates it, merges it into the trigger ref and
	 * never reads it — the same dead ref `Lightbox`'s `imageWrapperRef` was.
	 */
	let {
		as,
		logo,
		logoLabel,
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
	}: TopNavHeadingProps = $props();

	const t = useTranslator();
	const resolveLink = useLinkComponent();
	const linkResolved = $derived(resolveLink(as));
	const popoverId = $props.id();

	// A linked logo needs its own accessible name (the image itself is
	// decorative). Prefer an explicit logoLabel, fall back to the heading text.
	const logoLinkLabel = $derived(logoLabel ?? heading);

	const popover = usePopover(() => ({
		id: popoverId,
		dialogLabel: t('@astryx.topNav.heading.dialogLabel'),
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

	// Interaction modes.
	const isWholeHeadingTrigger = $derived(!!menu && !hasAnyHref);
	const isWholeHeadingLink = $derived(
		!!headingHref && !menu && !superheadingHref && !subheadingHref
	);
	// Upstream's first branch: no heading text and no menu — a logo on its own.
	const isLogoOnly = $derived(!heading && !menu);
	// The static branch with independent links but no menu.
	const isStaticWithLinks = $derived(hasAnyHref && !isWholeHeadingLink);

	const theme = themeProps('top-nav-heading');
	const rootAttrs = $derived(topNavHeadingRootAttrs(xstyle));
	const triggerRootAttrs = $derived(topNavHeadingTriggerRootAttrs(xstyle));
	const logoAttrs = topNavHeadingLogoAttrs();
	const textContainerAttrs = topNavHeadingTextContainerAttrs();
	const superheadingAttrs = topNavHeadingSuperheadingAttrs();
	const headingAttrs = topNavHeadingHeadingAttrs();
	const headingLinkAttrs = topNavHeadingHeadingLinkAttrs();
	const subheadingAttrs = topNavHeadingSubheadingAttrs();
	const rowAttrs = topNavHeadingRowAttrs();
	const chevronButtonAttrs = topNavHeadingChevronButtonAttrs();
	const endContentAttrs = topNavHeadingEndContentAttrs();
	const popoverContentAttrs = topNavHeadingPopoverContentAttrs();
	const popoverHeadingAttrs = topNavHeadingPopoverHeadingAttrs();

	function stopPropagation(event: MouseEvent): void {
		event.stopPropagation();
	}

	function openMenuFromChevron(event: MouseEvent): void {
		event.stopPropagation();
		menuHover.triggerProps.onclick();
	}

	const logoOnlyLinkProps = $derived({
		...rest,
		href: headingHref,
		...(linkResolved.isNative ? {} : { to: headingHref }),
		'aria-label': headingHref ? logoLabel : undefined,
		'data-testid': testId,
		...theme,
		class: cx(theme.class, triggerRootAttrs.class, className),
		style: mergeStyle(triggerRootAttrs.style, styleProp as string | undefined)
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
		onclick: stopPropagation,
		class: headingLinkAttrs.class,
		style: headingLinkAttrs.style
	});

	const logoAsLinkProps = $derived({
		href: headingHref,
		...(linkResolved.isNative ? {} : { to: headingHref }),
		'aria-label': logoLinkLabel,
		onclick: stopPropagation,
		class: logoAttrs.class,
		style: logoAttrs.style
	});

	const staticLogoAsLinkProps = $derived({
		href: headingHref,
		...(linkResolved.isNative ? {} : { to: headingHref }),
		'aria-label': logoLinkLabel,
		class: logoAttrs.class,
		style: logoAttrs.style
	});
</script>

<!--
	The text column, optionally carrying an inline chevron after the heading.
	Upstream's `renderTextContent(inlineChevron?)`. The `menu &&` guards are
	upstream's: a heading link only becomes an independent `<a>` when there is a
	menu competing for the click, otherwise it is plain text inside a linked root.
-->
{#snippet textContent(inlineChevron?: Snippet)}
	<span class={textContainerAttrs.class} style={textContainerAttrs.style}>
		{#if superheading}
			{#if hasAnyHref && superheadingHref && menu}
				<Link href={superheadingHref} onclick={stopPropagation} color="secondary" size="xsm">
					{superheading}
				</Link>
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
				<Link href={subheadingHref} onclick={stopPropagation} color="secondary" size="xsm">
					{subheading}
				</Link>
			{:else}
				<span class={subheadingAttrs.class} style={subheadingAttrs.style}>{subheading}</span>
			{/if}
		{/if}
	</span>
{/snippet}

{#snippet chevronElement()}
	<Icon icon="chevronDown" size="sm" color="secondary" xstyle={topNavHeadingChevronStyle} />
{/snippet}

{#snippet headerEndContentElement()}
	{#if headerEndContent}
		<span class={endContentAttrs.class} style={endContentAttrs.style}>
			{@render headerEndContent()}
		</span>
	{/if}
{/snippet}

{#snippet chevronTriggerButton()}
	<!--
		Stays a `<button>`: this box is the popover trigger, so it carries the
		accessible name and the handlers — only the glyph moves to `Icon` (#4838).
	-->
	<button
		type="button"
		aria-label={t('@astryx.topNav.heading.openMenu')}
		onclick={openMenuFromChevron}
		{...popover.triggerProps}
		class={chevronButtonAttrs.class}
		style={chevronButtonAttrs.style}
	>
		<Icon icon="chevronDown" size="sm" color="inherit" xstyle={topNavHeadingChevronGlyphStyle} />
	</button>
{/snippet}

{#snippet popoverFlippedChevron()}
	<Icon icon="chevronDown" size="sm" color="secondary" xstyle={topNavHeadingPopoverChevronStyle} />
{/snippet}

<!--
	The heading replica at the top of the popover — always static, with the
	chevron flipped to point back at the trigger. Clicking it closes the menu.
-->
{#snippet popoverHeadingContent()}
	<button
		type="button"
		class={popoverHeadingAttrs.class}
		style={popoverHeadingAttrs.style}
		onclick={menuHover.triggerProps.onclick}
	>
		{#if logo}
			<span class={logoAttrs.class} style={logoAttrs.style}>{@render logo()}</span>
		{/if}
		{@render textContent(popoverFlippedChevron)}
	</button>
{/snippet}

{#snippet menuPopover()}
	<PopoverLayer {popover} placement="below" alignment="start" xstyle={topNavHeadingPopoverOverlap}>
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

				Upstream wraps exactly this in the close scope, in both popover branches
				— the heading replica above it is deliberately outside, because it
				closes the menu itself rather than delegating.
			-->
			<div role="menu" aria-label={heading ?? t('@astryx.topNav.heading.dialogLabel')}>
				{#if menu}
					<NavHeadingCloseScope closeMenu={popover.hide}>
						{@render menu()}
					</NavHeadingCloseScope>
				{/if}
			</div>
		</div>
	</PopoverLayer>
{/snippet}

{#if isLogoOnly}
	<!-- Simple: no heading text, just a logo (backward compat for logo-only usage) -->
	{#if headingHref}
		<LinkElement component={linkResolved.component} props={logoOnlyLinkProps}>
			{#if logo}
				<span class={logoAttrs.class} style={logoAttrs.style}>{@render logo()}</span>
			{/if}
		</LinkElement>
	{:else}
		<div
			{...rest}
			data-testid={testId}
			{...theme}
			class={cx(theme.class, rootAttrs.class, className)}
			style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
		>
			{#if logo}
				<span class={logoAttrs.class} style={logoAttrs.style}>{@render logo()}</span>
			{/if}
		</div>
	{/if}
{:else if isWholeHeadingLink && headingHref}
	<!-- Whole heading is a link (no menu, single headingHref) -->
	<LinkElement component={linkResolved.component} props={wholeHeadingLinkProps}>
		{#if logo}
			<span class={logoAttrs.class} style={logoAttrs.style}>{@render logo()}</span>
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
		{#if logo}
			<span class={logoAttrs.class} style={logoAttrs.style}>{@render logo()}</span>
		{/if}
		{@render textContent(chevronTriggerButton)}
		{@render headerEndContentElement()}
	</div>
	{@render menuPopover()}
{:else if menu && hasAnyHref}
	<!-- Mixed mode: independent links + chevron trigger for the menu -->
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
		{#if logo}
			{#if headingHref}
				<LinkElement component={linkResolved.component} props={logoAsLinkProps}>
					{@render logo()}
				</LinkElement>
			{:else}
				<span class={logoAttrs.class} style={logoAttrs.style}>{@render logo()}</span>
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
		{#if logo}
			{#if headingHref}
				<LinkElement component={linkResolved.component} props={staticLogoAsLinkProps}>
					{@render logo()}
				</LinkElement>
			{:else}
				<span class={logoAttrs.class} style={logoAttrs.style}>{@render logo()}</span>
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
				<span class={headingAttrs.class} style={headingAttrs.style}>{heading}</span>
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
		{#if logo}
			<span class={logoAttrs.class} style={logoAttrs.style}>{@render logo()}</span>
		{/if}
		{@render textContent()}
		{@render headerEndContentElement()}
		{#if showChevron}{@render chevronElement()}{/if}
	</div>
{/if}
