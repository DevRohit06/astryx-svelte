<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { DividerOrientation, DividerVariant } from './divider.stylex.js';

	export interface DividerProps extends BaseProps<HTMLDivElement> {
		/** @default 'horizontal' */
		orientation?: DividerOrientation;
		/**
		 * Label centred on the rule, in small secondary text. A plain string
		 * covers the common `label="or"` case; pass a snippet for markup.
		 */
		label?: string | Snippet;
		/**
		 * Weight of the rule: `subtle` uses `--color-border`, `strong` uses
		 * `--color-border-emphasized`.
		 * @default 'subtle'
		 */
		variant?: DividerVariant;
		/**
		 * Escape the parent container's padding with negative margins, so the
		 * rule runs edge to edge.
		 * @default false
		 */
		isFullBleed?: boolean;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { dividerLabelAttrs, dividerLineAttrs, dividerRootAttrs } from './divider.stylex.js';

	/**
	 * A rule that separates content, optionally broken by a centred label.
	 */
	const {
		orientation = 'horizontal',
		label,
		variant = 'subtle',
		isFullBleed = false,
		class: className,
		style: styleProp,
		xstyle,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
		...rest
	}: DividerProps = $props();

	const labelId = $props.id();

	// A separator does not derive its accessible name from its content, so the
	// rendered label must be referenced explicitly via aria-labelledby to be
	// exposed as the separator's name (WCAG 1.3.1). An explicit aria-label or
	// aria-labelledby from the consumer takes precedence.
	const resolvedLabelledBy = $derived(
		ariaLabelledBy ?? (label && ariaLabel == null ? labelId : undefined)
	);

	const root = $derived(dividerRootAttrs(orientation, isFullBleed, xstyle));
	const line = $derived(dividerLineAttrs(orientation, variant));
	const labelAttrs = $derived(dividerLabelAttrs(orientation));
	const theme = $derived(themeProps('divider', { variant, orientation }));
</script>

<div
	{...rest}
	{...theme}
	class={cx(theme.class, root.class, className)}
	style={mergeStyle(root.style, styleProp as string | undefined)}
	role="separator"
	aria-orientation={orientation}
	aria-label={ariaLabel}
	aria-labelledby={resolvedLabelledBy}
>
	<div class={line.class} style={line.style}></div>
	{#if label}
		<div id={labelId} class={labelAttrs.class} style={labelAttrs.style}>
			<!-- A Snippet is a function; anything else is text. This is the whole of
			     the `string | Snippet` convention for leaf slots. -->
			{#if typeof label === 'function'}{@render label()}{:else}{label}{/if}
		</div>
		<div class={line.class} style={line.style}></div>
	{/if}
</div>
