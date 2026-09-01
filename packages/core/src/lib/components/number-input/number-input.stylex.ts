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
	sizeVars,
	spacingVars,
	typeScaleVars,
	typographyVars
} from '../../styles/tokens.stylex.js';
import { interactionOverlayStyles } from '../../utils/interaction-overlay.stylex.js';

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

// Public padding tokens for the `number-input` theme target. A theme writes an
// ordinary `padding` (in ANY spelling -- the shorthand, `paddingBlock`, or a
// single `paddingBlockStart`) and the pipeline's `container` expansion parses
// it and emits these normalized per-side tokens; the wrapper and the stepper
// column both read them, so the column tracks whatever the theme sets instead
// of assuming the default. Routing through the shared expansion rather than a
// hand-rolled property->var mapping is what makes every spelling work: a
// mapping only fires for the exact property name it names.
//
// Read order per level: `var(--astryx-..., <next level>)`, terminating at the
// shared field defaults (NOT the container default --spacing-4, which is a
// layout metric and would resize every themed field). Built as chained const
// strings -- no function calls -- so StyleX can statically analyze them; same
// shape as the card/section/dialog chains in `internal/container.stylex.ts`.
const FIELD_PAD_BLOCK = spacingVars['--spacing-1'];
const FIELD_PAD_INLINE = spacingVars['--spacing-2'];
const padBlockAll = `var(--astryx-number-input-padding, ${FIELD_PAD_BLOCK})`;
const padInlineAll = `var(--astryx-number-input-padding, ${FIELD_PAD_INLINE})`;
const padInline = `var(--astryx-number-input-padding-inline, ${padInlineAll})`;
const padInlineStart = `var(--astryx-number-input-padding-inline-start, ${padInline})`;
const padInlineEnd = `var(--astryx-number-input-padding-inline-end, ${padInline})`;
const padBlockStart = `var(--astryx-number-input-padding-block-start, ${padBlockAll})`;
const padBlockEnd = `var(--astryx-number-input-padding-block-end, ${padBlockAll})`;

const styles = stylex.create({
	wrapper: {
		zIndex: 1,
		// Applied per side rather than through the shared field base's
		// `paddingBlock`/`paddingInline` shorthands, because the stepper column
		// has to cancel the block padding edge by edge -- an asymmetric
		// `paddingBlock: 4px 12px` needs two different negative margins.
		paddingBlockStart: padBlockStart,
		paddingBlockEnd: padBlockEnd,
		paddingInlineStart: padInlineStart,
		paddingInlineEnd: padInlineEnd
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
		// Cancel the wrapper's block padding edge by edge so the column spans the
		// field's full height. Reading the same tokens the wrapper applies is what
		// keeps it flush under a themed padding -- including an asymmetric one,
		// where a single `marginBlock` would be wrong at one end.
		marginBlockStart: `calc(-1 * ${padBlockStart})`,
		marginBlockEnd: `calc(-1 * ${padBlockEnd})`,
		borderInlineStartWidth: borderVars['--border-width'],
		borderInlineStartStyle: 'solid',
		borderInlineStartColor: colorVars['--color-border-emphasized'],
		overflow: 'hidden',
		borderStartEndRadius: 'var(--_field-radius)',
		borderEndEndRadius: 'var(--_field-radius)'
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
		// Upstream 0.5.1 moved the hover/pressed overlay into the shared module.
		interactionOverlayStyles.backgroundImage,
		isDecrement && styles.decrementButton,
		isStepperDisabled && styles.numberStepperButtonDisabled
	);
}

/** The 180° rotation that turns the shared `chevronDown` glyph into a chevron up. */
export const numberInputIncrementIconStyle = styles.incrementIcon;
