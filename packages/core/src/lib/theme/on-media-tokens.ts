import { resolveTokenValue, type ComponentOverrides, type TokenValue } from './define-theme.js';

/**
 * Ported from Astryx's `src/theme/onMediaTokens.ts`.
 *
 * Token overrides for content rendered on a surface whose luminance differs
 * from the page background — what `<MediaTheme>` marks with
 * `data-astryx-media`.
 *
 * The primary mechanism is `color-scheme`: setting it on the media element
 * makes every `light-dark()` token resolve to that side, so only a handful of
 * tokens need naming explicitly. Text and icon primary take `--color-on-dark` /
 * `--color-on-light` rather than the mode's grey, and accent collapses onto the
 * same on-colour.
 *
 * A theme can add to either set through `onDark` / `onLight` in `defineTheme`;
 * the defaults below always apply, so every theme emits these rules whether or
 * not it says anything about media surfaces.
 */

/** Per-surface overrides — the same shape as a theme, scoped to one luminance. */
export interface OnMediaOverrides {
	/** Token overrides for this surface context. */
	tokens?: Record<string, TokenValue | undefined>;
	/** Component style overrides for this surface context. */
	components?: ComponentOverrides;
}

/**
 * Resolved on-media overrides, stored on the defined theme.
 * @internal
 */
export interface ResolvedOnMedia {
	/** Resolved token CSS values. */
	tokens: Record<string, string>;
	/** Component style overrides, passed through from the input. */
	components?: ComponentOverrides;
}

/**
 * Default token overrides for content on a dark surface.
 *
 * Most tokens follow automatically from `color-scheme: dark` flipping every
 * `light-dark()` value. These are the ones that need a different value on an
 * inverted *surface* than they would on a dark *page*.
 */
export const defaultOnDarkTokens: Record<string, string> = {
	'color-scheme': 'dark',

	// Text/icon primary — the pure on-colour, not the dark-mode grey.
	'--color-text-primary': 'var(--color-on-dark)',
	'--color-icon-primary': 'var(--color-on-dark)',

	// Accent collapses to the on-colour in an inverted context.
	'--color-accent': 'var(--color-on-dark)'
};

/** Default token overrides for content on a light surface. */
export const defaultOnLightTokens: Record<string, string> = {
	'color-scheme': 'light',

	// Text/icon primary — the pure on-colour, not the light-mode dark.
	'--color-text-primary': 'var(--color-on-light)',
	'--color-icon-primary': 'var(--color-on-light)',

	// Accent collapses to the on-colour.
	'--color-accent': 'var(--color-on-light)'
};

/**
 * Merges a theme's on-media overrides over the defaults for that surface.
 *
 * Component overrides pass straight through — they are resolved when the CSS is
 * generated, not here.
 */
export function resolveOnMedia(
	surface: 'dark' | 'light',
	input?: OnMediaOverrides
): ResolvedOnMedia {
	const defaults = surface === 'dark' ? defaultOnDarkTokens : defaultOnLightTokens;

	const tokens = { ...defaults };

	for (const [key, value] of Object.entries(input?.tokens ?? {})) {
		if (value !== undefined) {
			tokens[key] = resolveTokenValue(value);
		}
	}

	return {
		tokens,
		components: input?.components
	};
}
