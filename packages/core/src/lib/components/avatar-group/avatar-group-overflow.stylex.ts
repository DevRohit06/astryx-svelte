import * as stylex from '@stylexjs/stylex';
import type { StyleArg, SvelteStyleAttrs } from '../../internal/sx.js';
import { focusOutlineProps } from '../../utils/focus-outline.stylex.js';
import { interactionOverlayStyles } from '../../utils/interaction-overlay.stylex.js';
import { shapeStyles, type AvatarShape } from '../avatar/avatar.stylex.js';
import {
	colorVars,
	fontWeightVars,
	spacingVars,
	typeScaleVars,
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
		// inline-flex, not flex: outside an AvatarGroup this span is not a flex
		// item, and a block-level flex container stretches to its parent's width
		// instead of staying a circle.
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		// Reads the shape variant's `--_avatar-radius` (set via `shapeStyles`,
		// shared with Avatar) so the overflow indicator matches the group's
		// shape instead of always staying a circle. New at upstream 0.5.1,
		// alongside Avatar's `shape` prop which is what defines the variable.
		borderRadius: 'var(--_avatar-radius)',
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
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		// Reset the UA button's block padding only; the inline padding from `base`
		// provides the pill's breathing room and must be preserved.
		paddingBlock: 0
	},
	overlap: {
		// Matches Avatar's own overlap rule: the first item in the row must not be
		// pulled outside the group's box.
		marginInlineStart: {
			default: null,
			':not(:first-child)': 'var(--_avatar-group-overlap)'
		}
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
		// Scales with the avatar, but never below the supporting-text role token,
		// which is the 12px legibility floor. At xsm the bare ratio computes 7px,
		// where the glyph stroke is thinner than a pixel and never reaches its
		// own text colour (measured 1.63:1 against a 4.5:1 requirement).
		fontSize: `max(${typeScaleVars['--text-supporting-size']}, ${s * OVERFLOW_FONT_RATIO}px)`
	}),
	overlap: (offset: number) => ({
		'--_avatar-group-overlap': `${offset}px`
	})
});

export interface AvatarGroupOverflowAttrsOptions {
	numericSize: number;
	overlap: number;
	/** The group's shape variant, which is what declares `--_avatar-radius`. */
	shape: AvatarShape;
	/** Renders as a `<button>`, which adds the pointer, hover and focus states. */
	isInteractive: boolean;
}

export function avatarGroupOverflowAttrs(
	{ numericSize, overlap, shape, isInteractive }: AvatarGroupOverflowAttrsOptions,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(
		styles.base,
		isInteractive && styles.button,
		// Upstream 0.5.1 moved the hover/pressed overlay into the shared module.
		// `OnNeutral`: this button paints a neutral fill the overlays layer onto.
		isInteractive && interactionOverlayStyles.backgroundImageOnNeutral,
		styles.overlap,
		dynamicStyles.size(numericSize),
		dynamicStyles.fontSize(numericSize),
		dynamicStyles.overlap(-overlap),
		// `base` reads `--_avatar-radius`, and nothing else on this element declares
		// it: the group root does not set it and a sibling Avatar sets it only on its
		// own wrapper, so without this the "+N" chip resolves an invalid
		// `border-radius` and renders square at every shape. Shared with Avatar so
		// the chip is the same shape as the faces it follows.
		shapeStyles[shape],
		xstyle
	);
}
