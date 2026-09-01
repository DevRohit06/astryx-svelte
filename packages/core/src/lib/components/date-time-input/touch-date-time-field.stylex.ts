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
import { rtlStyles } from '../../utils/rtl.stylex.js';
import { dateInputTouchGeometry, dateInputTouchSizes } from '../date-input/tokens.stylex.js';
import type { DateTimeInputSize } from './date-time-input.stylex.js';

/**
 * Ported from Astryx's `DateTimeInput/TouchDateTimeField.tsx`, where the styles
 * are inline in the component file rather than in a module of their own.
 *
 * `iconButton`, `iconButtonDisabled`, `input` and `inputDisabled` are upstream's
 * own restatements of the pointer field's — it declares them again in
 * `TouchDateTimeField.tsx` rather than importing them — and are restated here
 * for the same reason every other surface in this family restates its
 * neighbour's: StyleX's content-derived hashes make every copy compile to the
 * same atomic classes, and the oracle diffs this module against upstream's
 * `TouchDateTimeField` output.
 *
 * The sheet's geometry is `DateInput`'s: the panes are the same height and the
 * wheels the same rows, so both pickers rest on `date-input/tokens.stylex.ts`.
 */

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

// Two 196px segments plus the 8px gap fit at exactly 400px. Below that, flex
// wrapping moves each growing segment onto its own full-width row.
const HORIZONTAL_SEGMENT_BASIS = 196;

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
	touchRow: {
		display: 'flex',
		flexWrap: 'wrap',
		inlineSize: '100%',
		minInlineSize: 0,
		gap: spacingVars['--spacing-2']
	},
	touchDateWrapper: {
		flex: 1,
		flexBasis: HORIZONTAL_SEGMENT_BASIS,
		minInlineSize: 0
	},
	touchTimeWrapper: {
		flex: 1,
		flexBasis: HORIZONTAL_SEGMENT_BASIS,
		minInlineSize: 0
	},
	touchInput: {
		caretColor: 'transparent',
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		userSelect: 'none'
	},
	touchSheetBody: {
		boxSizing: 'border-box',
		inlineSize: '100%',
		minInlineSize: 0,
		paddingInline: spacingVars['--spacing-4'],
		paddingBlockStart: spacingVars['--spacing-6'],
		paddingBlockEnd: spacingVars['--spacing-4']
	},
	touchSurface: {
		display: 'flex',
		flexDirection: 'column',
		inlineSize: '100%',
		minInlineSize: 0,
		gap: spacingVars['--spacing-3']
	},
	touchPanelStack: {
		display: 'grid',
		inlineSize: '100%',
		minInlineSize: 0
	},
	touchPanel: {
		gridArea: '1 / 1',
		display: 'flex',
		inlineSize: '100%',
		minInlineSize: 0,
		flexDirection: 'column',
		gap: spacingVars['--spacing-2']
	},
	touchPanelHidden: {
		visibility: 'hidden',
		opacity: 0,
		pointerEvents: 'none'
	},
	touchHeader: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		blockSize: sizeVars['--size-element-lg']
	},
	touchTitle: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		minInlineSize: 0,
		paddingInline: spacingVars['--spacing-2'],
		borderWidth: 0,
		borderStyle: 'none',
		borderRadius: radiusVars['--radius-element'],
		backgroundColor: 'transparent',
		color: colorVars['--color-text-primary'],
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-large-size'],
		fontWeight: fontWeightVars['--font-weight-semibold'],
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		}
	},
	touchTitleText: {
		minInlineSize: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap'
	},
	touchHeaderActions: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-0-5'],
		marginInlineStart: 'auto'
	},
	touchHeaderActionsHidden: {
		visibility: 'hidden',
		opacity: 0,
		pointerEvents: 'none'
	},
	touchArrow: {
		minBlockSize: {
			default: null,
			'@media (pointer: coarse)': dateInputTouchSizes.daySize
		},
		minInlineSize: {
			default: null,
			'@media (pointer: coarse)': dateInputTouchSizes.daySize
		}
	},
	touchArrowUnavailable: {
		visibility: 'hidden'
	},
	touchArrowIcon: {
		display: 'inline-flex'
	},
	touchResetButton: {
		minBlockSize: {
			default: null,
			'@media (pointer: coarse)': dateInputTouchSizes.daySize
		}
	},
	touchDateSurfaceStack: {
		display: 'grid',
		inlineSize: '100%',
		minInlineSize: 0
	},
	touchDateSurface: {
		gridArea: '1 / 1',
		display: 'flex',
		inlineSize: '100%',
		minInlineSize: 0,
		flexDirection: 'column',
		gap: spacingVars['--spacing-2']
	},
	touchDateSurfaceHidden: {
		visibility: 'hidden',
		opacity: 0,
		pointerEvents: 'none'
	},
	touchWeekdays: {
		display: 'grid',
		gridTemplateColumns: 'repeat(7, 1fr)',
		blockSize: sizeVars['--size-element-sm'],
		alignItems: 'center'
	},
	touchWeekday: {
		textAlign: 'center',
		fontSize: typeScaleVars['--text-supporting-size'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		color: colorVars['--color-text-secondary']
	},
	touchWheelSpacer: {
		blockSize: sizeVars['--size-element-sm']
	},
	touchTimeWheels: {
		display: 'flex',
		inlineSize: '100%',
		minInlineSize: 0,
		blockSize: dateInputTouchGeometry.paneBlockSize,
		gap: spacingVars['--spacing-2']
	},
	touchFooter: {
		display: 'flex',
		marginBlockStart: 'auto',
		paddingBlockStart: spacingVars['--spacing-1']
	}
});

/** The flex row holding both closed segments. Takes the `xstyle`, as upstream. */
export function touchDateTimeRowAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.touchRow, xstyle);
}

/** The date segment's bordered surface. */
export function touchDateTimeDateWrapperAttrs(
	size: DateTimeInputSize,
	statusType: InputStatusType | undefined,
	isEffectivelyDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		inputWrapperStyles.base,
		sizeStyles[size],
		styles.touchDateWrapper,
		isEffectivelyDisabled && inputWrapperStyles.disabled,
		statusType && inputStatusBorderStyles[statusType],
		statusType && !isEffectivelyDisabled && inputStatusHoverShadowStyles[statusType],
		statusType && inputStatusFocusWithinStyles[statusType]
	);
}

/** The time segment's bordered surface. */
export function touchDateTimeTimeWrapperAttrs(
	size: DateTimeInputSize,
	statusType: InputStatusType | undefined,
	isEffectivelyDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		inputWrapperStyles.base,
		sizeStyles[size],
		styles.touchTimeWrapper,
		isEffectivelyDisabled && inputWrapperStyles.disabled,
		statusType && inputStatusBorderStyles[statusType],
		statusType && !isEffectivelyDisabled && inputStatusHoverShadowStyles[statusType],
		statusType && inputStatusFocusWithinStyles[statusType]
	);
}

/** Each segment's leading glyph button — the calendar one and the clock one. */
export function touchDateTimeIconButtonAttrs(isDisabled: boolean): SvelteStyleAttrs {
	return sx(
		focusOutlineStyles.focusVisible,
		styles.iconButton,
		isDisabled && styles.iconButtonDisabled
	);
}

/**
 * Either closed `<input>`. Both pass the same three keys in the same order, so
 * upstream emits one two-entry table rather than two — `touchInput` narrows
 * `cursor`, which `inputDisabled` then narrows again, so the disabled arm
 * *replaces* the pointer cursor rather than joining it.
 */
export function touchDateTimeInputAttrs(isDisabled: boolean): SvelteStyleAttrs {
	return sx(styles.input, styles.touchInput, isDisabled && styles.inputDisabled);
}

/** The sheet's padded content box. */
export function touchDateTimeSheetBodyAttrs(): SvelteStyleAttrs {
	return sx(styles.touchSheetBody);
}

/** The whole picker inside the sheet: the tab switch above the panel stack. */
export function touchDateTimeSurfaceAttrs(): SvelteStyleAttrs {
	return sx(styles.touchSurface);
}

/** The single grid cell the Date and Time panels share. */
export function touchDateTimePanelStackAttrs(): SvelteStyleAttrs {
	return sx(styles.touchPanelStack);
}

/** One of the two panels, hidden without losing its layout box. */
export function touchDateTimePanelAttrs(isHidden: boolean): SvelteStyleAttrs {
	return sx(styles.touchPanel, isHidden && styles.touchPanelHidden);
}

/** The Date panel's header row: the month/year title plus its trailing actions. */
export function touchDateTimeHeaderAttrs(): SvelteStyleAttrs {
	return sx(styles.touchHeader);
}

/** The header title, which swaps the calendar for the month and year wheels. */
export function touchDateTimeTitleAttrs(): SvelteStyleAttrs {
	return sx(styles.touchTitle, focusOutlineStyles.focusVisible);
}

/** The title's month-and-year text, ellipsised rather than wrapped. */
export function touchDateTimeTitleTextAttrs(): SvelteStyleAttrs {
	return sx(styles.touchTitleText);
}

/** The trailing arrows-and-Reset cluster, gone while the wheels are up. */
export function touchDateTimeHeaderActionsAttrs(isHidden: boolean): SvelteStyleAttrs {
	return sx(styles.touchHeaderActions, isHidden && styles.touchHeaderActionsHidden);
}

/** `xstyle` for one month arrow: a touch-target floor, and hidden at a bound. */
export function touchDateTimeArrowXstyle(canStep: boolean): StyleArg[] {
	return [styles.touchArrow, !canStep && styles.touchArrowUnavailable];
}

/** The arrow glyph's box, mirrored under RTL along with the panes. */
export function touchDateTimeArrowIconAttrs(): SvelteStyleAttrs {
	return sx(styles.touchArrowIcon, rtlStyles.mirror);
}

/** `xstyle` for the header's Reset button — the same touch-target floor. */
export function touchDateTimeResetButtonXstyle(): StyleArg {
	return styles.touchResetButton;
}

/** The single grid cell the calendar and the month/year wheels share. */
export function touchDateTimeDateSurfaceStackAttrs(): SvelteStyleAttrs {
	return sx(styles.touchDateSurfaceStack);
}

/** Either date surface, hidden without losing its layout box. */
export function touchDateTimeDateSurfaceAttrs(isHidden: boolean): SvelteStyleAttrs {
	return sx(styles.touchDateSurface, isHidden && styles.touchDateSurfaceHidden);
}

/** The weekday header row above the month scroller. */
export function touchDateTimeWeekdaysAttrs(): SvelteStyleAttrs {
	return sx(styles.touchWeekdays);
}

/** One weekday cell. */
export function touchDateTimeWeekdayAttrs(): SvelteStyleAttrs {
	return sx(styles.touchWeekday);
}

/** Stands in for the weekday row on the wheels, so the surfaces are equal height. */
export function touchDateTimeWheelSpacerAttrs(): SvelteStyleAttrs {
	return sx(styles.touchWheelSpacer);
}

/** The time panel's row of wheels, one month pane tall. */
export function touchDateTimeTimeWheelsAttrs(): SvelteStyleAttrs {
	return sx(styles.touchTimeWheels);
}

/** The footer that holds each surface's full-width action. */
export function touchDateTimeFooterAttrs(): SvelteStyleAttrs {
	return sx(styles.touchFooter);
}
