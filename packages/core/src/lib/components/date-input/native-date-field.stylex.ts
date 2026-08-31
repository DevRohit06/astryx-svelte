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
import type { DateInputSize } from './date-input.stylex.js';

/**
 * Ported from Astryx's `DateInput/NativeDateField.tsx`, where the styles are
 * inline in the component file rather than in a module of their own.
 *
 * `iconButton`, `iconButtonDisabled`, `inputDisabled` and `inputInvalid` are
 * upstream's own restatements of the pointer field's — it declares them again
 * in `NativeDateField.tsx` rather than importing them — and are restated here
 * for the same reason the other two surfaces restate theirs: StyleX's
 * content-derived hashes make every copy compile to the same atomic classes,
 * and the oracle diffs this module against upstream's `NativeDateField`
 * output.
 *
 * Everything unusual in here was measured on a real iOS device; the comments
 * say which behaviour forced which decision, because none of them are
 * reproducible in a desktop browser.
 */

const styles = stylex.create({
	wrapper: {
		gap: 8
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
	input: {
		display: 'block',
		flex: 1,
		minWidth: 0,
		borderWidth: 0,
		borderStyle: 'none',
		padding: 0,
		fontFamily: typographyVars['--font-family-body'],
		// Below 16px iOS zooms the page when the field takes focus.
		fontSize: {
			default: typeScaleVars['--text-body-size'],
			'@media (pointer: coarse)': `max(1rem, ${typeScaleVars['--text-body-size']})`
		},
		lineHeight: typeScaleVars['--text-body-leading'],
		color: colorVars['--color-text-primary'],
		backgroundColor: 'transparent',
		outline: 'none',
		// A date control's intrinsic height comes from its inner edit fields, not
		// from `line-height`, so it renders ~2px taller than a text input and its
		// value sits off the shared baseline inside the same flex row. One line
		// box is exactly what the text field occupies.
		height: stylex.firstThatWorks(
			'1lh',
			`calc(max(1rem, ${typeScaleVars['--text-body-size']}) * ${typeScaleVars['--text-body-leading']})`
		),
		// iOS gives date controls their own button-like chrome, with inner
		// spacing and a centred value that no reset of ours can reach.
		WebkitAppearance: 'none',
		appearance: 'none',
		// Chromium paints a second calendar glyph inside the field; this surface
		// already ships a toggle button, so drop the duplicate.
		'::-webkit-calendar-picker-indicator': {
			display: 'none'
		},
		'::-webkit-date-and-time-value': {
			textAlign: 'start',
			marginBlock: 0,
			marginInline: 0,
			paddingBlock: 0,
			paddingInline: 0,
			lineHeight: 'inherit',
			minHeight: 0
		},
		'::-webkit-datetime-edit': {
			paddingBlock: 0,
			paddingInline: 0,
			lineHeight: 'inherit'
		}
	},
	inputDisabled: {
		cursor: 'default'
	},
	inputInvalid: {
		color: colorVars['--color-text-secondary']
	},
	// Hides whatever the engine paints inside the control so this field's own
	// text can take that space. WebKit renders the value into a single
	// `::-webkit-date-and-time-value` run which the UA stylesheet gives no
	// colour of its own (the iOS UA colour sits on the INPUT), so it inherits
	// this; Chromium's `::-webkit-datetime-edit` fields inherit it too.
	// `-webkit-text-fill-color` is what actually wins inside a WebKit date
	// control.
	inputTextHidden: {
		color: 'transparent',
		WebkitTextFillColor: 'transparent'
	},
	// Positioning context for the overlay, standing in for the input's own box
	// in the field's flex row.
	slot: {
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		flex: 1,
		minWidth: 0
	},
	// This field's own text, laid over the control. Decorative: the input still
	// holds the value and keeps its label, description, and status wiring, so
	// announcing this too would just double-speak.
	overlay: {
		position: 'absolute',
		insetInlineStart: 0,
		// Both insets, so the overlay is bounded by the slot rather than
		// shrink-to-fit. Without the end inset a long formatted date paints past
		// the slot and over whatever follows it in the field — measured running
		// 24px across the clear button.
		insetInlineEnd: 0,
		insetBlock: 0,
		// A BLOCK box, not a flex one: `text-overflow` only applies to a block
		// container, so on a flex container a too-long date hard-clips mid-glyph
		// instead of ellipsising (measured identical to `text-overflow: clip` in
		// both WebKit and Chromium). Centring then comes from the line box, so
		// the overlay carries the same font size and leading as the input it
		// covers — one line of that leading fills its height exactly, which puts
		// the glyphs on the input's own baseline.
		display: 'block',
		fontSize: {
			default: typeScaleVars['--text-body-size'],
			'@media (pointer: coarse)': `max(1rem, ${typeScaleVars['--text-body-size']})`
		},
		lineHeight: typeScaleVars['--text-body-leading'],
		// A tap has to reach the control underneath — that is what raises the
		// picker.
		pointerEvents: 'none',
		overflow: 'hidden',
		whiteSpace: 'nowrap',
		textOverflow: 'ellipsis'
	},
	overlayValue: {
		color: colorVars['--color-text-primary']
	},
	overlayPlaceholder: {
		color: colorVars['--color-text-secondary']
	}
});

const sizeStyles = stylex.create({
	sm: { height: sizeVars['--size-element-sm'], minWidth: 180 },
	md: { height: sizeVars['--size-element-md'], minWidth: 180 },
	lg: { height: sizeVars['--size-element-lg'], minWidth: 180 }
});

/** The bordered surface: input chrome and tooltip anchor. */
export function nativeDateFieldWrapperAttrs(
	size: DateInputSize,
	statusType: InputStatusType | undefined,
	isEffectivelyDisabled: boolean,
	inGroup: boolean,
	xstyle: StyleArg
): SvelteStyleAttrs {
	return sx(
		inputWrapperStyles.base,
		sizeStyles[size],
		styles.wrapper,
		isEffectivelyDisabled && inputWrapperStyles.disabled,
		statusType && inputStatusBorderStyles[statusType],
		statusType && !isEffectivelyDisabled && inputStatusHoverShadowStyles[statusType],
		statusType && inputStatusFocusWithinStyles[statusType],
		inGroup && groupStyles.inGroup,
		xstyle
	);
}

/**
 * The picker-raising toggle. Unlike the other two surfaces this pair serves the
 * toggle alone — the clear button here is `InputClearButton`, which carries its
 * own chrome.
 */
export function nativeDateFieldIconButtonAttrs(isDisabled: boolean): SvelteStyleAttrs {
	return sx(
		focusOutlineStyles.focusVisible,
		styles.iconButton,
		isDisabled && styles.iconButtonDisabled
	);
}

/** The positioned box the control and its text overlay share. */
export function nativeDateFieldSlotAttrs(): SvelteStyleAttrs {
	return sx(styles.slot);
}

/**
 * The `<input type="date">`. `inputTextHidden` and `inputInvalid` both narrow
 * `color`, so each *replaces* `input`'s rather than joining it — the order is
 * load-bearing, and it is the order upstream's compiled eight-entry lookup
 * table encodes.
 */
export function nativeDateFieldInputAttrs(
	showsOverlay: boolean,
	isDisabled: boolean,
	isInvalid: boolean
): SvelteStyleAttrs {
	return sx(
		styles.input,
		showsOverlay && styles.inputTextHidden,
		isDisabled && styles.inputDisabled,
		isInvalid && styles.inputInvalid
	);
}

/**
 * This field's own text, painted over the control. The value/placeholder pair
 * is an either-or rather than a conditional, so both branches always carry a
 * colour for `inputInvalid` to replace.
 */
export function nativeDateFieldOverlayAttrs(
	hasValue: boolean,
	isDisabled: boolean,
	isInvalid: boolean
): SvelteStyleAttrs {
	return sx(
		styles.overlay,
		hasValue ? styles.overlayValue : styles.overlayPlaceholder,
		isDisabled && styles.inputDisabled,
		isInvalid && styles.inputInvalid
	);
}
