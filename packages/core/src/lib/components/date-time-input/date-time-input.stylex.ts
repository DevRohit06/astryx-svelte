import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	inputStatusBorderStyles,
	inputStatusFocusWithinStyles,
	inputStatusHoverShadowStyles,
	inputWrapperStyles
} from '../field/input-styles.stylex.js';
import type { InputStatusType } from '../field/types.js';
import {
	colorVars,
	fontWeightVars,
	radiusVars,
	sizeVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';
import { focusOutlineStyles } from '../../utils/focus-outline.stylex.js';

/**
 * Ported from Astryx's `DateTimeInput/DateTimeInput.tsx`, where the styles are
 * inline in the component file rather than in a module of their own.
 *
 * This is the one member of the date/time family with **two** bordered surfaces
 * under a single label — a date field and a time field side by side in a flex
 * `row` — which is why `dateWrapper`/`timeWrapper` exist and why the row itself
 * takes the `xstyle`. There is no `groupStyles.inGroup` composition: like
 * `DateRangeInput`, this component never reads the `InputGroup` context.
 *
 * `dateWrapper` and `timeWrapper` are byte-identical declarations and so
 * compile to the same classes. Upstream declares both anyway, and so does this
 * port: `dist/` carries both keys, and collapsing them to one would leave the
 * other unaccounted for in object mode.
 */

// Two 196px segments plus the 8px gap fit at exactly 400px. Below that,
// flex wrapping moves each growing segment onto its own full-width row.
const HORIZONTAL_SEGMENT_BASIS = 196;

const styles = stylex.create({
	row: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: spacingVars['--spacing-2']
	},
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
		cursor: 'default'
	},
	inputInvalid: {
		color: colorVars['--color-text-secondary']
	},
	dateWrapper: {
		flex: 1,
		flexBasis: HORIZONTAL_SEGMENT_BASIS,
		minWidth: 0
	},
	timeWrapper: {
		flex: 1,
		flexBasis: HORIZONTAL_SEGMENT_BASIS,
		minWidth: 0
	},
	// Preset-time list. Paddings and states mirror BaseTypeahead's dropdown and
	// Selector's options so every list in the system reads the same.
	timeListbox: {
		boxSizing: 'border-box',
		maxHeight: 300,
		overflowY: 'auto',
		padding: spacingVars['--spacing-1'],
		minWidth: 'anchor-size(width)'
	},
	timeOption: {
		boxSizing: 'border-box',
		display: 'flex',
		alignItems: 'center',
		width: '100%',
		paddingBlock: spacingVars['--spacing-1-5'],
		paddingInline: spacingVars['--spacing-2'],
		borderRadius: radiusVars['--radius-element'],
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		textAlign: 'start',
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-body-size'],
		lineHeight: typeScaleVars['--text-body-leading'],
		color: colorVars['--color-text-primary'],
		backgroundColor: 'transparent'
	},
	timeOptionHighlighted: {
		backgroundColor: colorVars['--color-overlay-hover']
	},
	timeOptionSelected: {
		fontWeight: fontWeightVars['--font-weight-medium']
	}
});

/**
 * Size-specific padding for the preset-time options, so an `sm` field gets a
 * compact list. Matches DropdownMenuItem / Selector / BaseTypeahead.
 */
const timeOptionSizeStyles = stylex.create({
	sm: {
		paddingBlock: spacingVars['--spacing-1'],
		paddingInline: spacingVars['--spacing-2']
	},
	md: {
		paddingBlock: spacingVars['--spacing-1-5']
	},
	lg: {
		paddingBlock: spacingVars['--spacing-2']
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

/**
 * Upstream declares this as a literal `'sm' | 'md' | 'lg'` rather than deriving
 * it from the size keys. Transcribed as-is — the declaration site is the
 * published contract.
 */
export type DateTimeInputSize = 'sm' | 'md' | 'lg';

/** The flex row holding both fields. Takes the `xstyle`, as upstream. */
export function dateTimeInputRowAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.row, xstyle);
}

/** The date field's bordered surface: popover anchor and combobox host. */
export function dateTimeInputDateWrapperAttrs(
	size: DateTimeInputSize,
	statusType: InputStatusType | undefined,
	isEffectivelyDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		inputWrapperStyles.base,
		sizeStyles[size],
		styles.dateWrapper,
		isEffectivelyDisabled && inputWrapperStyles.disabled,
		statusType && inputStatusBorderStyles[statusType],
		statusType && !isEffectivelyDisabled && inputStatusHoverShadowStyles[statusType],
		statusType && inputStatusFocusWithinStyles[statusType]
	);
}

/** The time field's bordered surface, click-to-focus host for its input. */
export function dateTimeInputTimeWrapperAttrs(
	size: DateTimeInputSize,
	statusType: InputStatusType | undefined,
	isEffectivelyDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		inputWrapperStyles.base,
		sizeStyles[size],
		styles.timeWrapper,
		isEffectivelyDisabled && inputWrapperStyles.disabled,
		statusType && inputStatusBorderStyles[statusType],
		statusType && !isEffectivelyDisabled && inputStatusHoverShadowStyles[statusType],
		statusType && inputStatusFocusWithinStyles[statusType]
	);
}

/**
 * The calendar-toggle button and the clear button both. The disabled variant is
 * only ever applied to the toggle — the clear button is not rendered while the
 * field is effectively disabled.
 */
export function dateTimeInputIconButtonAttrs(isDisabled = false): SvelteStyleAttrs {
	return sx(
		focusOutlineStyles.focusVisible,
		styles.iconButton,
		isDisabled && styles.iconButtonDisabled
	);
}

/** The leading clock glyph's flex box in the time field. */
export function dateTimeInputIconAttrs(): SvelteStyleAttrs {
	return sx(styles.icon);
}

/**
 * Either `<input>`. `inputInvalid` comes last because it *replaces* `input`'s
 * colour rather than joining it — the order is load-bearing, and it is the order
 * upstream's compiled four-entry lookup table encodes. Both fields share the
 * table, which is why upstream emits four strings and not eight.
 */
export function dateTimeInputAttrs(isDisabled: boolean, isInvalid: boolean): SvelteStyleAttrs {
	return sx(styles.input, isDisabled && styles.inputDisabled, isInvalid && styles.inputInvalid);
}

/**
 * The preset-time dropdown's scroll container. Sized from the anchor with
 * `anchor-size(width)`, so the list is as wide as the time field it drops from.
 */
export function dateTimeInputTimeListboxAttrs(): SvelteStyleAttrs {
	return sx(styles.timeListbox);
}

/**
 * One preset-time row. `timeOptionSizeStyles[size]` follows `timeOption` so the
 * size-specific padding replaces the base padding rather than joining it, and
 * the highlight/selected pair come last — the order upstream's `stylex.props`
 * call uses.
 */
export function dateTimeInputTimeOptionAttrs(
	size: DateTimeInputSize,
	isHighlighted: boolean,
	isSelected: boolean
): SvelteStyleAttrs {
	return sx(
		styles.timeOption,
		timeOptionSizeStyles[size],
		isHighlighted && styles.timeOptionHighlighted,
		isSelected && styles.timeOptionSelected
	);
}
