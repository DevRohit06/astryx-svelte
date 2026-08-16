<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { LayerPlacement } from '../layer/use-layer.svelte.js';
	import type {
		TextColor,
		TextDisplay,
		TextJustify,
		TextSize,
		TextType,
		TextWeight,
		TextWrap,
		WordBreak
	} from './text.stylex.js';

	export interface TextProps extends BaseProps<HTMLElement> {
		/** Semantic type. Themes may add their own; unknown types render on the `body` baseline. */
		type?: TextType;
		/**
		 * Explicit font-size override, leaving the rest of `type` intact. Prefer
		 * `type` alone — reach for this only for one-off UI such as metrics.
		 */
		size?: TextSize;
		/** Defaults to `secondary` for `supporting`, `primary` otherwise. */
		color?: TextColor;
		weight?: TextWeight;
		/** Forced to `block` when `maxLines > 0` or `hasCapsize` is set. */
		display?: TextDisplay;
		/** Lines before clamping. 0 disables truncation. */
		maxLines?: number;
		/**
		 * Control tooltip behaviour for truncated text.
		 * - `true` (default when `maxLines > 0`): show the tooltip at its default position
		 * - `false`: disable the tooltip
		 * - a placement: show the tooltip there
		 */
		hasTruncateTooltip?: boolean | LayerPlacement;
		/** Defaults to `break-all` at `maxLines={1}`, `break-word` otherwise. */
		wordBreak?: WordBreak;
		textWrap?: TextWrap;
		/** Logical alignment, so it follows writing direction. */
		justify?: TextJustify;
		/** Optical alignment via `text-box-trim`. Forces block display. */
		hasCapsize?: boolean;
		hasStrikethrough?: boolean;
		/** Tabular figures, so columns of numbers line up. */
		hasTabularNumbers?: boolean;
		as?: 'span' | 'p' | 'div' | 'label' | 'h1' | 'h2' | 'h3';
		children: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTruncation } from '../../internal/truncation.svelte.js';
	import {
		lineClampStyle,
		resolveStyleType,
		resolveTextColor,
		textAttrs,
		truncationTooltipContentAttrs
	} from './text.stylex.js';

	/**
	 * Semantic text. `type` selects size, weight and line-height from the theme's
	 * type scale; the individual props override pieces of that.
	 */
	const {
		type = 'body',
		size,
		color,
		weight,
		display = 'inline',
		maxLines = 0,
		hasTruncateTooltip = true,
		wordBreak,
		textWrap,
		justify = 'start',
		hasCapsize = false,
		hasStrikethrough = false,
		hasTabularNumbers = false,
		as = 'span',
		children,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: TextProps = $props();

	const resolvedColor = $derived(resolveTextColor(type, color));
	const styleType = $derived(resolveStyleType(type));
	// One clamped line breaks mid-word so the ellipsis lands at the edge; wrapped
	// text breaks on word boundaries instead.
	const resolvedWordBreak = $derived(wordBreak ?? (maxLines === 1 ? 'break-all' : 'break-word'));
	const resolvedDisplay = $derived(maxLines > 0 || hasCapsize ? 'block' : display);

	const truncation = useTruncation(() => maxLines);

	const tooltipPlacement = $derived<LayerPlacement>(
		typeof hasTruncateTooltip === 'string' ? hasTruncateTooltip : 'above'
	);
	const tooltipEnabled = $derived(
		maxLines > 0 && hasTruncateTooltip !== false && truncation.isTruncated
	);

	// The tooltip anchors to this element in sibling mode — upstream passes the
	// same node through `anchorRef` rather than wrapping it, so the text keeps
	// its place in the flow.
	let textEl = $state<HTMLElement | null>(null);
	const tooltipContent = truncationTooltipContentAttrs();

	const attrs = $derived(
		textAttrs(
			{
				styleType,
				color: resolvedColor,
				size,
				weight,
				display: resolvedDisplay,
				maxLines,
				wordBreak: resolvedWordBreak,
				textWrap,
				justify,
				hasCapsize,
				hasStrikethrough,
				hasTabularNumbers
			},
			xstyle
		)
	);
	const theme = $derived(themeProps('text', { type, size, color: resolvedColor }));
</script>

{#snippet truncatedFullText()}
	<span class={tooltipContent.class} style={tooltipContent.style}>{truncation.fullText}</span>
{/snippet}

<!--
	`title` before `{...rest}`, as upstream writes it before `{...props}`. The
	order is load-bearing rather than cosmetic: `title` is `undefined` whenever the
	text is not truncated, and a later `undefined` *removes* the attribute — so
	spreading rest first threw away a consumer's own `title` on every untruncated
	`Text`.
-->
<svelte:element
	this={as}
	bind:this={textEl}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, lineClampStyle(maxLines), styleProp as string | undefined)}
	title={tooltipEnabled ? truncation.fullText : undefined}
	{...rest}
	{@attach truncation.attach}
>
	{@render children()}
</svelte:element>

{#if tooltipEnabled}
	<!--
		Loaded on demand, as upstream's `lazy` + `Suspense fallback={null}` does —
		truncation is the uncommon case, so `Tooltip` should not sit in the bundle of
		every consumer that renders text. `{#await}` with no pending branch is the
		same null fallback. The native `title` above stays either way, exactly as
		upstream keeps it.
	-->
	{#await import('../tooltip/tooltip.svelte') then { default: Tooltip }}
		<Tooltip anchor={textEl} content={truncatedFullText} placement={tooltipPlacement} />
	{/await}
{/if}
