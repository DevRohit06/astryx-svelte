<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { StatusDotVariant } from './status-dot.stylex.js';

	export interface StatusDotProps extends BaseProps<HTMLSpanElement> {
		variant: StatusDotVariant;
		/**
		 * Accessible label describing the status. Required for a11y — it is the
		 * dot's `aria-label`, so the status reaches screen readers without hover.
		 */
		label: string;
		/**
		 * Optional icon rendered centred inside the dot, painted in the dot's
		 * `currentColor` ink. Same contract as `AvatarStatusDot`'s `icon`.
		 *
		 * By default the dot is a colour-only signal; an icon gives the status a
		 * non-colour mark, so use a different icon per status — the same icon on
		 * every variant leaves the statuses distinguishable by colour alone
		 * (WCAG 2.1 SC 1.4.1).
		 *
		 * @example
		 * ```svelte
		 * <StatusDot variant="success" label="Verified" icon={checkIcon} />
		 * ```
		 */
		icon?: Snippet;
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
	import { statusDotAttrs, statusDotIconAttrs } from './status-dot.stylex.js';

	/**
	 * A fixed 8px dot for a status: online/offline, severity, liveness.
	 *
	 * By default the dot conveys status by colour only, which is not accessible in
	 * isolation (WCAG 2.1 SC 1.4.1) — treat it as a signal the surrounding UI must
	 * make accessible: use it as a binary present/absent signal, pair it with a
	 * visible label, pass `icon` so the status carries a non-colour mark, or convey
	 * the status accessibly elsewhere.
	 *
	 * Non-focusable, and announced through `role="img"` plus `aria-label` — the
	 * colour alone carries no meaning to a screen reader. Both are defaults a
	 * caller may replace: upstream spreads its rest props *after* them, unlike
	 * `Kbd` and `AvatarGroup`, which spread first and so pin their own role.
	 */
	const {
		variant,
		label,
		icon,
		isPulsing = false,
		tooltip,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: StatusDotProps = $props();

	const attrs = $derived(statusDotAttrs(variant, isPulsing, xstyle));
	const iconAttrs = statusDotIconAttrs();
	// `statusdot` ran the compound name together; themes styling it keep working
	// until the next major.
	const theme = $derived(themeProps('status-dot', { variant }, { legacyNames: ['statusdot'] }));
</script>

{#snippet dot()}
	<span
		{...theme}
		class={cx(theme.class, attrs.class, className)}
		style={mergeStyle(attrs.style, styleProp as string | undefined)}
		role="img"
		aria-label={label}
		{...rest}
	>
		<!--
			Upstream guards this with `isRenderable(icon)`; `icon` is a `Snippet` here,
			which is never `''` or a boolean, so `!= null` is that check exactly.
		-->
		{#if icon != null}
			<span aria-hidden="true" class={iconAttrs.class} style={iconAttrs.style}>
				{@render icon()}
			</span>
		{/if}
	</span>
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
