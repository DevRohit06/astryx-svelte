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
import { sizeVars, spacingVars } from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `Typeahead/Typeahead.tsx`, where the styles are declared
 * inline in the component file under the group names `styles`/`wrapperSizeStyles`,
 * so neither needs a rename.
 */

const styles = stylex.create({
	wrapper: {
		position: 'relative',
		flexWrap: 'wrap',
		gap: spacingVars['--spacing-1'],
		// Standard padding minus border width to prevent height jump
		// when a token (28px) is added inside the input
		paddingBlock: `calc(${spacingVars['--spacing-1']} - 1px)`,
		cursor: {
			default: 'text',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
	},
	token: {
		// Offset token so it sits 3px from the inner edge (4px from outer edge
		// accounting for 1px border). Default inline padding is 8px, so
		// -(8px - 3px) = -5px positions token equidistant from left edge as top.
		margin: `calc(-1 * (${spacingVars['--spacing-2']} - ${spacingVars['--spacing-1']} + 1px))`
	},
	clearButton: {
		position: 'absolute',
		top: `calc((${sizeVars['--size-element-md']} - 20px) / 2 - 1px)`,
		insetInlineEnd: `calc((${sizeVars['--size-element-md']} - 20px) / 2 - 1px)`,
		height: '20px'
	},
	clearButtonSm: {
		top: `calc((${sizeVars['--size-element-sm']} - 20px) / 2 - 1px)`,
		insetInlineEnd: `calc((${sizeVars['--size-element-sm']} - 20px) / 2 - 1px)`
	},
	inputHidden: {
		width: 0,
		minWidth: 0,
		flex: '0 0 0',
		padding: 0,
		opacity: 0,
		position: 'absolute' as const
	}
});

const wrapperSizeStyles = stylex.create({
	sm: { minHeight: sizeVars['--size-element-sm'] },
	md: { minHeight: sizeVars['--size-element-md'] },
	lg: { minHeight: sizeVars['--size-element-lg'] }
});

/** Published from `typeahead.svelte`, derived from the wrapper size keys. */
export type TypeaheadSize = keyof typeof wrapperSizeStyles;

/**
 * The bordered field surface: the token, the input and the clear button all sit
 * inside it, and it is the dropdown's anchor.
 *
 * `xstyle` reaches it only inside an `InputGroup` — outside one it goes to
 * `Field` instead, which is upstream's split.
 */
export function typeaheadWrapperAttrs(
	size: TypeaheadSize,
	statusType: InputStatusType | undefined,
	isDisabled: boolean,
	inGroup: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		inputWrapperStyles.base,
		styles.wrapper,
		wrapperSizeStyles[size],
		statusType && inputStatusBorderStyles[statusType],
		statusType && !isDisabled && inputStatusHoverShadowStyles[statusType],
		statusType && inputStatusFocusWithinStyles[statusType],
		isDisabled && inputWrapperStyles.disabled,
		inGroup && groupStyles.inGroup,
		inGroup && xstyle
	);
}

/** `xstyle` for the selected-value `Token`. */
export const typeaheadTokenStyle: StyleArg = styles.token;

/** `xstyle` for the `BaseTypeahead` input while a token is showing. */
export const typeaheadInputHiddenStyle: StyleArg = styles.inputHidden;

/** `xstyle` for the `InputClearButton`. */
export function typeaheadClearButtonStyle(isSm: boolean): StyleArg {
	return [styles.clearButton, isSm && styles.clearButtonSm];
}
