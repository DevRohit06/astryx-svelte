<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { AriaRole } from 'svelte/elements';
	import type { BaseProps } from '../../base-props.js';
	import type { SpacingStep } from '../../internal/types.js';

	export interface LayoutContentProps extends BaseProps<HTMLDivElement> {
		children?: Snippet;
		/**
		 * Internal padding, on the spacing scale. Overrides the padding the layout
		 * container would otherwise hand down.
		 */
		padding?: SpacingStep;
		/**
		 * Scroll the content area's overflow. Set it false for an auto-height
		 * layout where sticky positioning has to work against a parent container.
		 * @default true
		 */
		isScrollable?: boolean;
		/**
		 * Accessible name for the landmark. Required when `role` is set and more
		 * than one landmark of that type exists.
		 */
		label?: string;
		/** Use `main` only for the page's primary content, never in a nested layout. */
		role?: AriaRole;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { layoutContentAttrs } from './layout-content.stylex.js';
	import { useLayoutSlots } from './layout-slots-context.svelte.js';

	/**
	 * The scrollable body of a `Layout`.
	 *
	 * It provides its own padding and scroll containment, so children should add
	 * neither; pass `padding={0}` for edge-to-edge content such as a table.
	 */
	const {
		children,
		isScrollable = true,
		padding,
		label,
		role,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: LayoutContentProps = $props();

	const slots = useLayoutSlots();

	const attrs = $derived(layoutContentAttrs({ slots: slots(), isScrollable, padding }, xstyle));
	const theme = themeProps('layout-content');
</script>

<div
	{role}
	aria-label={label}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
	{...rest}
>
	{@render children?.()}
</div>
