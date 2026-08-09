import * as stylex from '@stylexjs/stylex';
import {
	borderVars,
	colorVars,
	durationVars,
	easeVars,
	radiusVars,
	shadowVars,
	spacingVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `Field/inputStyles.stylex.ts`.
 *
 * The input wrapper's whole appearance — borders, focus ring, hover shadow,
 * disabled state and the three status variants — kept in one place so every
 * input component stays in sync. `TextInput`, `TextArea`, `NumberInput`,
 * `DateInput`, `TimeInput`, `Selector`, `Typeahead` and `Tokenizer` layer their
 * own padding and alignment on top through `sx()` composition.
 *
 * These are exported as raw style objects rather than behind an `attrs()`
 * function, which is the exception this file makes to the repo's convention and
 * upstream's own shape: they are *published API*, meant to be composed by a
 * consumer that adds its own overrides, so there is no single call site to wrap.
 */

/**
 * Base wrapper styles shared by all input components. Components apply these as
 * a foundation and override specific properties (padding, alignItems, gap) as
 * needed.
 */
export const inputWrapperStyles = stylex.create({
	base: {
		boxSizing: 'border-box',
		position: 'relative',
		zIndex: 1,
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		paddingBlock: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-2'],
		borderWidth: borderVars['--border-width'],
		borderStyle: 'solid',
		borderColor: {
			default: colorVars['--color-border-emphasized'],
			':focus-within': colorVars['--color-accent']
		},
		// Declared then consumed, so a component further in can retune the radius
		// without restating the shorthand — the same two-step `Card` uses.
		'--_field-radius': radiusVars['--radius-element'],
		borderRadius: 'var(--_field-radius)',
		backgroundColor: colorVars['--color-background-surface'],
		transitionProperty: 'border-color, box-shadow',
		transitionDuration: {
			default: durationVars['--duration-fast'],
			'@media (prefers-reduced-motion: reduce)': '0s'
		},
		transitionTimingFunction: easeVars['--ease-standard'],
		boxShadow: {
			default: 'none',
			':hover:not(:focus-within)': {
				'@media (hover: hover)': `inset 0px 0px 0px 2px color-mix(in srgb, ${colorVars['--color-border-emphasized']} 30%, transparent)`
			},
			':focus-within': `inset 0px 0px 0px 2px ${colorVars['--color-accent-muted']}`
		},
		outline: 'none'
	},
	disabled: {
		cursor: 'not-allowed',
		opacity: 0.5,
		borderColor: colorVars['--color-border-emphasized'],
		// Suppress the base hover ring — a disabled control must not react to hover.
		boxShadow: 'none'
	}
});

/** Status border colours for input wrappers. Keyed by `InputStatusType`. */
export const inputStatusBorderStyles = stylex.create({
	warning: {
		borderColor: colorVars['--color-warning']
	},
	error: {
		borderColor: colorVars['--color-error']
	},
	success: {
		borderColor: colorVars['--color-success']
	}
});

/** Status hover shadows for input wrappers. Keyed by `InputStatusType`. */
export const inputStatusHoverShadowStyles = stylex.create({
	warning: {
		boxShadow: {
			default: 'none',
			':hover:not(:focus-within)': {
				'@media (hover: hover)': shadowVars['--shadow-inset-warning']
			}
		}
	},
	error: {
		boxShadow: {
			default: 'none',
			':hover:not(:focus-within)': {
				'@media (hover: hover)': shadowVars['--shadow-inset-error']
			}
		}
	},
	success: {
		boxShadow: {
			default: 'none',
			':hover:not(:focus-within)': {
				'@media (hover: hover)': shadowVars['--shadow-inset-success']
			}
		}
	}
});

/**
 * Status border colours driven by `:focus-within`, for wrappers that contain a
 * child input or textarea. Keyed by `InputStatusType`.
 */
export const inputStatusFocusWithinStyles = stylex.create({
	warning: {
		borderColor: {
			default: colorVars['--color-warning'],
			':focus-within': colorVars['--color-warning']
		}
	},
	error: {
		borderColor: {
			default: colorVars['--color-error'],
			':focus-within': colorVars['--color-error']
		}
	},
	success: {
		borderColor: {
			default: colorVars['--color-success'],
			':focus-within': colorVars['--color-success']
		}
	}
});

/**
 * Status border colours driven by `:focus`, for components where the wrapper
 * itself takes focus (`Selector`'s button). Keyed by `InputStatusType`.
 */
export const inputStatusFocusStyles = stylex.create({
	warning: {
		borderColor: {
			default: colorVars['--color-warning'],
			':focus': colorVars['--color-warning']
		}
	},
	error: {
		borderColor: {
			default: colorVars['--color-error'],
			':focus': colorVars['--color-error']
		}
	},
	success: {
		borderColor: {
			default: colorVars['--color-success'],
			':focus': colorVars['--color-success']
		}
	}
});
