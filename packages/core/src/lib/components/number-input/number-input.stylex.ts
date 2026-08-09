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
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `NumberInput/NumberInput.tsx`, where the styles are
 * inline in the component file rather than in a module of their own.
 *
 * `input`, `inputDisabled` and `clearButton` are byte-identical to `TextInput`'s
 * — upstream restates them rather than sharing, and StyleX's content-derived
 * hashes make both copies compile to the same atomic classes. They are restated
 * here for the same reason: the oracle diffs this module against upstream's
 * `NumberInput` output, not `TextInput`'s.
 *
 * `styles.wrapper`'s `zIndex: 1` duplicates `inputWrapperStyles.base`'s and so
 * emits no class of its own — but upstream's `dist/` declares `styles` as an
 * object containing exactly `wrapper`, so dropping it would fail object mode.
 */

const styles = stylex.create({
	wrapper: {
		zIndex: 1
	},
	clearButton: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 0,
		margin: 0,
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		cursor: 'pointer',
		borderRadius: radiusVars['--radius-element'],
		outline: {
			default: 'none',
			':focus-visible': `${borderVars['--border-width']} solid ${colorVars['--color-accent']}`
		},
		outlineOffset: 1
	},
	input: {
		display: 'block',
		flex: 1,
		minWidth: 0,
		borderWidth: 0,
		borderStyle: 'none',
		padding: 0,
		// Hide the browser's native number spinners; the component provides its own
		// affordances (keyboard entry, optional clear button) and the spinners
		// clash with the input's visual treatment and sizing.
		MozAppearance: 'textfield',
		'::-webkit-inner-spin-button': {
			WebkitAppearance: 'none',
			margin: 0
		},
		'::-webkit-outer-spin-button': {
			WebkitAppearance: 'none',
			margin: 0
		},
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
		cursor: 'not-allowed'
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
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		inputWrapperStyles.base,
		styles.wrapper,
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
 * The `<input type="number">`. `inputInvalid` comes last because it *replaces*
 * `input`'s colour rather than joining it — the order is load-bearing.
 */
export function numberInputAttrs(isDisabled: boolean, isInvalid: boolean): SvelteStyleAttrs {
	return sx(styles.input, isDisabled && styles.inputDisabled, isInvalid && styles.inputInvalid);
}

/** The trailing units text. */
export function numberInputUnitsAttrs(): SvelteStyleAttrs {
	return sx(styles.units);
}

/** The inline clear button (hand-rolled upstream, not `Field`'s `InputClearButton`). */
export function numberInputClearButtonAttrs(): SvelteStyleAttrs {
	return sx(styles.clearButton);
}
