import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars, radiusVars } from '../../styles/tokens.stylex.js';

/**
 * Styles for AvatarStatusDot, ported from Astryx's
 * `src/Avatar/AvatarStatusDot.tsx`.
 */

/**
 * Discrete size tier of the status dot, derived from the avatar size.
 * Keys the built-in shape glyph's stroke weight — see `GLYPH_STROKE_WIDTH`.
 */
export type StatusDotSizeTier = 'small' | 'medium' | 'large';

/**
 * Resolves the status dot size, border width, icon size, and size tier based
 * on the avatar size.
 *
 * Uses discrete size tiers rather than a continuous ratio so the dot
 * looks intentional at every avatar size:
 *
 *   | Avatar size  | Tier   | Dot  | Border | Icon | Field | Glyph stroke |
 *   |--------------|--------|------|--------|------|-------|--------------|
 *   | ≤ 36px       | small  | 10px | 1px    | —    | 8px   | 1px          |
 *   | 40–72px      | medium | 20px | 2px    | 12px | 16px  | 1.5px        |
 *   | ≥ 96px       | large  | 32px | 4px    | 18px | 24px  | 2px          |
 *
 * "Field" is the dot's inner field — the dot minus both borders — that the
 * shape glyph is drawn into; see `GLYPH_STROKE_WIDTH` for the stroke ladder.
 *
 * Icons are not rendered at the smallest tier — there isn't enough room for
 * them to be legible. The built-in shape glyphs (see `glyphShapeMap`) do
 * render there, so status stays distinguishable without colour at every size.
 */
export function resolveStatusDotSize(avatarSize: number): {
	dotSize: number;
	borderWidth: number;
	iconSize: number;
	tier: StatusDotSizeTier;
} {
	if (avatarSize <= 36) {
		return { dotSize: 10, borderWidth: 1, iconSize: 0, tier: 'small' };
	}
	if (avatarSize <= 72) {
		return { dotSize: 20, borderWidth: 2, iconSize: 12, tier: 'medium' };
	}
	return { dotSize: 32, borderWidth: 4, iconSize: 18, tier: 'large' };
}

/**
 * Extensible variant map for AvatarStatusDot.
 *
 * Theme packages add their own variants by augmenting this interface:
 *
 * @example
 * declare module '@astryx-svelte/core' {
 *   interface AvatarStatusDotVariantMap {
 *     away: true;
 *   }
 * }
 *
 * Custom variants render no background fill, no ink colour, and no built-in
 * shape glyph — the theme must supply the fill and, if it passes an `icon`, a
 * `color` for it to paint with. It should also supply a non-colour mark so the
 * status is not distinguishable by colour alone (a WCAG 1.4.1 failure): pass
 * `icon`, or theme a glyph onto the dot via
 * `.astryx-avatar-status-dot[data-variant="..."]` (e.g. a `::before` mark).
 */
export interface AvatarStatusDotVariantMap {
	success: true;
	neutral: true;
	error: true;
}

/** AvatarStatusDot variant. Extensible via `AvatarStatusDotVariantMap`. */
export type AvatarStatusDotVariant = keyof AvatarStatusDotVariantMap;

const styles = stylex.create({
	dot: {
		borderRadius: radiusVars['--radius-full'],
		borderStyle: 'solid',
		borderColor: colorVars['--color-background-surface'],
		boxSizing: 'border-box',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center'
	},
	// Each variant sets both the plate colour and the ink colour. Everything
	// drawn on the dot — the shape glyph and any user `icon` — paints from
	// `currentColor`, so the two can never drift out of contrast.
	success: {
		backgroundColor: colorVars['--color-success'],
		color: colorVars['--color-background-surface']
	},
	// The ring variant inverts: a hollow shape only reads as hollow if its
	// interior is not the variant colour, so the plate is surface and the
	// colour moves to the stroke. This also keeps a user `icon` legible on
	// it — surface ink on a surface plate would be invisible.
	neutral: {
		backgroundColor: colorVars['--color-background-surface'],
		color: colorVars['--color-text-secondary']
	},
	error: {
		backgroundColor: colorVars['--color-error'],
		color: colorVars['--color-background-surface']
	},
	icon: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		lineHeight: 0
	}
});

const dynamicStyles = stylex.create({
	size: (dotSize: number, borderWidth: number) => ({
		width: dotSize,
		height: dotSize,
		borderWidth
	}),
	iconSize: (size: number) => ({
		width: size,
		height: size
	})
});

/**
 * Upstream keeps this map so an unknown (theme-added) variant resolves to
 * `undefined` and simply contributes no colour, rather than indexing off the
 * end of `styles`.
 */
const variantStyleMap: Partial<Record<AvatarStatusDotVariant, unknown>> = {
	success: styles.success,
	neutral: styles.neutral,
	error: styles.error
};

export function avatarStatusDotAttrs(
	variant: AvatarStatusDotVariant,
	dotSize: number,
	borderWidth: number,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.dot,
		variantStyleMap[variant] as Record<string, unknown> | undefined,
		dynamicStyles.size(dotSize, borderWidth),
		xstyle
	);
}

export function avatarStatusDotIconAttrs(iconSize: number): SvelteStyleAttrs {
	return sx(styles.icon, dynamicStyles.iconSize(iconSize));
}

/**
 * Built-in shape glyph per variant, so each status differs by shape and not
 * only by colour (WCAG 2.1 SC 1.4.1). The glyph is a stroked inline SVG
 * painted in `currentColor`:
 * - `ring` — a stroked circle on a surface plate; the dot reads as hollow
 *   (away/offline).
 * - `minus` — a round-capped bar across the filled dot; the dot reads as
 *   "do not disturb" (busy).
 *
 * `success` stays the plain filled dot — filled, hollow, and barred are the
 * three distinct fill topologies. Custom augmented variants have no entry and
 * render no glyph; see the `AvatarStatusDotVariantMap` docs.
 */
export type AvatarStatusDotGlyphShape = 'ring' | 'minus';

export const glyphShapeMap: Partial<Record<AvatarStatusDotVariant, AvatarStatusDotGlyphShape>> = {
	neutral: 'ring',
	error: 'minus'
};

/**
 * Glyph stroke weight per tier, in px of the dot's inner field.
 *
 * Roughly `field / 12`, floored at 1px so the smallest tier stays visible.
 * That lands on the 1 / 1.5 / 2 ladder the rest of the system draws with —
 * `Icon`'s default set strokes at 1.5 in a 24 viewBox, as does the
 * `CheckboxInput` checkmark — rather than the 25% band a CSS box cutout
 * produced, which was several times heavier than any other glyph we ship.
 */
export const GLYPH_STROKE_WIDTH: Record<StatusDotSizeTier, number> = {
	small: 1,
	medium: 1.5,
	large: 2
};

/** Fraction of the inner field the minus bar spans, cap to cap. */
export const MINUS_BAR_SPAN = 0.75;
