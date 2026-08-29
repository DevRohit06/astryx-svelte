import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars, spacingVars, typeScaleVars } from '../../styles/tokens.stylex.js';
import { focusOutlineStyles } from '../../utils/focus-outline.stylex.js';
import { overlayPaddingReset } from '../../internal/padding.stylex.js';

const styles = stylex.create({
	dialog: {
		position: 'fixed',
		inset: 0,
		width: '100vw',
		height: '100vh',
		maxWidth: 'none',
		maxHeight: 'none',
		margin: 0,
		padding: 0,
		border: 'none',
		backgroundColor: 'transparent',
		overflow: 'hidden',
		outline: 'none',
		'::backdrop': {
			backgroundColor: colorVars['--color-overlay'],
			backdropFilter: 'blur(2px)'
		}
	},
	container: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
		height: '100%',
		position: 'relative'
	},
	mediaGroup: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		maxWidth: '100%',
		maxHeight: '100%',
		overflow: 'hidden'
	},
	imageWrapper: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
		cursor: 'default',
		userSelect: 'none',
		minHeight: 0
	},
	imageWrapperZoomable: {
		cursor: {
			default: 'zoom-in',
			'@media (hover: hover)': 'zoom-in',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
	},
	imageWrapperZoomed: {
		cursor: {
			default: 'grab',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
	},
	imageWrapperDragging: {
		cursor: {
			default: 'grabbing',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
	},
	image: {
		maxWidth: '100%',
		maxHeight: '100%',
		objectFit: 'contain',
		pointerEvents: 'none',
		transitionProperty: 'transform',
		transitionDuration: {
			default: '200ms',
			'@media (prefers-reduced-motion: reduce)': '0ms'
		},
		transitionTimingFunction: 'ease-out'
	},
	imageDragging: {
		transitionProperty: 'none'
	},
	video: {
		maxWidth: '100%',
		maxHeight: '100%',
		objectFit: 'contain',
		outline: 'none'
	},
	caption: {
		color: colorVars['--color-on-dark'],
		fontSize: typeScaleVars['--text-large-size'],
		lineHeight: typeScaleVars['--text-large-leading'],
		textAlign: 'center',
		paddingBlockStart: spacingVars['--spacing-2'],
		paddingBlockEnd: 0,
		paddingInline: spacingVars['--spacing-3'],
		maxWidth: '600px',
		flexShrink: 0
	},
	closeButton: {
		position: 'absolute',
		top: spacingVars['--spacing-3'],
		insetInlineEnd: spacingVars['--spacing-3'],
		zIndex: 1
	},
	navButton: {
		position: 'absolute',
		top: '50%',
		// The individual `translate` property, not `transform`: this style now
		// lands on the Button root, and a `transform` here replaces the Button's
		// own transform rules — measured: the `scale(0.98)` press feedback stops
		// firing. `translate` composes with them, reproducing exactly what the
		// removed wrapper element did (wrapper translated, button scaled).
		translate: '0 -50%',
		zIndex: 1
	},
	navPrev: {
		insetInlineStart: spacingVars['--spacing-3']
	},
	navNext: {
		insetInlineEnd: spacingVars['--spacing-3']
	},
	counter: {
		position: 'absolute',
		top: spacingVars['--spacing-3'],
		insetInlineStart: spacingVars['--spacing-3'],
		color: colorVars['--color-on-dark'],
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading'],
		zIndex: 1
	},
	controlButton: {
		color: colorVars['--color-on-dark']
	}
});

const dynamicStyles = stylex.create({
	imageTransform: (transform: string) => ({
		transform
	})
});

export function lightboxDialogAttrs(xstyle?: StyleArg): SvelteStyleAttrs {
	// The overlay root is not inside any padded container, so the inherited
	// container padding vars are reset at its boundary.
	return sx(styles.dialog, overlayPaddingReset.reset, xstyle);
}

export function lightboxContainerAttrs(): SvelteStyleAttrs {
	return sx(styles.container);
}

export function lightboxMediaGroupAttrs(): SvelteStyleAttrs {
	return sx(styles.mediaGroup);
}

/**
 * Declaration order matters and is upstream's: `zoomed` beats `zoomable`, and
 * `dragging` beats both. The compiled lookup table in the published `dist/`
 * encodes exactly that precedence, so reordering these would change the merge.
 *
 * The shared focus ring sits second, as upstream applies it — it is the
 * wrapper's `role="button"` focus affordance and shares no property with the
 * cursor styles, so its position is fidelity rather than precedence. Through
 * 0.3.0 this was a local `zoomTarget` key holding a hand-written ring; upstream
 * 0.4.1 replaced the key outright with `focusOutlineStyles.focusVisible`.
 */
export function lightboxImageWrapperAttrs(
	isZoomTarget: boolean,
	isZoomable: boolean,
	isZoomed: boolean,
	isDragging: boolean
): SvelteStyleAttrs {
	return sx(
		styles.imageWrapper,
		isZoomTarget && focusOutlineStyles.focusVisible,
		isZoomable && styles.imageWrapperZoomable,
		isZoomed && styles.imageWrapperZoomed,
		isDragging && styles.imageWrapperDragging
	);
}

export function lightboxImageAttrs(
	isDragging: boolean,
	transform: string | null
): SvelteStyleAttrs {
	return sx(
		styles.image,
		isDragging && styles.imageDragging,
		transform != null && dynamicStyles.imageTransform(transform)
	);
}

export function lightboxVideoAttrs(): SvelteStyleAttrs {
	return sx(styles.video);
}

export function lightboxCaptionAttrs(): SvelteStyleAttrs {
	return sx(styles.caption);
}

export function lightboxCounterAttrs(): SvelteStyleAttrs {
	return sx(styles.counter);
}

/**
 * Handed to `IconButton`'s `xstyle`, as upstream hands over the same styles.
 *
 * These were `…Attrs()` builders on wrapper `<div>`s until #4775, which deleted
 * the wrappers and put the positioning on the Button root itself. That is why
 * `navButton` had to move from `transform` to `translate` — see the note at the
 * declaration.
 */
export const lightboxControlButtonStyle = styles.controlButton;
export const lightboxCloseButtonStyle = styles.closeButton;
export const lightboxNavButtonStyle = styles.navButton;
export const lightboxNavPrevStyle = styles.navPrev;
export const lightboxNavNextStyle = styles.navNext;
