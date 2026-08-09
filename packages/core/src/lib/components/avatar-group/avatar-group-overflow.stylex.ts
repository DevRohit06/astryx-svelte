import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	fontWeightVars,
	radiusVars,
	spacingVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/**
 * Styles for AvatarGroupOverflow, ported from Astryx's
 * `src/AvatarGroup/AvatarGroupOverflow.tsx`.
 */

const BORDER_WIDTH = 2;
const OVERFLOW_FONT_RATIO = 0.35;

const styles = stylex.create({
	base: {
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: radiusVars['--radius-full'],
		// Use opaque background to prevent avatar bleed-through
		backgroundColor: colorVars['--color-background-surface'],
		color: colorVars['--color-text-secondary'],
		fontFamily: typographyVars['--font-family-body'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		userSelect: 'none',
		borderWidth: BORDER_WIDTH,
		borderStyle: 'solid',
		borderColor: colorVars['--color-background-surface'],
		// border-box so the border and inline padding are included in the box
		// size: a short "+N" stays a circle at exactly the avatar size, while
		// longer content pushes past the min width and grows into a pill.
		boxSizing: 'border-box',
		// Horizontal breathing room so multi-digit "+N" counts don't crowd the
		// edges once the indicator grows into a pill.
		paddingInline: spacingVars['--spacing-2'],
		// Neutral tint layer (preserves opaque base underneath)
		backgroundImage: `linear-gradient(${colorVars['--color-neutral']}, ${colorVars['--color-neutral']})`
	},
	button: {
		cursor: 'pointer',
		// Reset the UA button's block padding only; the inline padding from `base`
		// provides the pill's breathing room and must be preserved.
		paddingBlock: 0,
		// Interactive overlay states layered on top via backgroundImage
		backgroundImage: {
			default: `linear-gradient(${colorVars['--color-neutral']}, ${colorVars['--color-neutral']})`,
			':hover': {
				'@media (hover: hover)': `linear-gradient(${colorVars['--color-overlay-hover']}, ${colorVars['--color-overlay-hover']}), linear-gradient(${colorVars['--color-neutral']}, ${colorVars['--color-neutral']})`
			},
			':active': `linear-gradient(${colorVars['--color-overlay-pressed']}, ${colorVars['--color-overlay-pressed']}), linear-gradient(${colorVars['--color-neutral']}, ${colorVars['--color-neutral']})`
		},
		// Focus ring via focus-visible
		outline: {
			default: 'none',
			':focus-visible': `2px solid ${colorVars['--color-accent']}`
		},
		outlineOffset: {
			default: null,
			':focus-visible': '2px'
		}
	},
	overlap: {
		marginInlineStart: 'var(--_avatar-group-overlap)'
	}
});

const dynamicStyles = stylex.create({
	size: (s: number) => ({
		// Pin height to the avatar's rendered size and enforce the same value as a
		// *minimum* width, so short counts (`+5`) render a perfect circle. With
		// border-box, the inline padding lives inside this size; longer content
		// (`+4912`) pushes past the min width and grows into a stadium/pill.
		// The border is added to the declared size (like the avatars' ring, which
		// uses content-box + a 2px border) to keep the indicator the same overall
		// size as its sibling avatars.
		minWidth: s + BORDER_WIDTH * 2,
		height: s + BORDER_WIDTH * 2
	}),
	fontSize: (s: number) => ({
		fontSize: s * OVERFLOW_FONT_RATIO
	}),
	overlap: (offset: number) => ({
		'--_avatar-group-overlap': `${offset}px`
	})
});

export interface AvatarGroupOverflowAttrsOptions {
	numericSize: number;
	overlap: number;
	/** Renders as a `<button>`, which adds the pointer, hover and focus states. */
	isInteractive: boolean;
}

export function avatarGroupOverflowAttrs(
	{ numericSize, overlap, isInteractive }: AvatarGroupOverflowAttrsOptions,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(
		styles.base,
		isInteractive && styles.button,
		styles.overlap,
		dynamicStyles.size(numericSize),
		dynamicStyles.fontSize(numericSize),
		dynamicStyles.overlap(-overlap),
		xstyle
	);
}
