<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { Elevation } from '../../internal/types.js';
	import type { BannerContainer, BannerStatus } from './banner.stylex.js';

	export interface BannerProps extends BaseProps<HTMLDivElement> {
		/** Status controlling the icon and colour scheme. */
		status: BannerStatus;
		/** Title displayed prominently in the header area. */
		title: string | Snippet;
		/** Optional description below the title in the header area. */
		description?: string | Snippet;
		/** Override the default status icon. */
		icon?: Snippet;
		/**
		 * Whether the banner can be dismissed. Shows a close button and manages
		 * internal dismissed state, so the banner disappears even without
		 * `onDismiss`.
		 * @default false
		 */
		isDismissable?: boolean;
		/**
		 * Called when the dismiss button is clicked. The banner hides itself
		 * regardless of whether this is provided.
		 */
		onDismiss?: () => void;
		/** Action content rendered in the header area, end-aligned. */
		endContent?: Snippet;
		/**
		 * @default 'card'
		 */
		container?: BannerContainer;
		/**
		 * Resting elevation — the shadow depth the banner sits at.
		 * A raised `card` banner also rounds its root so the shadow follows the
		 * card silhouette; a `section` banner stays square.
		 * @default 'none'
		 */
		elevation?: Elevation;
		/**
		 * Whether the content area starts expanded. Only relevant with `children`.
		 * @default false
		 */
		defaultIsExpanded?: boolean;
		/**
		 * Extra content below the header, in a collapsible card-background area.
		 * When provided, a collapse/expand toggle appears in the header.
		 */
		children?: Snippet;
	}
</script>

<script lang="ts">
	import Button from '../button/button.svelte';
	import Icon from '../icon/icon.svelte';
	import type { IconName } from '../icon/icon-registry.js';
	import type { IconColor } from '../icon/icon.stylex.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import {
		bannerChevronExpandedStyle,
		bannerChevronStyle,
		bannerContentAreaAttrs,
		bannerDescriptionAttrs,
		bannerEndAreaAttrs,
		bannerHeaderAttrs,
		bannerHeaderContentAttrs,
		bannerIconWrapperAttrs,
		bannerRootAttrs,
		bannerTitleAttrs
	} from './banner.stylex.js';

	// `BannerStatus` is `keyof BannerStatusMap`, and that interface is documented
	// as declaration-mergeable so a theme package can add a status. Every lookup
	// below is therefore partial: a status this library has never heard of falls
	// through to the base treatment — no status fill, no glyph, and the polite
	// role — instead of resolving to `undefined` and dropping the ARIA role with
	// it.
	const defaultIconNames: Partial<Record<BannerStatus, IconName>> = {
		info: 'info',
		warning: 'warning',
		error: 'error',
		success: 'success'
	};

	const statusRole: Partial<Record<BannerStatus, 'alert' | 'status'>> = {
		info: 'status',
		warning: 'alert',
		error: 'alert',
		success: 'status'
	};

	/** An unknown status is not urgent by definition, so it announces politely. */
	const FALLBACK_ROLE = 'status';

	const statusIconColor: Partial<Record<BannerStatus, IconColor>> = {
		info: 'accent',
		warning: 'warning',
		error: 'error',
		success: 'success'
	};

	/**
	 * A persistent status notification for info, warning, error or success
	 * messages.
	 *
	 * Two-part structure: a coloured status header with icon, title, description
	 * and actions, and — when `children` are given — a collapsible content area
	 * below it, reached through a chevron toggle in the header.
	 *
	 * Manages its own dismissed state, so the banner hides on dismiss even without
	 * an `onDismiss`. Uses `role="alert"` for error/warning and `role="status"`
	 * for info/success.
	 *
	 * @example
	 * ```svelte
	 * <Banner status="info" title="New update available" />
	 * ```
	 */
	let {
		status,
		title,
		description,
		icon,
		isDismissable = false,
		onDismiss,
		endContent,
		container = 'card',
		elevation = 'none',
		defaultIsExpanded = false,
		children,
		onfocusincapture,
		onpointerdowncapture,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: BannerProps = $props();

	const t = useTranslator();
	let isDismissed = $state(false);
	// Read once at init, as upstream's `useState(defaultIsExpanded)` is: a later
	// change to the prop does not reopen a banner the user collapsed.
	// svelte-ignore state_referenced_locally
	let isExpanded = $state(defaultIsExpanded);

	// Links the expand/collapse toggle to the content region it shows and hides,
	// so assistive tech can move from the button to its controlled content. The
	// region is conditionally rendered, so `aria-controls` is set only while it is
	// mounted, avoiding a dangling reference.
	const contentId = $props.id();

	const role = $derived(statusRole[status] ?? FALLBACK_ROLE);
	const hasChildren = $derived(children != null);

	// Show the end area if there are actions, dismiss, or a collapsible toggle
	const showEndArea = $derived(endContent != null || isDismissable || hasChildren);
	// Centre items vertically when there is only a title (no description) and the
	// banner has action buttons
	const hasActions = $derived(endContent != null || isDismissable);
	// Upstream's `isRenderable(description)`, for the one prop here that can be a
	// string: `description=""` must read as absent, not as an empty text row.
	// `icon`, `endContent` and `children` are `Snippet`-only, where `!= null` is
	// already exact — a `Snippet` is never `''` or a boolean.
	const hasDescription = $derived(description != null && description !== '');
	const isSingleLine = $derived(!hasDescription && hasActions);

	const showContent = $derived(hasChildren && isExpanded);
	const isCard = $derived(container === 'card');

	const rootAttrs = $derived(bannerRootAttrs(elevation, container === 'card', xstyle));
	const headerTheme = $derived(themeProps('banner', { container, status }));
	const headerAttrs = $derived(bannerHeaderAttrs(status, isSingleLine, isCard, showContent));
	const iconTheme = $derived(themeProps('banner-icon', { status }));
	const iconWrapperAttrs = bannerIconWrapperAttrs();
	const headerContentAttrs = $derived(bannerHeaderContentAttrs(endContent != null));
	const titleAttrs = bannerTitleAttrs();
	const descriptionAttrs = bannerDescriptionAttrs();
	const endAreaAttrs = bannerEndAreaAttrs();
	const contentTheme = $derived(themeProps('banner-content', { container, status }));
	const contentAreaAttrs = $derived(bannerContentAreaAttrs(isCard));

	const toggleLabel = $derived(
		isExpanded ? t('@astryx.banner.collapse') : t('@astryx.banner.expand')
	);

	// The element focus came from before it entered the banner. Dismissing
	// unmounts the whole banner, dismiss button included, so without a handoff the
	// browser drops focus to <body> and a keyboard user loses their place.
	// `toast-viewport.svelte` makes the same handoff when a focused toast goes.
	//
	// Deliberately a plain `let`, not `$state`: nothing renders from it, and a
	// rune here would schedule an update on every focus crossing the banner.
	let focusOrigin: HTMLElement | null = null;

	// `focusin` reports the element focus came *from* as `relatedTarget`; on
	// `pointerdown` focus has not moved yet, so `document.activeElement` is it.
	function rememberFocusOrigin(candidate: EventTarget | null, root: Node): void {
		if (
			candidate instanceof HTMLElement &&
			candidate !== document.body &&
			!root.contains(candidate)
		) {
			focusOrigin = candidate;
		}
	}

	function handleFocusInCapture(event: FocusEvent & { currentTarget: HTMLDivElement }): void {
		onfocusincapture?.(event);
		rememberFocusOrigin(event.relatedTarget, event.currentTarget);
	}

	function handlePointerDownCapture(event: PointerEvent & { currentTarget: HTMLDivElement }): void {
		onpointerdowncapture?.(event);
		rememberFocusOrigin(document.activeElement, event.currentTarget);
	}

	function handleDismiss(): void {
		const origin = focusOrigin;
		isDismissed = true;
		onDismiss?.();
		// Move focus before the subtree is removed, so the browser never has a
		// frame where the focused node is gone. A `$state` write does not flush
		// synchronously, so this still runs ahead of the teardown.
		if (origin?.isConnected) {
			origin.focus();
		}
	}

	function handleToggleExpand(): void {
		isExpanded = !isExpanded;
	}
</script>

{#snippet chevronIcon()}
	<Icon
		icon="chevronDown"
		size="sm"
		color="inherit"
		xstyle={[bannerChevronStyle, isExpanded && bannerChevronExpandedStyle]}
	/>
{/snippet}

{#snippet closeIcon()}
	<Icon icon="close" size="sm" color="inherit" />
{/snippet}

{#if !isDismissed}
	<div
		{...rest}
		{role}
		onfocusincapture={handleFocusInCapture}
		onpointerdowncapture={handlePointerDownCapture}
		class={cx(rootAttrs.class, className)}
		style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	>
		<!-- Header: colored status background — primary theme target ('banner') -->
		<div
			{...headerTheme}
			class={cx(headerTheme.class, headerAttrs.class)}
			style={headerAttrs.style}
		>
			<!--
				The 'banner-icon' target rides on the element that paints: the default
				<Icon> below, or this wrapper when a custom `icon` snippet is passed
				(core never injects props into consumer markup, so overrides reach it
				via inheritance). The wrapper itself stays layout-only.
			-->
			{#if icon != null}
				<div
					{...iconTheme}
					class={cx(iconTheme.class, iconWrapperAttrs.class)}
					style={iconWrapperAttrs.style}
					aria-hidden="true"
				>
					{@render icon()}
				</div>
			{:else}
				<div class={iconWrapperAttrs.class} style={iconWrapperAttrs.style} aria-hidden="true">
					<!--
						Applied to the status <Icon> itself rather than the wrapper, so the
						element that paints the glyph is the element a theme targets — a
						'banner-icon' 'status:X' colour override beats the Icon's own
						variant from @layer astryx-theme (#4166).
					-->
					{#if defaultIconNames[status] != null}
						<Icon
							icon={defaultIconNames[status]}
							size="md"
							color={statusIconColor[status]}
							{...iconTheme}
						/>
					{/if}
				</div>
			{/if}
			<div class={headerContentAttrs.class} style={headerContentAttrs.style}>
				<div class={titleAttrs.class} style={titleAttrs.style}>
					{#if typeof title === 'function'}{@render title()}{:else}{title}{/if}
				</div>
				{#if hasDescription}
					<div class={descriptionAttrs.class} style={descriptionAttrs.style}>
						{#if typeof description === 'function'}{@render description()}{:else}{description}{/if}
					</div>
				{/if}
			</div>
			{#if showEndArea}
				<div class={endAreaAttrs.class} style={endAreaAttrs.style}>
					{#if endContent != null}{@render endContent()}{/if}
					{#if hasChildren}
						<Button
							variant="ghost"
							size="sm"
							label={toggleLabel}
							tooltip={toggleLabel}
							icon={chevronIcon}
							onclick={handleToggleExpand}
							aria-expanded={isExpanded}
							aria-controls={showContent ? contentId : undefined}
							isIconOnly
						/>
					{/if}
					{#if isDismissable}
						<Button
							variant="ghost"
							size="sm"
							label={t('@astryx.banner.dismiss')}
							tooltip={t('@astryx.banner.dismiss')}
							icon={closeIcon}
							onclick={handleDismiss}
							isIconOnly
						/>
					{/if}
				</div>
			{/if}
		</div>
		<!-- Content area: collapsible card background — theme target ('banner-content') -->
		{#if showContent}
			<div
				id={contentId}
				{...contentTheme}
				class={cx(contentTheme.class, contentAreaAttrs.class)}
				style={contentAreaAttrs.style}
			>
				{@render children?.()}
			</div>
		{/if}
	</div>
{/if}
