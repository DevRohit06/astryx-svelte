<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SizeValue, SpacingStep } from '../../internal/types.js';

	/**
	 * How the layout takes its height.
	 * - `fill`: fills the container, and the content area scrolls inside it
	 * - `auto`: grows with its content, and the page scrolls
	 */
	export type LayoutHeight = 'fill' | 'auto';

	export interface LayoutProps extends Omit<BaseProps<HTMLDivElement>, 'content'> {
		/** Main content area (center). */
		content?: Snippet;
		/**
		 * Maximum width of the content inside each slot — header, content, footer
		 * and the panels. Dividers stay full-bleed, and narrower content is centred
		 * with `margin-inline: auto`.
		 *
		 * Numbers are pixels, strings are used as-is (`'60ch'`). Common page widths:
		 * `640` for forms and text, `960` for content pages and wider layouts.
		 */
		contentWidth?: SizeValue;
		/** End panel slot — right in LTR, left in RTL. */
		end?: Snippet;
		footer?: Snippet;
		header?: Snippet;
		/** @default 'fill' */
		height?: LayoutHeight;
		/**
		 * Padding at the layout's outer edges, on the spacing scale. Sets both
		 * `--layout-padding-outer-x` and `--layout-padding-outer-y`.
		 */
		padding?: SpacingStep;
		/** Start panel slot — left in LTR, right in RTL. */
		start?: Snippet;
		/**
		 * Default divider visibility for the `LayoutHeader` and `LayoutFooter`
		 * children below. A header or footer that passes `hasDivider` itself wins.
		 * Left unset, a nested layout inherits its parent's value.
		 */
		defaultHasDividers?: boolean;
		/**
		 * Shorthand for the `content` slot: `<Layout>{main}</Layout>` is
		 * `<Layout content={main} />`. The surrounding zones stay explicit props,
		 * and `content` wins when both are given. Accepting children is what stops
		 * the natural `<Layout>…</Layout>` form rendering a blank shell.
		 */
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import AreaProvider from './layout-area-provider.svelte';
	import { setLayoutDividerContext, useLayoutDivider } from './layout-divider-context.svelte.js';
	import { setLayoutSlotsContext } from './layout-slots-context.svelte.js';
	import {
		layoutContentSlotAttrs,
		layoutInnerAttrs,
		layoutMiddleAttrs,
		layoutOuterAttrs
	} from './layout.stylex.js';

	/**
	 * Page shell with header, start/end panels, content and footer slots.
	 *
	 * ```
	 * ┌─────────────────────────────────────────┐
	 * │                 header                  │
	 * ├──────┬─────────────────────────┬────────┤
	 * │start │        content          │  end   │
	 * ├──────┴─────────────────────────┴────────┤
	 * │                 footer                  │
	 * └─────────────────────────────────────────┘
	 * ```
	 *
	 * It handles the padding collapse between adjacent slots, scroll containment
	 * in the content area, and RTL through logical properties. Use it for a page
	 * shell with distinct zones; for plain directional stacking use `HStack` or
	 * `VStack` instead.
	 */
	const {
		children,
		content,
		contentWidth,
		defaultHasDividers,
		end,
		footer,
		header,
		height = 'fill',
		padding,
		start,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: LayoutProps = $props();

	const isFill = $derived(height === 'fill');
	// Children are shorthand for the content slot; an explicit `content` wins.
	const resolvedContent = $derived(content ?? children);

	// Upstream mounts its divider provider only when `defaultHasDividers` is set,
	// so a nested layout without the prop leaves its parent's default in place —
	// behaviour `LayoutProps` documents. A Svelte context cannot be conditionally
	// absent, so the parent's getter is captured at init and this one falls
	// through to it, which reproduces the inheritance *and* stays reactive to a
	// later change of the prop.
	const parentDivider = useLayoutDivider();
	setLayoutDividerContext(() =>
		defaultHasDividers != null ? { defaultHasDividers } : parentDivider()
	);

	setLayoutSlotsContext(() => ({
		hasHeader: header != null,
		hasFooter: footer != null,
		hasStart: start != null,
		hasEnd: end != null
	}));

	const outer = $derived(layoutOuterAttrs(isFill, xstyle));
	const inner = $derived(layoutInnerAttrs({ isFill, padding, contentWidth }));
	const middle = $derived(layoutMiddleAttrs(contentWidth));
	const contentSlot = layoutContentSlotAttrs();
	const theme = $derived(themeProps('layout', { height }));
</script>

<div
	{...rest}
	{...theme}
	class={cx(theme.class, outer.class, className)}
	style={mergeStyle(outer.style, styleProp as string | undefined)}
>
	<div class={inner.class} style={inner.style}>
		<AreaProvider area="header" children={header} />
		<div class={middle.class} style={middle.style}>
			<AreaProvider area="start" children={start} />
			<div class={contentSlot.class} style={contentSlot.style}>
				<AreaProvider area="content" children={resolvedContent} />
			</div>
			<AreaProvider area="end" children={end} />
		</div>
		<AreaProvider area="footer" children={footer} />
	</div>
</div>
