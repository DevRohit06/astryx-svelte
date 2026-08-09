<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { LayerPlacement } from '../layer/use-layer.svelte.js';
	import type {
		TextColor,
		TextDisplay,
		TextJustify,
		TextWrap,
		WordBreak
	} from '../text/text.stylex.js';
	import type { HeadingLevel, HeadingType } from './heading.stylex.js';

	export interface HeadingProps extends BaseProps<HTMLHeadingElement> {
		/** 1–6. Renders the matching `h1`–`h6`. */
		level: HeadingLevel;
		/**
		 * Display-scale sizing for hero banners and data callouts. `level` still
		 * decides the element, so the document outline is unaffected.
		 */
		type?: HeadingType;
		/**
		 * Sets `aria-level` when the visual hierarchy and the document outline
		 * legitimately disagree — a sidebar heading reused across pages, say.
		 */
		accessibilityLevel?: HeadingLevel;
		color?: TextColor;
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
		children: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { createTruncation } from '../../internal/truncation.svelte.js';
	import { lineClampStyle, truncationTooltipContentAttrs } from '../text/text.stylex.js';
	import { LEVEL_TO_TAG, headingAttrs } from './heading.stylex.js';

	/**
	 * Semantic heading. `level` picks the element and, unless `type` overrides it,
	 * the visual treatment too.
	 */
	const {
		level,
		type,
		accessibilityLevel,
		color = 'primary',
		display = 'block',
		maxLines = 0,
		hasTruncateTooltip = true,
		wordBreak,
		textWrap,
		justify = 'start',
		hasCapsize = false,
		hasStrikethrough = false,
		children,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: HeadingProps = $props();

	const resolvedWordBreak = $derived(wordBreak ?? (maxLines === 1 ? 'break-all' : 'break-word'));
	const resolvedDisplay = $derived(maxLines > 0 || hasCapsize ? 'block' : display);

	const truncation = createTruncation(() => maxLines);

	const tooltipPlacement = $derived<LayerPlacement>(
		typeof hasTruncateTooltip === 'string' ? hasTruncateTooltip : 'above'
	);
	const tooltipEnabled = $derived(
		maxLines > 0 && hasTruncateTooltip !== false && truncation.isTruncated
	);

	// Anchored in sibling mode, as `Text` is — see the note there.
	let headingEl = $state<HTMLElement | null>(null);
	const tooltipContent = truncationTooltipContentAttrs();

	const attrs = $derived(
		headingAttrs(
			{
				level,
				type,
				color,
				display: resolvedDisplay,
				maxLines,
				wordBreak: resolvedWordBreak,
				textWrap,
				justify,
				hasCapsize,
				hasStrikethrough
			},
			xstyle
		)
	);
	const theme = $derived(themeProps('heading', { level, color, ...(type && { type }) }));
</script>

{#snippet truncatedFullText()}
	<span class={tooltipContent.class} style={tooltipContent.style}>{truncation.fullText}</span>
{/snippet}

<svelte:element
	this={LEVEL_TO_TAG[level]}
	bind:this={headingEl}
	{...rest}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, lineClampStyle(maxLines), styleProp as string | undefined)}
	title={tooltipEnabled ? truncation.fullText : undefined}
	aria-level={accessibilityLevel && accessibilityLevel !== level ? accessibilityLevel : undefined}
	{@attach truncation.attach}
>
	{@render children()}
</svelte:element>

{#if tooltipEnabled}
	<!-- Loaded on demand, as upstream's `lazy` + `Suspense fallback={null}` does. -->
	{#await import('../tooltip/tooltip.svelte') then { default: Tooltip }}
		<Tooltip anchor={headingEl} content={truncatedFullText} placement={tooltipPlacement} />
	{/await}
{/if}
