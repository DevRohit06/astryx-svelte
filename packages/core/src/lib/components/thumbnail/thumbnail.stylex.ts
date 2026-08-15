import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { focusOutlineProps } from '../../utils/focus-outline.stylex.js';
import {
	colorVars,
	durationVars,
	easeVars,
	radiusVars,
	spacingVars
} from '../../styles/tokens.stylex.js';

const styles = stylex.create({
	root: {
		position: 'relative',
		display: 'inline-flex',
		flexDirection: 'column',
		width: 64,
		flexShrink: 0,
		isolation: 'isolate'
	},
	imageContainer: {
		position: 'relative',
		width: '100%',
		aspectRatio: '1',
		borderRadius: radiusVars['--radius-element'],
		overflow: 'hidden',
		backgroundColor: colorVars['--color-neutral']
	},
	image: {
		width: '100%',
		height: '100%',
		objectFit: 'cover',
		display: 'block'
	},
	// An inset ring rather than a border: the image fills the container, so a
	// real border would either sit outside the radius or eat into the picture.
	insetBorder: {
		position: 'absolute',
		inset: 0,
		borderRadius: 'inherit',
		boxShadow: `inset 0 0 0 1px ${colorVars['--color-border']}`,
		pointerEvents: 'none'
	},
	placeholder: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
		height: '100%',
		color: colorVars['--color-icon-secondary']
	},
	interactive: {
		cursor: 'pointer'
	},
	// Hover/pressed overlay — the exact same treatment as ClickableCard and
	// SelectableCard. A transparent `::after` tints on hover/press instead of
	// shifting shadow or opacity. Guarded by @media (hover: hover) so touch
	// devices don't show a stuck hover state; active/pressed works everywhere.
	overlay: {
		'::after': {
			content: '""',
			position: 'absolute',
			inset: 0,
			borderRadius: 'inherit',
			pointerEvents: 'none',
			transitionProperty: 'background-color',
			transitionDuration: durationVars['--duration-fast'],
			transitionTimingFunction: easeVars['--ease-standard'],
			backgroundColor: 'transparent'
		},
		':active::after': {
			backgroundColor: colorVars['--color-overlay-pressed']
		}
	},
	hoverOnPointer: {
		'@media (hover: hover)': {
			':hover::after': {
				backgroundColor: colorVars['--color-overlay-hover']
			}
		}
	},
	interactiveButton: {
		all: 'unset',
		cursor: 'pointer',
		display: 'block',
		width: '100%',
		height: '100%',
		borderRadius: radiusVars['--radius-element'],
		overflow: 'hidden'
	},

	removeSlot: {
		position: 'absolute',
		top: spacingVars['--spacing-1'],
		insetInlineEnd: spacingVars['--spacing-1'],
		zIndex: 1,
		lineHeight: 0
	},
	removeButtonOverrides: {
		'--_button-radius': `calc(${radiusVars['--radius-element']} - ${spacingVars['--spacing-1']})`,
		height: 20,
		minWidth: 20,
		// Fixed colors instead of luminance-adapting theme: a translucent scrim
		// (--color-overlay) plus an --color-on-dark icon reads on any image
		// without sampling pixel brightness.
		backgroundColor: colorVars['--color-overlay'],
		color: colorVars['--color-on-dark']
	},
	disabled: {
		opacity: 0.5,
		pointerEvents: 'none' as const
	},
	uploadOverlay: {
		position: 'absolute',
		inset: 0,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colorVars['--color-overlay'],
		borderRadius: 'inherit',
		zIndex: 1,
		lineHeight: 0
	}
});

export function thumbnailRootAttrs(isDisabled: boolean, xstyle?: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, isDisabled && styles.disabled, xstyle);
}

/**
 * The square picture box.
 *
 * It used to carry a `thumbnailScope` marker for the remove button's hover
 * reveal. Upstream 0.3.0 moved that whole mechanism into `useContainerReveal`
 * and deleted `thumbnail.markers.stylex.ts`, so the marker now comes from the
 * hook's pool and is merged onto the element beside these classes rather than
 * into them — which is also why the compiler can fold this call site again.
 */
export function thumbnailImageContainerAttrs(isInteractive: boolean): SvelteStyleAttrs {
	return focusOutlineProps.focusWithin(
		styles.imageContainer,
		isInteractive && styles.interactive,
		isInteractive && styles.overlay,
		isInteractive && styles.hoverOnPointer
	);
}

export function thumbnailImageAttrs(): SvelteStyleAttrs {
	return sx(styles.image);
}

export function thumbnailInsetBorderAttrs(): SvelteStyleAttrs {
	return sx(styles.insetBorder);
}

export function thumbnailPlaceholderAttrs(): SvelteStyleAttrs {
	return sx(styles.placeholder);
}

export function thumbnailInteractiveButtonAttrs(): SvelteStyleAttrs {
	return sx(styles.interactiveButton);
}

/**
 * The positioned corner the remove button sits in. The reveal transition is no
 * longer here — `useContainerReveal` supplies it, and the component merges the
 * two class lists as upstream's `mergeProps` does.
 */
export function thumbnailRemoveSlotAttrs(): SvelteStyleAttrs {
	return sx(styles.removeSlot);
}

/**
 * Sizing and colour overrides handed to the remove `<Button>` as its `xstyle`,
 * as upstream passes them.
 */
export const thumbnailRemoveButtonXstyle: StyleArg = styles.removeButtonOverrides;

export function thumbnailUploadOverlayAttrs(): SvelteStyleAttrs {
	return sx(styles.uploadOverlay);
}
