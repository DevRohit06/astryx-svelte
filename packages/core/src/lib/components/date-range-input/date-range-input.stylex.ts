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
	borderVars,
	colorVars,
	radiusVars,
	sizeVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';
import { focusOutlineStyles } from '../../utils/focus-outline.stylex.js';

/**
 * Ported from Astryx's `DateRangeInput/DateRangeInput.tsx`, where the styles are
 * inline in the component file rather than in a module of their own.
 *
 * Note there is **no** `groupStyles.inGroup` here, unlike `DateInput`/
 * `TimeInput`/`NumberInput`: `DateRangeInput` does not read the `InputGroup`
 * context at all upstream, so it has no in-group appearance to compose. That is
 * an upstream asymmetry, replicated rather than smoothed over.
 *
 * `trigger` is a `<button>` styled to read as an input — it restates the shared
 * input typography but adds `cursor: pointer`, `textAlign: start` and the
 * `nowrap`/`hidden`/`ellipsis` truncation trio, because a formatted range
 * ("Jan 5 – Feb 12") overflows a narrow field where a single date does not.
 */

const styles = stylex.create({
	trigger: {
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
		cursor: 'pointer',
		textAlign: 'start',
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis'
	},
	triggerPlaceholder: {
		color: colorVars['--color-text-secondary']
	},
	triggerDisabled: {
		cursor: 'not-allowed'
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
		cursor: 'pointer',
		borderRadius: radiusVars['--radius-element']
	},
	iconButtonDisabled: {
		cursor: 'not-allowed'
	},
	popoverLayout: {
		display: 'flex'
	},
	presetSidebar: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-1'],
		padding: spacingVars['--spacing-3'],
		borderInlineEndWidth: borderVars['--border-width'],
		borderInlineEndStyle: 'solid',
		borderInlineEndColor: colorVars['--color-border-emphasized'],
		minWidth: 140
	},
	presetButton: {
		display: 'block',
		width: '100%',
		padding: `${spacingVars['--spacing-1']} ${spacingVars['--spacing-2']}`,
		margin: 0,
		borderWidth: 0,
		borderStyle: 'none',
		borderRadius: radiusVars['--radius-element'],
		backgroundColor: {
			default: 'transparent',
			':hover': {
				'@media (hover: hover)': colorVars['--color-overlay-hover']
			}
		},
		fontFamily: typographyVars['--font-family-body'],
		fontSize: typeScaleVars['--text-label-size'],
		lineHeight: typeScaleVars['--text-label-leading'],
		color: colorVars['--color-text-primary'],
		cursor: 'pointer',
		textAlign: 'start'
	},
	presetButtonDisabled: {
		color: colorVars['--color-text-disabled'],
		cursor: 'not-allowed',
		backgroundColor: 'transparent'
	},
	presetButtonActive: {
		backgroundColor: colorVars['--color-accent-muted'],
		color: colorVars['--color-accent']
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

/**
 * Upstream declares this as a literal `'sm' | 'md' | 'lg'` rather than deriving
 * it from the size keys, which is what its siblings do. Transcribed as-is; the
 * two are the same type, and the declaration site is the published contract.
 */
export type DateRangeInputSize = 'sm' | 'md' | 'lg';

/** The bordered surface: trigger chrome, popover anchor and tooltip anchor. */
export function dateRangeInputWrapperAttrs(
	size: DateRangeInputSize,
	statusType: InputStatusType | undefined,
	isEffectivelyDisabled: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		inputWrapperStyles.base,
		sizeStyles[size],
		isEffectivelyDisabled && inputWrapperStyles.disabled,
		statusType && inputStatusBorderStyles[statusType],
		statusType && !isEffectivelyDisabled && inputStatusHoverShadowStyles[statusType],
		statusType && inputStatusFocusWithinStyles[statusType],
		xstyle
	);
}

/**
 * The calendar-toggle button and the clear button both. The disabled variant is
 * only ever applied to the toggle — the clear button is not rendered while the
 * field is effectively disabled.
 */
export function dateRangeInputIconButtonAttrs(isDisabled = false): SvelteStyleAttrs {
	return sx(
		focusOutlineStyles.focusVisible,
		styles.iconButton,
		isDisabled && styles.iconButtonDisabled
	);
}

/**
 * The `<button>` that reads as the field's value. `triggerPlaceholder` narrows
 * `color` only, so it *replaces* `trigger`'s rather than joining it — the same
 * merge the `inputInvalid` keys elsewhere in this family rely on.
 */
export function dateRangeInputTriggerAttrs(
	isPlaceholder: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		styles.trigger,
		isPlaceholder && styles.triggerPlaceholder,
		isDisabled && styles.triggerDisabled
	);
}

/** The popover's flex row: preset sidebar beside the calendar. */
export function dateRangeInputPopoverLayoutAttrs(): SvelteStyleAttrs {
	return sx(styles.popoverLayout);
}

/** The bordered preset rail. */
export function dateRangeInputPresetSidebarAttrs(): SvelteStyleAttrs {
	return sx(styles.presetSidebar);
}

/**
 * One preset row; the applied preset takes the accent treatment, and a preset
 * whose range violates the span bounds is shown disabled rather than hidden.
 */
export function dateRangeInputPresetButtonAttrs(
	isActive: boolean,
	isDisabled: boolean
): SvelteStyleAttrs {
	return sx(
		focusOutlineStyles.focusVisible,
		styles.presetButton,
		isActive && styles.presetButtonActive,
		isDisabled && styles.presetButtonDisabled
	);
}
