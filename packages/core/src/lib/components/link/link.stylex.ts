import * as stylex from '@stylexjs/stylex';
import type { StyleArg, SvelteStyleAttrs } from '../../internal/sx.js';
import { focusOutlineProps } from '../../utils/focus-outline.stylex.js';
import type { TextColor } from '../text/text.stylex.js';
import {
	colorVars,
	durationVars,
	easeVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `Link/Link.tsx`.
 *
 * The link's own chrome — inline-flex layout, the hover underline, the
 * focus-visible ring — kept separate from `Text`, which owns the typography.
 * `buttonReset` strips the native `<button>` look on the button-fallback branch
 * only; `linkColorStyles` is the per-colour text/hover pair.
 */

const styles = stylex.create({
	base: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-0-5'],
		fontFamily: 'inherit',
		fontSize: 'inherit',
		lineHeight: 'inherit',
		fontWeight: 'inherit',
		textDecoration: {
			default: 'none',
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': 'underline'
			}
		},
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		transitionProperty: 'color, text-decoration',
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard']
	},
	buttonReset: {
		backgroundColor: 'transparent',
		borderStyle: 'none',
		padding: 0,
		pointerEvents: 'auto',
		position: 'relative'
	},
	hasUnderline: {
		textDecoration: 'underline'
	},
	disabled: {
		cursor: 'default',
		opacity: 0.5,
		pointerEvents: 'none'
	},
	standalone: {
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading']
	}
});

const linkColorStyles = stylex.create({
	primary: {
		color: {
			default: colorVars['--color-text-primary'],
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': `color-mix(in srgb, ${colorVars['--color-text-primary']}, ${colorVars['--color-tint-hover']} 15%)`
			}
		}
	},
	secondary: {
		color: {
			default: colorVars['--color-text-secondary'],
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': `color-mix(in srgb, ${colorVars['--color-text-secondary']}, ${colorVars['--color-tint-hover']} 15%)`
			}
		}
	},
	disabled: {
		color: colorVars['--color-text-disabled']
	},
	placeholder: {
		color: colorVars['--color-text-secondary']
	},
	accent: {
		color: {
			default: colorVars['--color-text-accent'],
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': `color-mix(in srgb, ${colorVars['--color-text-accent']}, ${colorVars['--color-tint-hover']} 15%)`
			}
		}
	},
	inherit: {
		color: 'inherit'
	}
});

/** Options that pick which of the style groups apply to a given branch. */
export interface LinkStyleOptions {
	/** The button-fallback branch, which adds `buttonReset`. */
	isButton: boolean;
	hasUnderline: boolean;
	isStandalone: boolean;
	/** Adds the disabled dim. Always true on the disabled-anchor branch. */
	isDisabled: boolean;
}

/**
 * The link root, for whichever of the three branches (`<button>`, disabled
 * `<a>`, or the polymorphic component) is chosen. The relative order matches
 * upstream's `stylex.props` in each branch — `buttonReset` and `disabled` simply
 * drop out where that branch omits them.
 */
export function linkAttrs(
	color: TextColor,
	{ isButton, hasUnderline, isStandalone, isDisabled }: LinkStyleOptions,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return focusOutlineProps.focusVisible(
		styles.base,
		isButton && styles.buttonReset,
		linkColorStyles[color],
		hasUnderline && styles.hasUnderline,
		isStandalone && styles.standalone,
		isDisabled && styles.disabled,
		xstyle
	);
}
