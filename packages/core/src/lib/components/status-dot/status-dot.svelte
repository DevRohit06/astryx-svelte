<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';
	import type { StatusDotVariant } from './status-dot.stylex.js';

	export interface StatusDotProps extends BaseProps<HTMLSpanElement> {
		variant: StatusDotVariant;
		/** What the colour means. Required: the dot has no other accessible name. */
		label: string;
		/** Pulse to signal activity. Stops under `prefers-reduced-motion`. */
		isPulsing?: boolean;
		/**
		 * Tooltip text shown on hover to explain the status meaning.
		 * When omitted, no tooltip is rendered.
		 */
		tooltip?: string;
	}
</script>

<script lang="ts">
	import Tooltip from '../tooltip/tooltip.svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { statusDotAttrs } from './status-dot.stylex.js';

	/**
	 * A fixed 8px dot for a status: online/offline, severity, liveness.
	 *
	 * Non-focusable, and announced through `role="img"` plus `aria-label` — the
	 * colour alone carries no meaning to a screen reader. Both are defaults a
	 * caller may replace: upstream spreads its rest props *after* them, unlike
	 * `Kbd` and `AvatarGroup`, which spread first and so pin their own role.
	 */
	const {
		variant,
		label,
		isPulsing = false,
		tooltip,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: StatusDotProps = $props();

	const attrs = $derived(statusDotAttrs(variant, isPulsing, xstyle));
	const theme = $derived(themeProps('statusdot', { variant }));
</script>

{#snippet dot()}
	<span
		{...theme}
		class={cx(theme.class, attrs.class, className)}
		style={mergeStyle(attrs.style, styleProp as string | undefined)}
		role="img"
		aria-label={label}
		{...rest}
	></span>
{/snippet}

{#if tooltip}
	<!--
		Upstream wraps the dot rather than driving the hook from here, so the
		`display: contents` wrapper and its first-element-child lookup do the
		wiring. The dot is that first element child.
	-->
	<Tooltip content={tooltip}>{@render dot()}</Tooltip>
{:else}
	{@render dot()}
{/if}
