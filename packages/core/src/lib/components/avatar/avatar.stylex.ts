import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	fontWeightVars,
	radiusVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/**
 * Styles and size resolution for Avatar, ported from Astryx's
 * `src/Avatar/Avatar.tsx`.
 */

/**
 * Named size options.
 *
 * Avatar uses the same abbreviated scale as Icon (`xsm`/`sm`/`md`/`lg`/`xl`),
 * but the values are larger because avatars align with media rather than
 * glyphs. The tiers follow the standard avatar size scale.
 */
type AvatarNamedSize = 'xsm' | 'sm' | 'md' | 'lg' | 'xl';

/** Numeric size options (in pixels). */
type AvatarNumericSize = 16 | 20 | 24 | 32 | 36 | 40 | 48 | 60 | 64 | 72 | 96 | 128 | 144 | 180;

/** Avatar size — a named size or a specific pixel value. */
export type AvatarSize = AvatarNamedSize | AvatarNumericSize;

/** Resolves named sizes to their numeric pixel values. */
export function resolveSize(size: AvatarSize): number {
	if (typeof size === 'number') {
		return size;
	}
	switch (size) {
		case 'xsm':
			return 20;
		case 'sm':
			return 24;
		case 'md':
			return 36;
		case 'lg':
			return 48;
		case 'xl':
			return 128;
	}
}

/**
 * The offset ratio for positioning elements on a circle's edge at 45°.
 *
 * For a square with side length S containing an inscribed circle of diameter S,
 * a diagonal line from corner to corner intersects the circle at:
 *   x = S/2 × (1 ± 1/√2)
 *
 * The distance from the corner to this intersection point (along each axis) is:
 *   S/2 × (1 - 1/√2) ≈ 0.146S
 *
 * This constant represents that ratio: (1 - 1/√2) / 2 ≈ 0.146
 */
const CIRCLE_EDGE_OFFSET_RATIO = (1 - 1 / Math.SQRT2) / 2;

/**
 * The ratio of font size to avatar size for initials.
 *
 * At 40%, two-letter initials fit comfortably within the circle with adequate
 * padding. This ratio provides good legibility across all avatar sizes:
 *   - 24px avatar → 9.6px font
 *   - 48px avatar → 19.2px font
 *   - 128px avatar → 51.2px font
 */
const INITIALS_FONT_SIZE_RATIO = 0.4;

/**
 * Base styles for the avatar.
 *
 * Uses a wrapper/content structure so status isn't clipped by overflow:hidden.
 */
const styles = stylex.create({
	wrapper: {
		position: 'relative',
		display: 'inline-flex',
		flexShrink: 0,
		// The wrapper is not clipped (so the status dot can overflow), so it must be
		// rounded itself: a themed fallback background lands on `.astryx-avatar` (the
		// class-bearing wrapper) as well as the internal var, and an unrounded
		// wrapper would show that fill as square corners behind the circular content.
		borderRadius: radiusVars['--radius-full']
	},
	content: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: radiusVars['--radius-full'],
		overflow: 'hidden',
		userSelect: 'none'
	},
	image: {
		width: '100%',
		height: '100%',
		objectFit: 'cover'
	},
	fallback: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
		height: '100%',
		// Fallback surface (initials + default icon). Each property reads an
		// Avatar-scoped internal var so a theme can re-scope the fallback wash and
		// initials weight/color without forking; the defaults reproduce today's
		// exact output. See derivedVarRegistry (avatar) + Avatar.doc.mjs theming.
		backgroundColor: `var(--_avatar-fallback-background, ${colorVars['--color-neutral']})`,
		color: `var(--_avatar-fallback-color, ${colorVars['--color-text-secondary']})`,
		fontFamily: typographyVars['--font-family-body'],
		fontWeight: `var(--_avatar-fallback-font-weight, ${fontWeightVars['--font-weight-medium']})`,
		textTransform: 'uppercase'
	},
	status: {
		position: 'absolute'
	},
	// Visible focus ring for the name-tooltip tab stop, matching the repo-wide
	// focus-visible outline treatment (see Timestamp, Token, Thumbnail). Only
	// applied when a tooltip is active so keyboard users can reveal it.
	focusable: {
		outline: {
			default: null,
			':focus-visible': `2px solid ${colorVars['--color-accent']}`
		},
		outlineOffset: {
			default: '0',
			':focus-visible': '2px'
		}
	},
	// Reset the intrinsic styling of the interactive element (<a>/<button>) so it
	// is a transparent, correctly-sized wrapper around the avatar visuals. The
	// element carries the focus-visible accent ring for keyboard users.
	interactive: {
		appearance: 'none',
		padding: 0,
		margin: 0,
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		color: 'inherit',
		font: 'inherit',
		textDecoration: 'none',
		cursor: 'pointer',
		// Match the avatar's circular shape so the focus ring hugs it.
		borderRadius: radiusVars['--radius-full'],
		outlineWidth: {
			default: 0,
			':focus-visible': 2
		},
		outlineStyle: {
			default: 'none',
			':focus-visible': 'solid'
		},
		outlineColor: {
			default: null,
			':focus-visible': colorVars['--color-accent']
		},
		outlineOffset: {
			default: 0,
			':focus-visible': 2
		}
	}
});

/** Dynamic styles that depend on the avatar size. */
const dynamicStyles = stylex.create({
	size: (size: number) => ({
		width: size,
		height: size
	}),
	// Initials font size defaults to the proportional `size × ratio` scale but is
	// reachable via the `--_avatar-fallback-font-size` derived var, so a theme can
	// set a per-size type scale (e.g. `components.avatar['size:sm']`).
	fontSize: (size: number) => ({
		fontSize: `var(--_avatar-fallback-font-size, ${size * INITIALS_FONT_SIZE_RATIO}px)`
	}),
	statusPosition: (size: number) => ({
		bottom: size * CIRCLE_EDGE_OFFSET_RATIO,
		insetInlineEnd: size * CIRCLE_EDGE_OFFSET_RATIO,
		// `insetInlineEnd` anchors to the right edge in LTR / left in RTL, so the
		// outward push must mirror too: +X in LTR, −X in RTL (Y is unaffected).
		transform: {
			default: 'translate(50%, 50%)',
			':is([dir="rtl"] *)': 'translate(-50%, 50%)'
		}
	})
});

const BORDER_WIDTH = 2;

const groupStyles = stylex.create({
	ring: {
		borderRadius: radiusVars['--radius-full'],
		borderWidth: BORDER_WIDTH,
		borderStyle: 'solid',
		borderColor: colorVars['--color-background-surface'],
		backgroundColor: colorVars['--color-background-surface'],
		boxSizing: 'content-box'
	},
	overlap: {
		marginInlineStart: {
			default: null,
			':not(:first-child)': 'var(--_avatar-group-overlap)'
		}
	}
});

const groupDynamicStyles = stylex.create({
	overlap: (offset: number) => ({
		'--_avatar-group-overlap': `${offset}px`
	})
});

export interface AvatarWrapperAttrsOptions {
	/** The group's overlap in pixels, or null outside a group. */
	groupOverlap: number | null;
	/** Whether the root renders as an `<a>`/`<button>` rather than a `<div>`. */
	isInteractive: boolean;
	/** Whether a name tooltip is active on a *static* root outside a group. */
	hasTooltipTabStop: boolean;
}

/**
 * The root, in every variant. `groupOverlap` non-null means the avatar is
 * inside a group, where it grows a surface-coloured ring and pulls back over
 * its predecessor.
 *
 * The interactive reset, the tooltip tab stop's focus ring and the group
 * ring/overlap all resolve here so the `<a>`/`<button>` and the static `<div>`
 * carry the exact same box — which is upstream's `rootStylexProps`, and the
 * reason the element swap is invisible to layout.
 */
export function avatarWrapperAttrs(
	{ groupOverlap, isInteractive, hasTooltipTabStop }: AvatarWrapperAttrsOptions,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.wrapper,
		isInteractive && styles.interactive,
		!isInteractive && hasTooltipTabStop && groupOverlap == null && styles.focusable,
		groupOverlap != null && groupStyles.ring,
		groupOverlap != null && groupStyles.overlap,
		groupOverlap != null && groupDynamicStyles.overlap(-groupOverlap),
		xstyle
	);
}

/** The clipping circle the image, initials or icon sits inside. */
export function avatarContentAttrs(size: number): SvelteStyleAttrs {
	return sx(styles.content, dynamicStyles.size(size));
}

export function avatarImageAttrs(): SvelteStyleAttrs {
	return sx(styles.image);
}

/** The initials plate. Its font size tracks the avatar's. */
export function avatarInitialsAttrs(size: number): SvelteStyleAttrs {
	return sx(styles.fallback, dynamicStyles.fontSize(size));
}

/** The generic-icon plate. No text, so no font size to scale. */
export function avatarIconAttrs(): SvelteStyleAttrs {
	return sx(styles.fallback);
}

/** The status slot, pinned to the circle's edge along the 45° diagonal. */
export function avatarStatusAttrs(size: number): SvelteStyleAttrs {
	return sx(styles.status, dynamicStyles.statusPosition(size));
}
