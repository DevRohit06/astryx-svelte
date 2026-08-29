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
	colorVars,
	radiusVars,
	sizeVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';
import { focusOutlineStyles } from '../../utils/focus-outline.stylex.js';

/**
 * Ported from Astryx's `DateInput/DateInput.tsx`, where the styles are inline in
 * the component file rather than in a module of their own.
 *
 * The shape is `TimeInput`'s with two differences. `iconButton` replaces
 * `TimeInput`'s pair of `icon` (a plain flex box) and `clearButton` (a real
 * button) — here the leading calendar glyph *is* a button, so one style serves
 * both it and the trailing clear button, and it gains an `iconButtonDisabled`
 * variant `TimeInput` has no use for. And `sizeStyles`'s floor is `minWidth:
 * 180` rather than 120, because a `DATE_FORMAT_LONG` value ("January 15, 2026")
 * is wider than a formatted time.
 *
 * `input`, `inputDisabled` and `inputInvalid` are byte-identical to
 * `TimeInput`'s, `NumberInput`'s and `TextInput`'s — upstream restates them in
 * each file rather than sharing, and StyleX's content-derived hashes make every
 * copy compile to the same atomic classes. They are restated here for the same
 * reason: the oracle diffs this module against upstream's `DateInput` output.
 */

const styles = stylex.create({
	iconButton: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 0,
		margin: 0,
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		borderRadius: radiusVars['--radius-element']
	},
	iconButtonDisabled: {
		cursor: 'default'
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
	}
});

const sizeStyles = stylex.create({
	sm: {
		height: sizeVars['--size-element-sm'],
		minWidth: 180
	},
	md: {
		height: sizeVars['--size-element-md'],
		minWidth: 180
	},
	lg: {
		height: sizeVars['--size-element-lg'],
		minWidth: 180
	}
});

export type DateInputSize = keyof typeof sizeStyles;

/** The bordered surface: input chrome, popover anchor and tooltip anchor. */
export function dateInputWrapperAttrs(
	size: DateInputSize,
	statusType: InputStatusType | undefined,
	isEffectivelyDisabled: boolean,
	inGroup: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		inputWrapperStyles.base,
		sizeStyles[size],
		isEffectivelyDisabled && inputWrapperStyles.disabled,
		statusType && inputStatusBorderStyles[statusType],
		statusType && !isEffectivelyDisabled && inputStatusHoverShadowStyles[statusType],
		statusType && inputStatusFocusWithinStyles[statusType],
		inGroup && groupStyles.inGroup,
		xstyle
	);
}

/**
 * The calendar-toggle button and the clear button both. Upstream applies the
 * disabled variant to the toggle only — the clear button is not rendered at all
 * while the field is effectively disabled — which is why `isDisabled` defaults
 * to `false` here rather than being required.
 */
export function dateInputIconButtonAttrs(isDisabled = false): SvelteStyleAttrs {
	return sx(
		focusOutlineStyles.focusVisible,
		styles.iconButton,
		isDisabled && styles.iconButtonDisabled
	);
}

/**
 * The `<input role="combobox">`. `inputInvalid` comes last because it *replaces*
 * `input`'s colour rather than joining it — the order is load-bearing, and it is
 * the order upstream's compiled four-entry lookup table encodes.
 */
export function dateInputAttrs(isDisabled: boolean, isInvalid: boolean): SvelteStyleAttrs {
	return sx(styles.input, isDisabled && styles.inputDisabled, isInvalid && styles.inputInvalid);
}
