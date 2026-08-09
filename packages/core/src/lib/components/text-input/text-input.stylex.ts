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
 * Ported from Astryx's `TextInput/TextInput.tsx`.
 *
 * Like `TextArea`, the wrapper builds on `Field`'s shared `inputWrapperStyles`
 * rather than restating the border/focus/hover chrome. The `<input>` itself,
 * its disabled cursor, the inline clear button and the size heights are the
 * only styles local to this component; when the field sits inside an
 * `InputGroup`, `groupStyles.inGroup` collapses the shared border.
 */

const styles = stylex.create({
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

export type TextInputSize = keyof typeof sizeStyles;

/** The bordered surface: input chrome, click-to-focus host and tooltip anchor. */
export function textInputWrapperAttrs(
	size: TextInputSize,
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

/** The `<input>` itself. */
export function textInputAttrs(isDisabled: boolean): SvelteStyleAttrs {
	return sx(styles.input, isDisabled && styles.inputDisabled);
}

/** The inline clear button (not the shared `InputClearButton` — see the component). */
export function textInputClearButtonAttrs(): SvelteStyleAttrs {
	return sx(styles.clearButton);
}
