<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { AvatarStatusDotVariant } from './avatar-status-dot.stylex.js';

	export interface AvatarStatusDotProps extends BaseProps<HTMLDivElement> {
		/**
		 * The semantic variant of the dot. Each variant pairs a colour with a
		 * distinct built-in shape so status is never conveyed by colour alone
		 * (WCAG 2.1 SC 1.4.1):
		 * - `success` — filled green dot (e.g. online, accepted)
		 * - `neutral` — grey ring (e.g. away, offline, pending)
		 * - `error` — red dot with a minus bar (e.g. busy, do not disturb)
		 *
		 * @default 'success'
		 */
		variant?: AvatarStatusDotVariant;
		/**
		 * What the colour means, e.g. "Online". Without it the dot is decorative
		 * and stays out of the accessibility tree.
		 */
		label?: string;
		/**
		 * Centred inside the dot. Dropped at the smallest avatar sizes, where
		 * there is no room for it to be legible.
		 *
		 * A rendered icon replaces the variant's built-in shape glyph, so use a
		 * different icon per status — the same icon on every variant leaves the
		 * statuses distinguishable by colour alone (WCAG 1.4.1). At the smallest
		 * avatar sizes the built-in glyph still shows instead of the icon.
		 */
		icon?: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useAvatarSize, useAvatarStatusLabelSink } from './avatar-context.svelte.js';
	import {
		avatarStatusDotAttrs,
		avatarStatusDotIconAttrs,
		glyphShapeMap,
		resolveStatusDotSize,
		GLYPH_STROKE_WIDTH,
		MINUS_BAR_SPAN
	} from './avatar-status-dot.stylex.js';

	/**
	 * A status indicator that scales itself to the Avatar it sits in.
	 *
	 * Each variant pairs a colour with a distinct built-in shape (filled dot,
	 * ring, minus bar) so status stays distinguishable without colour
	 * perception (WCAG 2.1 SC 1.4.1). Themes can target the shape glyph via the
	 * `astryx-avatar-status-dot-glyph` class and its `data-shape` attribute.
	 *
	 * Belongs in an Avatar's `status` snippet — that is where it can read the
	 * avatar's size from context.
	 */
	const {
		variant = 'success',
		label,
		icon,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: AvatarStatusDotProps = $props();

	const avatarSize = useAvatarSize();
	const tier = $derived(resolveStatusDotSize(avatarSize()));

	// Hand the label up to the enclosing Avatar, which composes it into its own
	// accessible name — see `setAvatarStatusLabelSink` for why the direction is
	// inverted relative to upstream's `status.props.label` read. `$effect` rather
	// than a bare call so a changed `label` re-registers, and so the write lands
	// after the parent's own state is initialised.
	const registerStatusLabel = useAvatarStatusLabelSink();
	$effect(() => {
		registerStatusLabel(label);
		return () => registerStatusLabel(undefined);
	});

	const attrs = $derived(avatarStatusDotAttrs(variant, tier.dotSize, tier.borderWidth, xstyle));
	const iconAttrs = $derived(avatarStatusDotIconAttrs(tier.iconSize));
	const theme = $derived(themeProps('avatar-status-dot', { variant }));

	const showsIcon = $derived(icon !== undefined && tier.iconSize > 0);
	// A rendered icon is itself a non-colour mark; overlaying both cutouts in
	// the dot's small inner field would make each illegible.
	const glyphShape = $derived(showsIcon ? undefined : glyphShapeMap[variant]);
	const glyphTheme = $derived(
		glyphShape ? themeProps('avatar-status-dot-glyph', { shape: glyphShape }) : undefined
	);
	// `viewBox` is one user unit per px of the inner field, so every value the
	// glyph draws with is literal px.
	const field = $derived(tier.dotSize - tier.borderWidth * 2);
	const stroke = $derived(GLYPH_STROKE_WIDTH[tier.tier]);
</script>

<div
	{...rest}
	{...theme}
	class={cx(theme.class, attrs.class, className)}
	style={mergeStyle(attrs.style, styleProp as string | undefined)}
	role={label ? 'img' : undefined}
	aria-label={label}
>
	{#if showsIcon && icon}
		<span aria-hidden="true" class={iconAttrs.class} style={iconAttrs.style}>
			{@render icon()}
		</span>
	{/if}
	{#if glyphShape}
		<!--
			Stroking (rather than a CSS box) is what buys sub-pixel control and
			round line caps, so the mark stays intentional at every tier —
			including the 10px dot, where a box cutout can only land on whole
			pixels.
		-->
		<svg
			aria-hidden="true"
			viewBox="0 0 {field} {field}"
			width={field}
			height={field}
			fill="none"
			{...glyphTheme}
		>
			{#if glyphShape === 'ring'}
				<!--
					Radius is to the stroke centreline, so the ring's outer edge lands
					exactly on the inner field and never clips against the border.
				-->
				<circle
					cx={field / 2}
					cy={field / 2}
					r={(field - stroke) / 2}
					fill="none"
					stroke="currentColor"
					stroke-width={stroke}
				/>
			{:else}
				<!--
					Ends inset by half the stroke so the round caps land inside the
					span rather than overhanging it.
				-->
				<line
					x1={(field * (1 - MINUS_BAR_SPAN)) / 2 + stroke / 2}
					y1={field / 2}
					x2={(field * (1 + MINUS_BAR_SPAN)) / 2 - stroke / 2}
					y2={field / 2}
					stroke="currentColor"
					stroke-width={stroke}
					stroke-linecap="round"
				/>
			{/if}
		</svg>
	{/if}
</div>
