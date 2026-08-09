<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { IconName } from '../icon/icon-registry.js';

	/**
	 * `onclick` is omitted from `BaseProps` so the argument-less `onClick` below
	 * replaces it, exactly as upstream omits React's `onClick`. The name stays
	 * upstream's, as `DropdownMenuItem`'s does: it is a selection callback, not a
	 * DOM handler.
	 */
	export interface NavHeadingMenuItemProps extends Omit<BaseProps<HTMLElement>, 'onclick'> {
		/**
		 * Icon to display before the label — a registry name, or a snippet for a
		 * custom icon. Upstream's `ReactNode | IconType`; the Svelte icon-slot shape
		 * (as `Button.icon`) is `IconName | Snippet`.
		 */
		icon?: IconName | Snippet;
		/** Primary label text. A string single-line-truncates automatically. */
		label: string | Snippet;
		/** Secondary description text displayed below the label. */
		description?: string | Snippet;
		/** URL to navigate to. Renders as an anchor element when provided. */
		href?: string;
		/** Callback when the item is selected. */
		onClick?: () => void;
		/**
		 * Whether the item is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import Icon from '../icon/icon.svelte';
	import Text from '../text/text.svelte';
	import LinkElement from '../link/link-element.svelte';
	import { useLinkComponent } from '../link/link-context.svelte.js';
	import { useNavHeadingMenuContext } from './nav-menu-context.svelte.js';
	import {
		navHeadingMenuItemAttrs,
		navHeadingMenuItemContentAttrs
	} from './nav-heading-menu-item.stylex.js';

	/**
	 * Menu item for nav heading popovers.
	 *
	 * Reads size from the parent `NavHeadingMenu` for consistent padding.
	 * Automatically dismisses the menu on click via context. Renders as a link
	 * when `href` is provided.
	 *
	 * @example
	 * ```svelte
	 * <NavHeadingMenu>
	 *   <NavHeadingMenuItem label="Dashboard" href="/dashboard" />
	 *   <NavHeadingMenuItem label="Settings" icon="settings" onClick={open} />
	 * </NavHeadingMenu>
	 * ```
	 */
	let {
		icon,
		label,
		description,
		href,
		onClick,
		isDisabled = false,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: NavHeadingMenuItemProps = $props();

	const ctx = useNavHeadingMenuContext();
	const size = $derived(ctx?.().size ?? 'md');

	function handleClick(): void {
		if (isDisabled) {
			return;
		}
		onClick?.();
		ctx?.().closeMenu();
	}

	const resolveLink = useLinkComponent();
	const linkResolved = $derived(resolveLink());

	const theme = $derived(themeProps('nav-heading-menu-item', { size }));
	const attrs = $derived(navHeadingMenuItemAttrs(size, isDisabled, xstyle));
	const contentAttrs = navHeadingMenuItemContentAttrs();

	// Upstream's `const Element = href ? LinkComponent : 'div'`. `LinkElement`
	// resolves a string tag through `<svelte:element>` and a component through the
	// dynamic-component form, so the `div` branch rides the same seam.
	const elementProps = $derived({
		...rest,
		role: 'menuitem',
		tabindex: isDisabled ? undefined : -1,
		'aria-disabled': isDisabled || undefined,
		href,
		// `useLinkComponent`'s `to` alias for `to`-based routers; upstream injects it
		// inside the hook's wrapper component, which has no Svelte counterpart.
		...(href != null && !linkResolved.isNative ? { to: href } : {}),
		onclick: handleClick,
		...theme,
		class: cx(theme.class, attrs.class, className),
		style: mergeStyle(attrs.style, styleProp as string | undefined)
	});
</script>

<LinkElement component={href ? linkResolved.component : 'div'} props={elementProps}>
	{#if icon}
		{#if typeof icon === 'string'}
			<Icon {icon} size="sm" color="secondary" />
		{:else}
			{@render icon()}
		{/if}
	{/if}
	<span class={contentAttrs.class} style={contentAttrs.style}>
		{#if typeof label === 'string'}
			<Text type="body" maxLines={1}>{label}</Text>
		{:else}
			{@render label()}
		{/if}
		{#if description}
			<Text type="supporting" maxLines={1}>
				{#if typeof description === 'string'}{description}{:else}{@render description()}{/if}
			</Text>
		{/if}
	</span>
</LinkElement>
