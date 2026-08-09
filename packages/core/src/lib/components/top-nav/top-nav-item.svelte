<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { LinkComponentType } from '../link/types.js';
	import type { NavItemSize } from '../nav-item/nav-item.stylex.js';

	export interface TopNavItemProps extends BaseProps<HTMLAnchorElement> {
		/** Link destination URL. */
		href?: string;
		/** Where to open the linked document. */
		target?: string;
		/** Link relationship. */
		rel?: string;
		/** Causes the browser to download the linked URL. */
		download?: string | boolean;
		/** Referrer policy for the link. */
		referrerpolicy?: string;
		/**
		 * Custom component to render instead of `<a>`.
		 * Overrides the provider-level default set by `LinkProvider`.
		 * Must accept href, class, style, and children props.
		 */
		as?: LinkComponentType;
		/**
		 * The accessible label for the nav item.
		 * Rendered as visible text by default. When `isIconOnly` is true,
		 * used as `aria-label` instead.
		 */
		label: string;
		/**
		 * Whether this nav item is currently selected/highlighted.
		 * @default false
		 */
		isSelected?: boolean;
		/**
		 * Whether the nav item is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * Renders the item as a square icon-only element.
		 * When true, `label` becomes the `aria-label` and visible text is hidden.
		 * Requires `icon` to be set.
		 * @default false
		 */
		isIconOnly?: boolean;
		/** Optional icon to display before the label. */
		icon?: Snippet;
		/** Optional content to render instead of the label. */
		children?: Snippet;
		/**
		 * Size variant for the nav item. Has no effect in horizontal mode;
		 * controls height/padding in drawer mode.
		 * @default 'md'
		 */
		size?: NavItemSize;
	}

	/**
	 * Click handler for disabled items. The disabled anchor renders without an
	 * href, so there is no navigation to block in practice; preventDefault is a
	 * defensive guard against synthetic/programmatic clicks.
	 */
	function preventDefaultClick(event: MouseEvent): void {
		event.preventDefault();
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useAppShellMobile } from '../app-shell/app-shell-mobile-context.svelte.js';
	import { useLinkComponent } from '../link/link-context.svelte.js';
	import LinkElement from '../link/link-element.svelte';
	import { topNavItemAttrs, topNavItemDrawerAttrs } from './top-nav-item.stylex.js';
	import { useTopNavRenderMode } from './top-nav-render-context.svelte.js';

	/**
	 * A navigation item for `TopNav`'s `startContent` slot.
	 *
	 * Renders as an anchor with hover and selected states. In the mobile drawer
	 * (`TopNavRenderContext` = `'drawer'`) it takes the shared nav-item shape
	 * instead, and activating it closes the drawer.
	 *
	 * @example
	 * ```svelte
	 * {#snippet startContent()}
	 *   <TopNavItem label="Home" href="/" isSelected />
	 *   <TopNavItem label="Products" href="/products" />
	 * {/snippet}
	 * <TopNav {startContent} />
	 * ```
	 */
	let {
		as,
		label,
		isSelected = false,
		isDisabled = false,
		isIconOnly = false,
		icon,
		children,
		size = 'md',
		xstyle,
		class: className,
		style: styleProp,
		onclick: onclickProp,
		// `href` and `target` are destructured out — upstream names them too, and
		// that is what lets the rest spread go *last* below without a consumer's
		// raw `href` defeating the disabled branch's `undefined`.
		href,
		target,
		...rest
	}: TopNavItemProps = $props();

	const resolveLink = useLinkComponent();
	const linkResolved = $derived(resolveLink(as));
	const renderMode = useTopNavRenderMode();
	const appShellMobile = useAppShellMobile();

	const isDrawer = $derived(renderMode() === 'drawer');

	function handleDrawerClick(event: MouseEvent): void {
		if (isDisabled) {
			preventDefaultClick(event);
			return;
		}
		// Forward the original onclick if present, then dismiss the drawer.
		onclickProp?.(event as MouseEvent & { currentTarget: EventTarget & HTMLAnchorElement });
		appShellMobile().closeMobileNav();
	}

	const theme = $derived(
		themeProps(
			'top-nav-item',
			isDrawer
				? { mode: 'drawer', selected: isSelected ? 'selected' : null }
				: { selected: isSelected ? 'selected' : null }
		)
	);
	const attrs = $derived(
		isDrawer
			? topNavItemDrawerAttrs(size, isSelected, isDisabled, xstyle)
			: topNavItemAttrs(isSelected, isDisabled, isIconOnly, xstyle)
	);

	// A disabled item renders as a plain `<a>` with no `href` and no `target`, so
	// it cannot navigate and drops out of the tab order — 0.2.0's fix for disabled
	// items that still navigated and still fired clicks. Routing it through the
	// resolved link component would hand a router a hrefless link.
	const rootComponent = $derived(isDisabled ? 'a' : linkResolved.component);

	// `rest` is spread **last**, which is upstream's position in both of its
	// branches — so a consumer's `aria-current`/`aria-label`/`aria-disabled`/
	// `tabindex`, and the `data-selected`/`data-mode` reflections, all lose to
	// what the caller passes. Observable, unlike most rest-position residue,
	// because this element writes six such attributes.
	const linkProps = $derived({
		href: isDisabled ? undefined : href,
		target: isDisabled ? undefined : target,
		...(linkResolved.isNative || isDisabled ? {} : { to: href ?? undefined }),
		'aria-label': isIconOnly ? label : undefined,
		'aria-current': isSelected ? 'page' : undefined,
		'aria-disabled': isDisabled || undefined,
		tabindex: isDisabled ? -1 : undefined,
		...theme,
		class: cx(theme.class, attrs.class, className),
		style: mergeStyle(attrs.style, styleProp as string | undefined),
		// The drawer branch always routes through its own handler, which guards on
		// `isDisabled` itself; the default branch swaps the handler out. Upstream's
		// split, kept because the two branches are separate `return`s there.
		onclick: isDrawer ? handleDrawerClick : isDisabled ? preventDefaultClick : onclickProp,
		...rest
	});
</script>

<LinkElement component={rootComponent} props={linkProps}>
	{#if icon}{@render icon()}{/if}
	{#if !isIconOnly}
		{#if children}{@render children()}{:else}{label}{/if}
	{/if}
</LinkElement>
