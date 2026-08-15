<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface EmptyStateProps extends BaseProps<HTMLDivElement> {
		/** The primary message. */
		title: string;
		/** Secondary text giving more context. */
		description?: string;
		/** An icon or illustration above the title. Rendered decorative. */
		icon?: Snippet;
		/**
		 * Buttons below the description. Horizontal by default, stacked when
		 * `isCompact`.
		 */
		actions?: Snippet;
		/**
		 * Semantic heading level for the title. Controls the tag only, so the
		 * title fits the document outline; the visual size is fixed regardless.
		 * @default 3
		 */
		headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
		/** Reduced spacing, for constrained areas. @default false */
		isCompact?: boolean;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import {
		emptyStateActionsAttrs,
		emptyStateContainerAttrs,
		emptyStateDescriptionAttrs,
		emptyStateTextGroupAttrs,
		emptyStateTitleAttrs
	} from './empty-state.stylex.js';

	/**
	 * A placeholder for a content area with nothing in it — an icon, a title, an
	 * optional description and optional actions.
	 *
	 * `role="status"` announces it, so a list that empties out tells a screen
	 * reader why rather than going silent.
	 *
	 * @example
	 * ```svelte
	 * <EmptyState title="No results found" description="Try adjusting your search." />
	 * ```
	 */
	const {
		title,
		description,
		icon,
		actions,
		headingLevel = 3,
		isCompact = false,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: EmptyStateProps = $props();

	const container = $derived(emptyStateContainerAttrs(isCompact, xstyle));
	const titleAttrs = $derived(emptyStateTitleAttrs(isCompact));
	const descriptionAttrs = $derived(emptyStateDescriptionAttrs(isCompact));
	const actionsAttrs = $derived(emptyStateActionsAttrs(isCompact));
	const textGroup = emptyStateTextGroupAttrs();
	const theme = $derived(themeProps('empty-state', { variant: isCompact ? 'compact' : null }));
	// New at 0.4.x (#4942): the title and description became theme targets in
	// their own right, so a theme can restyle the copy without reaching through
	// the container.
	const titleTheme = $derived(
		themeProps('empty-state-title', { variant: isCompact ? 'compact' : null })
	);
	const descriptionTheme = $derived(
		themeProps('empty-state-description', { variant: isCompact ? 'compact' : null })
	);
</script>

<!--
	`rest` spreads FIRST, so `role="status"` cannot be clobbered by a caller
	(#4826). It used to spread last, which made the announcement this component
	exists for silently overridable by any consumer passing `role`. `class` and
	`style` still come after, so a caller's own class/style continue to win —
	upstream's `mergeProps` has the same shape.
-->
<div
	{...rest}
	{...theme}
	role="status"
	class={cx(theme.class, container.class, className)}
	style={mergeStyle(container.style, styleProp as string | undefined)}
>
	{#if icon}
		<div aria-hidden="true">{@render icon()}</div>
	{/if}
	<div class={textGroup.class} style={textGroup.style}>
		<!-- `createElement('h' + level)` becomes `<svelte:element>`; the level is
		     a semantic choice, so the tag moves and the styling does not. -->
		<svelte:element
			this={`h${headingLevel}` as const}
			{...titleTheme}
			class={cx(titleTheme.class, titleAttrs.class)}
			style={titleAttrs.style}
		>
			{title}
		</svelte:element>
		{#if description != null}
			<!-- A <div>, never a <p>: the description accepts arbitrary content and
			     a <p> cannot legally contain block children, which hydrates wrong.
			     `margin: 0` in the style means it looks the same either way. -->
			<div
				{...descriptionTheme}
				class={cx(descriptionTheme.class, descriptionAttrs.class)}
				style={descriptionAttrs.style}
			>
				{description}
			</div>
		{/if}
	</div>
	{#if actions}
		<div class={actionsAttrs.class} style={actionsAttrs.style}>{@render actions()}</div>
	{/if}
</div>
