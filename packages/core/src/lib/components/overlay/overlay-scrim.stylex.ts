import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { colorVars, durationVars, easeVars, spacingVars } from '../../styles/tokens.stylex.js';
import { overlayScope } from './overlay.markers.stylex.js';

/**
 * `OverlayScrim`'s styles, ported from Astryx's `OverlayScrim.tsx`.
 *
 * The `showOn` modes are **entirely CSS**: `when.ancestor(':hover', overlayScope)`
 * resolves against the marker the container carries, so hover and focus reveal
 * without a single event listener. That is why the only JS state in the whole
 * overlay system is the touch tap-toggle — a device with no hover has no
 * `:hover` to key off.
 */

export type OverlayScrimMode = 'dark' | 'light' | false;
export type OverlayPosition = 'fill' | 'bottom' | 'top';
export type OverlayAlign = 'start' | 'center' | 'end';
export type OverlayShowOn = 'hover' | 'always' | 'focus' | 'hover-or-focus';

const styles = stylex.create({
	base: {
		position: 'absolute',
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-2'],
		padding: spacingVars['--spacing-3'],
		pointerEvents: 'none',
		transitionProperty: 'opacity, visibility, transform',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard']
	},

	// Position variants
	fill: { inset: 0 },
	bottom: { insetInline: 0, bottom: 0 },
	top: { insetInline: 0, top: 0 },

	// Alignment
	alignStart: { alignItems: 'flex-start', justifyContent: 'flex-start' },
	alignCenter: { alignItems: 'center', justifyContent: 'center' },
	alignEnd: { alignItems: 'flex-end', justifyContent: 'flex-start' },

	// Scrim backgrounds
	scrimDark: { backgroundColor: colorVars['--color-overlay'] },
	// TODO: Replace with --color-overlay-light token when added
	scrimLight: { backgroundColor: 'color-mix(in srgb, white 60%, transparent)' },

	// Hidden: strips slide out, fill fades
	hidden: { opacity: 0, visibility: 'hidden' },
	hiddenBottom: { transform: 'translateY(100%)' },
	hiddenTop: { transform: 'translateY(-100%)' },

	// Visible
	visible: {
		opacity: 1,
		visibility: 'visible',
		pointerEvents: 'auto',
		transform: 'translateY(0)',
		'@starting-style': {
			opacity: 0
		}
	},

	// @starting-style for strips: slide in on mount
	visibleFromBottom: {
		'@starting-style': {
			opacity: 0,
			transform: 'translateY(100%)'
		}
	},
	visibleFromTop: {
		'@starting-style': {
			opacity: 0,
			transform: 'translateY(-100%)'
		}
	},

	// CSS-driven: ancestor hover + focus (accessible default)
	hoverReveal: {
		opacity: {
			default: 0,
			[stylex.when.ancestor(':hover', overlayScope)]: {
				'@media (hover: hover)': 1
			},
			[stylex.when.ancestor(':focus-within', overlayScope)]: 1
		},
		visibility: {
			default: 'hidden',
			[stylex.when.ancestor(':hover', overlayScope)]: {
				'@media (hover: hover)': 'visible'
			},
			[stylex.when.ancestor(':focus-within', overlayScope)]: 'visible'
		},
		pointerEvents: {
			default: 'none',
			[stylex.when.ancestor(':hover', overlayScope)]: {
				'@media (hover: hover)': 'auto'
			},
			[stylex.when.ancestor(':focus-within', overlayScope)]: 'auto'
		}
	},

	// Slide transform for strip hover reveal
	hoverRevealBottom: {
		transform: {
			default: 'translateY(100%)',
			[stylex.when.ancestor(':hover', overlayScope)]: {
				'@media (hover: hover)': 'translateY(0)'
			},
			[stylex.when.ancestor(':focus-within', overlayScope)]: 'translateY(0)'
		}
	},
	hoverRevealTop: {
		transform: {
			default: 'translateY(-100%)',
			[stylex.when.ancestor(':hover', overlayScope)]: {
				'@media (hover: hover)': 'translateY(0)'
			},
			[stylex.when.ancestor(':focus-within', overlayScope)]: 'translateY(0)'
		}
	},

	// CSS-driven: focus-within only
	focusReveal: {
		opacity: {
			default: 0,
			[stylex.when.ancestor(':focus-within', overlayScope)]: 1
		},
		visibility: {
			default: 'hidden',
			[stylex.when.ancestor(':focus-within', overlayScope)]: 'visible'
		},
		pointerEvents: {
			default: 'none',
			[stylex.when.ancestor(':focus-within', overlayScope)]: 'auto'
		}
	},

	focusRevealBottom: {
		transform: {
			default: 'translateY(100%)',
			[stylex.when.ancestor(':focus-within', overlayScope)]: 'translateY(0)'
		}
	},
	focusRevealTop: {
		transform: {
			default: 'translateY(-100%)',
			[stylex.when.ancestor(':focus-within', overlayScope)]: 'translateY(0)'
		}
	}
});

const alignMap = {
	start: styles.alignStart,
	center: styles.alignCenter,
	end: styles.alignEnd
} as const;

const positionMap = {
	fill: styles.fill,
	bottom: styles.bottom,
	top: styles.top
} as const;

/**
 * Visibility/animation styles for a JS-controlled overlay (`isOpen` defined).
 * `position` decides the slide direction for the strip variants.
 */
function getControlledVisibility(isOpen: boolean, position: OverlayPosition) {
	if (isOpen) {
		return {
			base: styles.visible,
			bottom: position === 'bottom' && styles.visibleFromBottom,
			top: position === 'top' && styles.visibleFromTop
		};
	}
	return {
		base: styles.hidden,
		bottom: position === 'bottom' && styles.hiddenBottom,
		top: position === 'top' && styles.hiddenTop
	};
}

/**
 * Visibility/animation styles for a CSS-driven overlay (`showOn` mode). Each
 * mode has a base reveal style plus an optional position-based slide.
 */
function getShowOnVisibility(showOn: OverlayShowOn, position: OverlayPosition) {
	switch (showOn) {
		case 'always':
			return {
				base: styles.visible,
				bottom: position === 'bottom' && styles.visibleFromBottom,
				top: position === 'top' && styles.visibleFromTop
			};
		case 'hover':
		case 'hover-or-focus':
			return {
				base: styles.hoverReveal,
				bottom: position === 'bottom' && styles.hoverRevealBottom,
				top: position === 'top' && styles.hoverRevealTop
			};
		case 'focus':
			return {
				base: styles.focusReveal,
				bottom: position === 'bottom' && styles.focusRevealBottom,
				top: position === 'top' && styles.focusRevealTop
			};
	}
}

export interface OverlayScrimAttrsOptions {
	scrim: OverlayScrimMode;
	position: OverlayPosition;
	align: OverlayAlign;
	showOn: OverlayShowOn;
	isOpen: boolean | undefined;
}

export function overlayScrimAttrs(
	{ scrim, position, align, showOn, isOpen }: OverlayScrimAttrsOptions,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	const visibility =
		isOpen !== undefined
			? getControlledVisibility(isOpen, position)
			: getShowOnVisibility(showOn, position);

	return sx(
		styles.base,
		positionMap[position],
		alignMap[align],
		scrim === 'dark' && styles.scrimDark,
		scrim === 'light' && styles.scrimLight,
		visibility.base,
		visibility.bottom,
		visibility.top,
		xstyle
	);
}
