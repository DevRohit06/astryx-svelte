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
import { colorVars, sizeVars, typeScaleVars, typographyVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `TimeInput/TimeInput.tsx`, where the styles are inline in
 * the component file rather than in a module of their own.
 *
 * `input`, `inputDisabled` and `inputInvalid` are byte-identical to
 * `NumberInput`'s and `TextInput`'s — upstream restates them in each file
 * rather than sharing, and StyleX's content-derived hashes make every copy
 * compile to the same atomic classes. They are restated here for the same
 * reason: the oracle diffs this module against upstream's `TimeInput` output,
 * so a divergence has to surface against *its* counterpart, not a sibling's.
 *
 * There is no `clearButton`. 0.4.x (#4876) converged the whole input family on
 * the shared `InputClearButton`, which draws its ring from `focusOutlineStyles`
 * — this module's copy was one of the two that hand-drew a 1px `--color-accent`
 * ring nothing else in the system used.
 *
 * The one shape difference from `NumberInput` is that `sizeStyles` carries a
 * `minWidth` here — upstream sets `minWidth: 120` on all three sizes, so the
 * field never collapses narrower than a formatted `"12:30 PM"`.
 */

const styles = stylex.create({
	icon: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0
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
		cursor: 'not-allowed'
	},
	inputInvalid: {
		color: colorVars['--color-text-secondary']
	}
});

const sizeStyles = stylex.create({
	sm: {
		height: sizeVars['--size-element-sm'],
		minWidth: 120
	},
	md: {
		height: sizeVars['--size-element-md'],
		minWidth: 120
	},
	lg: {
		height: sizeVars['--size-element-lg'],
		minWidth: 120
	}
});

export type TimeInputSize = keyof typeof sizeStyles;

/** The bordered surface: input chrome, click-to-focus host and tooltip anchor. */
export function timeInputWrapperAttrs(
	size: TimeInputSize,
	statusType: InputStatusType | undefined,
	isDisabled: boolean,
	inGroup: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		inputWrapperStyles.base,
		sizeStyles[size],
		isDisabled && inputWrapperStyles.disabled,
		statusType && inputStatusBorderStyles[statusType],
		statusType && !isDisabled && inputStatusHoverShadowStyles[statusType],
		statusType && inputStatusFocusWithinStyles[statusType],
		inGroup && groupStyles.inGroup,
		xstyle
	);
}

/** The leading clock glyph's flex box. */
export function timeInputIconAttrs(): SvelteStyleAttrs {
	return sx(styles.icon);
}

/**
 * The `<input type="text">`. `inputInvalid` comes last because it *replaces*
 * `input`'s colour rather than joining it — the order is load-bearing, and it is
 * the order upstream's compiled four-entry lookup table encodes.
 */
export function timeInputAttrs(isDisabled: boolean, isInvalid: boolean): SvelteStyleAttrs {
	return sx(styles.input, isDisabled && styles.inputDisabled, isInvalid && styles.inputInvalid);
}
