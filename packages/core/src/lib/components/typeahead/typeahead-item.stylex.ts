import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	fontWeightVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `Typeahead/TypeaheadItem.tsx`, where the styles are
 * declared inline in the component file under the group name `styles`, so ours
 * needs no rename.
 */

const styles = stylex.create({
	container: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-2'],
		minHeight: 0
	},
	content: {
		display: 'flex',
		flexDirection: 'column',
		flex: 1,
		minWidth: 0
	},
	label: {
		fontSize: typeScaleVars['--text-label-size'],
		lineHeight: typeScaleVars['--text-label-leading'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		color: colorVars['--color-text-primary'],
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap'
	},
	description: {
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary'],
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap'
	},
	disabled: {
		opacity: 0.5
	}
});

/**
 * The row: icon slot beside the label/description column. `xstyle` is threaded
 * last, as everywhere else — upstream declares it on `TypeaheadItemProps` (via
 * `BaseProps`) and then drops it, the same contradiction `HoverCard` records.
 */
export function typeaheadItemContainerAttrs(
	isDisabled: boolean,
	xstyle?: StyleArg
): SvelteStyleAttrs {
	return sx(styles.container, isDisabled && styles.disabled, xstyle);
}

/** The label/description column. */
export function typeaheadItemContentAttrs(): SvelteStyleAttrs {
	return sx(styles.content);
}

/** The primary line. */
export function typeaheadItemLabelAttrs(): SvelteStyleAttrs {
	return sx(styles.label);
}

/** The secondary line. */
export function typeaheadItemDescriptionAttrs(): SvelteStyleAttrs {
	return sx(styles.description);
}
