import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	inputStatusBorderStyles,
	inputStatusFocusWithinStyles,
	inputStatusHoverShadowStyles,
	inputWrapperStyles
} from '../field/input-styles.stylex.js';
import type { InputStatusType } from '../field/types.js';
import { groupStyles } from '../input-group/group-styles.stylex.js';
import {
	borderVars,
	colorVars,
	radiusVars,
	sizeVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `NumberInput/NumberInput.tsx`, where the styles are
 * inline in the component file rather than in a module of their own.
 *
 * `input` and `inputDisabled` are byte-identical to `TextInput`'s — upstream
 * restates them rather than sharing, and StyleX's content-derived hashes make
 * both copies compile to the same atomic classes. They are restated here for the
 * same reason: the oracle diffs this module against upstream's `NumberInput`
 * output, not `TextInput`'s.
 *
 * At 0.4.1 (#4896) the control became a **text-backed spinbutton**, so the
 * native-spinner suppression (`MozAppearance: 'textfield'` and the two
 * `::-webkit-*-spin-button` blocks) is gone from upstream's `input` — there is no
 * `type="number"` left to grow spinners. The component draws its own steppers
 * instead, which is what the six keys from `numberSteppers` down are for.
 *
 * `styles.wrapper`'s `zIndex: 1` duplicates `inputWrapperStyles.base`'s and so
 * emits no class of its own — but upstream's `dist/` declares `styles` as an
 * object containing `wrapper`, `wrapperWithNumberSteppers` and `incrementIcon`,
 * so dropping it would fail object mode.
 */

const styles = stylex.create({
	wrapper: {
		zIndex: 1
	},
	wrapperWithNumberSteppers: {
		paddingInlineEnd: 0
	},
	input: {
		display: 'block',
		flex: 1,
		minWidth: 0,
		borderWidth: 0,
		borderStyle: 'none',
		padding: 0,
		fontFamily: typographyVars['--font-family-body'],
		fontSize: {
			default: typeScaleVars['--text-body-size'],
			// A coarse pointer means a touch device, where a sub-16px font makes
			// mobile Safari zoom the viewport on focus.
			'@media (pointer: coarse)': `max(1rem, ${typeScaleVars['--text-body-size']})`
		},
		lineHeight: typeScaleVars['--text-body-leading'],
		color: colorVars['--color-text-primary'],
		backgroundColor: 'transparent',
		outline: 'none',
		'::placeholder': {
			color: colorVars['--color-text-secondary']
		}
	},
	inputDisabled: {
		cursor: 'default'
	},
	inputInvalid: {
		color: colorVars['--color-text-secondary']
	},
	units: {
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading'],
		color: colorVars['--color-text-secondary'],
		flexShrink: 0
	},
	numberSteppers: {
		alignSelf: 'stretch',
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 0,
		width: spacingVars['--spacing-4'],
		marginBlock: `calc(-1 * ${spacingVars['--spacing-1']})`,
		borderInlineStartWidth: borderVars['--border-width'],
		borderInlineStartStyle: 'solid',
		borderInlineStartColor: colorVars['--color-border-emphasized'],
		overflow: 'hidden',
		borderStartEndRadius: radiusVars['--radius-element'],
		borderEndEndRadius: radiusVars['--radius-element']
	},
	numberStepperButton: {
		boxSizing: 'border-box',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		flex: 1,
		minHeight: 0,
		padding: 0,
		margin: 0,
		borderWidth: 0,
		borderStyle: 'none',
		color: colorVars['--color-icon-secondary'],
		backgroundColor: colorVars['--color-background-surface'],
		backgroundImage: {
			default: null,
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': `linear-gradient(${colorVars['--color-overlay-hover']}, ${colorVars['--color-overlay-hover']})`
			},
			':active': `linear-gradient(${colorVars['--color-overlay-pressed']}, ${colorVars['--color-overlay-pressed']})`
		},
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		// The steppers are `tabIndex={-1}` and hand focus to the input, so they
		// take no focus ring of their own — deliberately *not* `focusOutlineProps`.
		outline: 'none'
	},
	numberStepperButtonDisabled: {
		color: colorVars['--color-icon-disabled'],
		cursor: 'default',
		backgroundImage: 'none'
	},
	decrementButton: {
		borderBlockStartWidth: borderVars['--border-width'],
		borderBlockStartStyle: 'solid',
		borderBlockStartColor: colorVars['--color-border-emphasized']
	},
	incrementIcon: {
		transform: 'rotate(180deg)'
	}
});

const sizeStyles = stylex.create({
	sm: {
		height: sizeVars['--size-element-sm']
	},
	md: {
		height: sizeVars['--size-element-md']
	},
	lg: {
		height: sizeVars['--size-element-lg']
	}
});

export type NumberInputSize = keyof typeof sizeStyles;

/** The bordered surface: input chrome, click-to-focus host and tooltip anchor. */
export function numberInputWrapperAttrs(
	size: NumberInputSize,
	statusType: InputStatusType | undefined,
	isDisabled: boolean,
	inGroup: boolean,
	hasNumberSteppers: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		inputWrapperStyles.base,
		styles.wrapper,
		hasNumberSteppers && styles.wrapperWithNumberSteppers,
		sizeStyles[size],
		isDisabled && inputWrapperStyles.disabled,
		statusType && inputStatusBorderStyles[statusType],
		statusType && !isDisabled && inputStatusHoverShadowStyles[statusType],
		statusType && inputStatusFocusWithinStyles[statusType],
		inGroup && groupStyles.inGroup,
		xstyle
	);
}

/**
 * The `<input type="text" role="spinbutton">`. `inputInvalid` comes last because
 * it *replaces* `input`'s colour rather than joining it — the order is
 * load-bearing.
 */
export function numberInputAttrs(isDisabled: boolean, isInvalid: boolean): SvelteStyleAttrs {
	return sx(styles.input, isDisabled && styles.inputDisabled, isInvalid && styles.inputInvalid);
}

/** The trailing units text. */
export function numberInputUnitsAttrs(): SvelteStyleAttrs {
	return sx(styles.units);
}

/** The column holding the increment and decrement buttons. */
export function numberInputSteppersAttrs(): SvelteStyleAttrs {
	return sx(styles.numberSteppers);
}

/**
 * One stepper button. `isDecrement` adds the divider between the two, and
 * `isStepperDisabled` folds in the dimmed, no-hover-gradient treatment — both
 * after the base, as upstream's two `stylex.props` calls order them.
 */
export function numberInputStepperButtonAttrs(
	isDecrement: boolean,
	isStepperDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		styles.numberStepperButton,
		isDecrement && styles.decrementButton,
		isStepperDisabled && styles.numberStepperButtonDisabled
	);
}

/** The 180° rotation that turns the shared `chevronDown` glyph into a chevron up. */
export const numberInputIncrementIconStyle = styles.incrementIcon;
