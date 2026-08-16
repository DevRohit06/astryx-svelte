import * as stylex from '@stylexjs/stylex';
import {
	borderVars,
	colorVars,
	durationVars,
	easeVars,
	focusVars,
	fontWeightVars,
	radiusVars,
	shadowVars,
	sizeVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { focusOutlineProps } from '../../utils/focus-outline.stylex.js';
import type { Elevation } from '../../internal/types.js';
import type { ButtonGroupContextValue } from '../../internal/contexts.svelte.js';

/**
 * Extensible variant map for Button.
 *
 * Theme packages add their own variants by augmenting this interface:
 *
 * @example
 * declare module '@astryx-svelte/core' {
 *   interface ButtonVariantMap {
 *     'primary-muted': true;
 *   }
 * }
 */
export interface ButtonVariantMap {
	primary: true;
	secondary: true;
	ghost: true;
	destructive: true;
}

/** Button variant. Extensible via {@link ButtonVariantMap}. */
export type ButtonVariant = keyof ButtonVariantMap;
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Base button styles.
 *
 * Pseudo-classes are nested within properties per StyleX's recommendation, which
 * is also how Astryx authors them.
 */
const styles = stylex.create({
	base: {
		// Kept as a public themeable var (documented in Button.doc.mjs) even though
		// it now defaults to the shared token: removing it would break any theme
		// setting it, for no gain. It overrides the shared offset, so a theme can
		// still tune the ring distance on buttons specifically.
		'--button-focus-offset': focusVars['--focus-outline-offset'],
		outlineOffset: {
			default: '0',
			':focus-visible': 'var(--button-focus-offset)'
		},
		position: 'relative',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacingVars['--spacing-2'],
		paddingBlock: spacingVars['--spacing-2'],
		paddingInline: spacingVars['--spacing-3'],
		borderWidth: 0,
		borderStyle: 'none',
		borderRadius: `var(--_button-radius, ${radiusVars['--radius-element']})`,
		fontFamily: 'inherit',
		fontSize: typeScaleVars['--text-label-size'],
		lineHeight: typeScaleVars['--text-label-leading'],
		fontWeight: fontWeightVars['--font-weight-medium'],
		whiteSpace: 'nowrap',
		cursor: 'pointer',
		transitionProperty: 'background-image, background-color, color, opacity, transform',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard']
	},
	pressable: {
		transform: {
			default: 'scale(1)',
			':active': 'scale(0.98)'
		}
	},
	disabled: {
		cursor: 'not-allowed',
		opacity: 0.5,
		backgroundImage: 'none',
		transform: {
			default: 'none',
			':active': 'none'
		}
	},
	ariaDisabled: {
		backgroundImage: {
			default: 'none',
			':hover': {
				'@media (hover: hover)': 'none'
			},
			':active': 'none'
		}
	},
	iconOnly: {
		'--button-icon-only-aspect': '1 / 1',
		aspectRatio: 'var(--button-icon-only-aspect)',
		paddingInline: 0,
		paddingBlock: 0
	},
	endContentWrapper: {
		display: 'inline-flex',
		alignItems: 'center',
		color: 'inherit'
	},
	iconWrapper: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0
	},
	contentWrapper: {
		display: 'contents'
	},
	labelText: {
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		minWidth: 0
	},
	link: {
		textDecoration: 'none'
	}
});

/**
 * Resting elevation, new in 0.1.9. Suppressed inside a `ButtonGroup`, which
 * carries the shadow for the whole group instead — see `buttonAttrs`.
 */
const elevationStyles = stylex.create({
	none: { boxShadow: 'none' },
	low: { boxShadow: shadowVars['--shadow-low'] },
	med: { boxShadow: shadowVars['--shadow-med'] },
	high: { boxShadow: shadowVars['--shadow-high'] }
});

// Consumer-controlled width. StyleX treats numbers as pixels; strings such as
// '100%' pass through unchanged.
const dynamicStyles = stylex.create({
	width: (width: string | number | null) => ({ width })
});

const sizeStyles = stylex.create({
	sm: { height: sizeVars['--size-element-sm'] },
	md: { height: sizeVars['--size-element-md'] },
	lg: { height: sizeVars['--size-element-lg'] }
});

/** Icon sizing per button size — matches Icon: sm/md = 16px, lg = 20px.
 *  fontSize is set so emoji and text-based icons scale correctly. */
const iconSizeStyles = stylex.create({
	sm: { width: 16, height: 16, fontSize: 16 },
	md: { width: 16, height: 16, fontSize: 16 },
	lg: { width: 20, height: 20, fontSize: 20 }
});

/**
 * Variant styles. The hover/pressed overlay is a stacked linear-gradient on top
 * of the base colour rather than a colour swap, so a single overlay token works
 * across every variant. The focus outline tracks the variant — destructive
 * focuses in its own negative colour.
 */
const hoverOverlay = {
	default: null,
	':hover': {
		'@media (hover: hover)': `linear-gradient(${colorVars['--color-overlay-hover']}, ${colorVars['--color-overlay-hover']})`
	},
	':active': `linear-gradient(${colorVars['--color-overlay-pressed']}, ${colorVars['--color-overlay-pressed']})`
} as const;

const variants = stylex.create({
	primary: {
		backgroundColor: colorVars['--color-accent'],
		color: colorVars['--color-on-accent'],
		backgroundImage: hoverOverlay
	},
	secondary: {
		backgroundColor: colorVars['--color-neutral'],
		color: colorVars['--color-text-primary'],
		backgroundImage: hoverOverlay
	},
	ghost: {
		backgroundColor: 'transparent',
		color: colorVars['--color-text-primary'],
		backgroundImage: hoverOverlay
	},
	destructive: {
		backgroundColor: colorVars['--color-error'],
		color: colorVars['--color-on-error'],
		// The ring matches the variant it rings: an accent-colored outline on a
		// red button reads as another control's focus. Only the color differs —
		// width, style and offset come from the shared outline.
		outlineColor: { default: null, ':focus-visible': colorVars['--color-error'] },
		backgroundImage: hoverOverlay
	}
});

const spinnerReveal = stylex.keyframes({
	from: { opacity: 0 },
	to: { opacity: 1 }
});

const contentHide = stylex.keyframes({
	from: { color: 'inherit' },
	to: { color: 'transparent' }
});

/**
 * Hold the loading swap briefly so a fast action that settles within the delay
 * never flashes a spinner. The spinner fade-in and the content hide share the
 * delay so the button never shows an empty frame between them. Reduced motion is
 * instant.
 */
const SPINNER_DELAY = durationVars['--duration-medium-min'];

const loadingStyles = stylex.create({
	// Hide the button's own content while the spinner overlay shows. Applied to
	// the content wrapper rather than the button so the button keeps its variant
	// foreground colour, which the spinner inherits via shade="inherit".
	hiddenContent: {
		color: 'transparent'
	},
	// Delayed variant: keep content visible, then hide it in lockstep with the
	// spinner reveal once the delay elapses.
	hiddenContentDelayed: {
		animationName: contentHide,
		animationDuration: '1ms',
		animationFillMode: 'forwards',
		animationDelay: {
			default: SPINNER_DELAY,
			'@media (prefers-reduced-motion: reduce)': '0s'
		}
	},
	spinnerOverlay: {
		position: 'absolute',
		top: 0,
		insetInlineStart: 0,
		insetInlineEnd: 0,
		bottom: 0,
		display: 'grid',
		placeItems: 'center'
	},
	spinnerDelayed: {
		animationName: spinnerReveal,
		animationDuration: durationVars['--duration-fast'],
		animationFillMode: 'backwards',
		animationDelay: {
			default: SPINNER_DELAY,
			'@media (prefers-reduced-motion: reduce)': '0s'
		}
	}
});

/**
 * "I am the last member of the group" — the trailing end cap.
 *
 * Not `:last-child`: several members render an invisible layer element after
 * their button (a tooltip'd Button renders button + layer; DropdownMenu renders
 * trigger + popover), so the layer would take the `:last-child` slot and the real
 * trailing button would keep square corners. Layers always carry the native
 * `popover` attribute and are never in-flow. Context layers also retain an inert
 * `<template>` marker so they can re-resolve their position. Neither element is a
 * group member, so "last member" means: no following element sibling besides
 * those two pieces of layer infrastructure.
 */
const IS_LAST_ITEM = ':not(:has(~ *:not([popover]):not(template)))';

const groupStyles = stylex.create({
	horizontal: {
		borderStartStartRadius: { default: 0, ':first-child': radiusVars['--radius-element'] },
		borderEndStartRadius: { default: 0, ':first-child': radiusVars['--radius-element'] },
		borderStartEndRadius: { default: 0, [IS_LAST_ITEM]: radiusVars['--radius-element'] },
		borderEndEndRadius: { default: 0, [IS_LAST_ITEM]: radiusVars['--radius-element'] },
		borderInlineStartWidth: { default: borderVars['--border-width'], ':first-child': 0 },
		borderInlineStartStyle: { default: 'solid', ':first-child': 'none' },
		borderInlineStartColor: colorVars['--color-border']
	},
	vertical: {
		borderStartStartRadius: { default: 0, ':first-child': radiusVars['--radius-element'] },
		borderStartEndRadius: { default: 0, ':first-child': radiusVars['--radius-element'] },
		borderEndStartRadius: { default: 0, [IS_LAST_ITEM]: radiusVars['--radius-element'] },
		borderEndEndRadius: { default: 0, [IS_LAST_ITEM]: radiusVars['--radius-element'] },
		borderBlockStartWidth: { default: borderVars['--border-width'], ':first-child': 0 },
		borderBlockStartStyle: { default: 'solid', ':first-child': 'none' },
		borderBlockStartColor: colorVars['--color-border']
	},
	// Between two solid-filled members the neutral border disappears into the
	// fill, so the divider switches to the on-accent colour to stay visible.
	onSolidHorizontal: {
		borderInlineStartColor: colorVars['--color-on-accent']
	},
	onSolidVertical: {
		borderBlockStartColor: colorVars['--color-on-accent']
	}
});

export interface ButtonRootStyleInput {
	variant: ButtonVariant;
	size: ButtonSize;
	isIconOnly: boolean;
	isDisabled: boolean;
	/**
	 * Whether the button is disabled via `aria-disabled` rather than the native
	 * attribute — the branch a `tooltip` takes, so a disabled button stays
	 * focusable and its tooltip stays reachable. It suppresses the hover and
	 * active background changes the native `:disabled` state would have.
	 */
	isAriaDisabled: boolean;
	isLink: boolean;
	width: string | number | undefined;
	group: ButtonGroupContextValue | null;
	/** Resting elevation. Ignored inside a group. */
	elevation: Elevation;
	xstyle?: StyleArg;
}

export function buttonRootAttrs(input: ButtonRootStyleInput): SvelteStyleAttrs {
	const {
		variant,
		size,
		isIconOnly,
		isDisabled,
		isAriaDisabled,
		isLink,
		width,
		group,
		elevation,
		xstyle
	} = input;
	const horizontal = group?.orientation === 'horizontal';

	return focusOutlineProps.focusVisible(
		styles.base,
		sizeStyles[size],
		isIconOnly && styles.iconOnly,
		isDisabled && styles.disabled,
		isAriaDisabled && styles.ariaDisabled,
		isLink && styles.link,
		!group && styles.pressable,
		group && (horizontal ? groupStyles.horizontal : groupStyles.vertical),
		group &&
			(variant === 'primary' || variant === 'destructive') &&
			(horizontal ? groupStyles.onSolidHorizontal : groupStyles.onSolidVertical),
		// Standalone floating buttons only — a grouped button's elevation is owned
		// by the ButtonGroup, so the shared surface lifts as one unit instead of
		// each segment casting its own shadow onto its neighbours.
		!group && elevationStyles[elevation],
		width != null && dynamicStyles.width(width),
		// AFTER the shared focus outline: the outline supplies width/style/offset
		// for every variant, and `destructive` re-colors just the ring to match
		// its own surface. Ordering is the mechanism — StyleX is last-wins.
		variants[variant as keyof typeof variants],
		xstyle
	);
}

export function buttonContentAttrs(isLoading: boolean, delaySpinner: boolean): SvelteStyleAttrs {
	return sx(
		styles.contentWrapper,
		isLoading && (delaySpinner ? loadingStyles.hiddenContentDelayed : loadingStyles.hiddenContent)
	);
}

export function buttonSpinnerOverlayAttrs(delaySpinner: boolean): SvelteStyleAttrs {
	return sx(loadingStyles.spinnerOverlay, delaySpinner && loadingStyles.spinnerDelayed);
}

export function buttonIconAttrs(size: ButtonSize): SvelteStyleAttrs {
	return sx(styles.iconWrapper, iconSizeStyles[size]);
}

export function buttonLabelAttrs(): SvelteStyleAttrs {
	return sx(styles.labelText);
}

export function buttonEndContentAttrs(): SvelteStyleAttrs {
	return sx(styles.endContentWrapper);
}
