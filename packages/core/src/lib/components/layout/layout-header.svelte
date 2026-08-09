<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { AriaRole } from 'svelte/elements';
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue, SpacingStep } from '../../internal/types.js';

	export interface LayoutHeaderProps extends BaseProps<HTMLDivElement> {
		children?: Snippet;
		/**
		 * Adds a themed border on the bottom edge. Without one, the adjacent
		 * content's top padding collapses so the two read as one surface.
		 *
		 * Unset, it falls back to the enclosing `Layout`'s `defaultHasDividers`,
		 * then to `false`.
		 * @default false
		 */
		hasDivider?: boolean;
		/** Numbers are pixels; strings are used as-is. */
		height?: SizeValue;
		/**
		 * Internal padding, on the spacing scale. Overrides the padding the layout
		 * container would otherwise hand down.
		 */
		padding?: SpacingStep;
		/**
		 * Accessible name for the landmark. Required when `role` is set and more
		 * than one landmark of that type exists.
		 */
		label?: string;
		/** Use `banner` only for a site-wide header, never in a nested layout. */
		role?: AriaRole;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useLayoutDivider } from './layout-divider-context.svelte.js';
	import { layoutHeaderAttrs, layoutHeaderInnerAttrs } from './layout-header.stylex.js';

	/**
	 * The top bar of a `Layout` — a page title, an app bar, a toolbar row.
	 *
	 * It provides its own padding, so children should not add their own; pass
	 * `padding={0}` for content that manages its own, such as a `TopNav`.
	 */
	const {
		children,
		hasDivider,
		height,
		label,
		padding,
		role,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: LayoutHeaderProps = $props();

	const dividerCtx = useLayoutDivider();
	const resolvedHasDivider = $derived(hasDivider ?? dividerCtx()?.defaultHasDividers ?? false);

	const attrs = $derived(layoutHeaderAttrs(height, resolvedHasDivider, xstyle));
	const inner = $derived(layoutHeaderInnerAttrs(padding));
	const theme = themeProps('layout-header');
</script>

<div
	{role}
	aria-label={label}
	data-divider={resolvedHasDivider || undefined}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
	{...rest}
>
	<div class={inner.class} style={inner.style}>
		{@render children?.()}
	</div>
</div>
