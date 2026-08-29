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
	spacingVars,
	radiusVars,
	sizeVars,
	borderVars,
	fontWeightVars,
	typeScaleVars,
	typographyVars,
	durationVars,
	easeVars
} from '../../styles/tokens.stylex.js';
import { focusOutlineStyles } from '../../utils/focus-outline.stylex.js';
import { rtlStyles } from '../../utils/rtl.stylex.js';
import { dateInputTouchSizes, dateInputTouchGeometry } from './tokens.stylex.js';
import type { DateInputSize } from './date-input.stylex.js';

/**
 * Ported from Astryx's `DateInput/TouchDateField.tsx`, where the styles are
 * inline in the component file rather than in a module of their own.
 *
 * `input`, `inputDisabled`, `iconButton` and `iconButtonDisabled` are
 * upstream's own restatements of the pointer field's — it declares them again
 * in `TouchDateField.tsx` rather than importing them — and are restated here
 * for the same reason the pointer field restates `TimeInput`'s: StyleX's
 * content-derived hashes make every copy compile to the same atomic classes,
 * and the oracle diffs this module against upstream's `TouchDateField` output.
 */

/**
 * The comfortable minimum tap target on both iOS and Android. Applied as a
 * FLOOR under the size prop rather than replacing it: `size` still means what
 * it means, it just cannot produce a control a thumb misses.
 */
const TOUCH_TARGET = dateInputTouchSizes.daySize;

/**
 * The whole surface swap, in one leg.
 *
 * It used to be two: the outgoing surface faded out, then the incoming one
 * faded in, 110ms each. The sequencing existed for one reason — the wheels'
 * panel was transparent, so overlapping the two put the wheels' translucent
 * selection band over the calendar grid and tinted a band-shaped strip of it,
 * which read as "the grey area animates differently from the content".
 *
 * Giving the wheels an opaque background removes the reason. Nothing shows
 * through them, so they can simply fade in ON TOP of a calendar that does not
 * move at all — no empty middle, no outgoing animation, and one duration
 * instead of a wait plus a fade.
 */
const SWAP_DURATION = durationVars['--duration-fast'];

const sizeStyles = stylex.create({
	sm: {
		height: sizeVars['--size-element-sm'],
		minWidth: 180,
		minBlockSize: { default: null, '@media (pointer: coarse)': TOUCH_TARGET }
	},
	md: {
		height: sizeVars['--size-element-md'],
		minWidth: 180,
		minBlockSize: { default: null, '@media (pointer: coarse)': TOUCH_TARGET }
	},
	lg: {
		height: sizeVars['--size-element-lg'],
		minWidth: 180,
		minBlockSize: { default: null, '@media (pointer: coarse)': TOUCH_TARGET }
	}
});

const styles = stylex.create({
	// ---- the closed field ----
	wrapper: {
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
	input: {
		display: 'block',
		flex: 1,
		minWidth: 0,
		borderWidth: 0,
		borderStyle: 'none',
		padding: 0,
		fontFamily: typographyVars['--font-family-body'],
		// Below 16px iOS zooms the page on focus. The field is focusable even
		// though it is not typable, so it needs the same floor DateInput has.
		fontSize: {
			default: typeScaleVars['--text-body-size'],
			'@media (pointer: coarse)': `max(1rem, ${typeScaleVars['--text-body-size']})`
		},
		lineHeight: typeScaleVars['--text-body-leading'],
		color: colorVars['--color-text-primary'],
		backgroundColor: 'transparent',
		outline: 'none',
		// It opens a picker; it does not take text. The caret would say otherwise.
		caretColor: 'transparent',
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		userSelect: 'none',
		'::placeholder': {
			color: colorVars['--color-text-secondary']
		}
	},
	inputDisabled: {
		cursor: 'default'
	},

	// ---- the picker surface ----
	surface: {
		display: 'flex',
		flexDirection: 'column',
		inlineSize: '100%'
	},
	header: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: spacingVars['--spacing-2'],
		blockSize: sizeVars['--size-element-lg']
		// No inline padding of its own: the content box owns the inset, and any
		// extra here would push the arrows off the line the day grid sits on.
	},
	/**
	 * Both arrows together, at the trailing corner. `IconButton` draws each
	 * one — a hand-rolled button had the glyph off-centre, and matching
	 * Button's optical centring by hand is exactly the sort of thing a shared
	 * component is for.
	 */
	monthArrows: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-0-5'],
		// The pair is the trailing item; the title takes the space before it.
		marginInlineStart: 'auto',
		// The plate starts below the header, so these two are the one part of the
		// calendar the layer above cannot cover. They fade on its timing instead,
		// both directions, so the change reads as one motion rather than chrome
		// blinking out a beat before the grid is covered.
		transitionProperty: 'opacity, visibility',
		transitionDuration: SWAP_DURATION,
		transitionTimingFunction: 'linear',
		'@media (prefers-reduced-motion: reduce)': {
			transitionDuration: '0.01s'
		}
	},
	/**
	 * An arrow with nowhere to go. Hidden, not unmounted, and not merely
	 * disabled — it keeps its 44px so the remaining arrow does not slide
	 * sideways as the range's edge is reached, and `visibility: hidden` takes
	 * it out of the tab order and the accessibility tree so nothing invisible
	 * is reachable.
	 */
	monthArrowUnavailable: {
		visibility: 'hidden'
	},
	/**
	 * Hidden while the wheels are up: they step the calendar, and the calendar
	 * is not on screen. Hidden rather than unmounted because they are the
	 * tallest thing in the header — dropping them would shorten it by 8px and
	 * shift the whole sheet just as the panels cross-fade.
	 */
	monthArrowsHidden: {
		visibility: 'hidden',
		opacity: 0,
		pointerEvents: 'none'
	},
	/**
	 * `Button`'s own sizes top out at 36px, which is fine for a mouse and short
	 * of the 44px every other target in this sheet honours. Floor it on a
	 * coarse pointer, the same way the field and the day cells do.
	 */
	monthArrow: {
		minBlockSize: { default: null, '@media (pointer: coarse)': TOUCH_TARGET },
		minInlineSize: { default: null, '@media (pointer: coarse)': TOUCH_TARGET }
	},
	/**
	 * The wrapper the RTL mirror rides on has to be a flex box. A bare inline
	 * span puts the glyph on the text baseline, which lifts it a few px off the
	 * button's optical centre — the whole reason these are `IconButton`s now.
	 * Core's Calendar carries the identical `navIcon` rule.
	 */
	monthArrowIcon: {
		display: 'inline-flex'
	},
	/**
	 * The month and year, and the toggle into the wheels. Leading, so it reads
	 * first and sits on the same line as the day grid below it.
	 */
	title: {
		display: 'flex',
		alignItems: 'center',
		gap: spacingVars['--spacing-1'],
		blockSize: '100%',
		paddingInline: spacingVars['--spacing-2'],
		// Pulls the text back onto the grid's line: the button's own padding
		// would otherwise inset the label past it.
		marginInlineStart: `calc(-1 * ${spacingVars['--spacing-2']})`,
		borderWidth: 0,
		borderStyle: 'none',
		borderRadius: radiusVars['--radius-element'],
		backgroundColor: {
			default: 'transparent',
			'@media (hover: hover)': {
				default: 'transparent',
				':hover:where(:not(:disabled,[aria-disabled="true"]))': colorVars['--color-overlay-hover']
			},
			':active': colorVars['--color-overlay-pressed']
		},
		color: colorVars['--color-text-primary'],
		fontSize: typeScaleVars['--text-large-size'],
		fontWeight: fontWeightVars['--font-weight-semibold'],
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		whiteSpace: 'nowrap'
	},
	titleChevron: {
		display: 'inline-flex',
		// The one part of the swap that keeps `--ease-standard`, because it is
		// the one part that travels: a rotation has a distance to cover, and
		// fast-out-slow-in is what that curve is for. Same duration as the
		// surface it announces, so the two land together.
		transitionProperty: 'transform',
		transitionDuration: SWAP_DURATION,
		transitionTimingFunction: easeVars['--ease-standard'],
		'@media (prefers-reduced-motion: reduce)': {
			transitionDuration: '0.01s'
		}
	},
	titleChevronOpen: {
		transform: 'rotate(180deg)'
	},
	weekdays: {
		display: 'grid',
		gridTemplateColumns: 'repeat(7, 1fr)',
		blockSize: sizeVars['--size-element-sm'],
		alignItems: 'center',
		// Same as the arrows: above the plate's reach, so it fades on the layer's
		// timing rather than clearing on its own.
		transitionProperty: 'opacity, visibility',
		transitionDuration: SWAP_DURATION,
		transitionTimingFunction: 'linear',
		'@media (prefers-reduced-motion: reduce)': {
			transitionDuration: '0.01s'
		}
	},
	weekdaysHidden: {
		// Hidden, not unmounted: the row still owes the surface its height, or
		// opening the wheels would make the picker shorter.
		visibility: 'hidden',
		opacity: 0
	},
	weekday: {
		textAlign: 'center',
		fontSize: typeScaleVars['--text-supporting-size'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		color: colorVars['--color-text-secondary']
	},
	body: {
		display: 'grid',
		blockSize: dateInputTouchGeometry.paneBlockSize,
		position: 'relative'
	},
	/**
	 * The two panels share one grid cell, and the wheels are the one on top.
	 */
	panel: {
		gridArea: '1 / 1',
		minWidth: 0
	},
	/**
	 * The layer underneath — the calendar, and the calendar's footer actions.
	 *
	 * It has no opacity and never fades. `visibility` is the only thing that
	 * moves, and giving it the layer's own duration is what times it: CSS
	 * interpolates `visibility` discretely, holding `visible` for the whole
	 * transition whenever either end is `visible` and taking the final value
	 * only at the finish. So it disappears exactly when the cover completes,
	 * and on the way back it is there from the first frame, revealed as the
	 * layer above fades off it.
	 *
	 * It is not merely decorative to hide it: `inert` keeps it off the tab
	 * order, but a layer that is only COVERED is still `visible` to a screen
	 * reader, so the two footer actions would both be announced.
	 *
	 * `visibility` (not `display`) also keeps the month scroller laid out while
	 * the wheels are up, so its scroll offset survives the round trip and the
	 * wheels can steer it before it is shown again.
	 */
	panelBeneath: {
		transitionProperty: 'visibility',
		transitionDuration: SWAP_DURATION,
		'@media (prefers-reduced-motion: reduce)': {
			transitionDuration: '0.01s'
		}
	},
	panelBeneathHidden: {
		visibility: 'hidden',
		pointerEvents: 'none'
	},
	/**
	 * The month and year, as one layer that fades in and out on top.
	 *
	 * `backgroundColor` is what makes the fade uniform. Without it the wheels
	 * are a translucent selection band and some text, each compositing against
	 * a live calendar grid on its own terms — so the band area faded unlike the
	 * rest and read as "the grey area animates differently from the content".
	 *
	 * `isolation` is what makes the plate actually cover. Backgrounds and text
	 * paint in separate phases, so without a stacking context a later sibling's
	 * background lands UNDER an earlier sibling's text — the plate went in
	 * opaque and the calendar's day numbers showed straight through it.
	 *
	 * `visibility` rides along with `opacity`, on the same rule as the layer
	 * beneath, so fading out is seen rather than cut on the first frame.
	 *
	 * Easing is `linear`, not `--ease-standard`: that token is
	 * `cubic-bezier(0.24, 1, 0.4, 1)`, which is right for something travelling
	 * a distance and wrong for a fade.
	 */
	panelOverlay: {
		backgroundColor: colorVars['--color-background-surface'],
		isolation: 'isolate',
		transitionProperty: 'opacity, visibility',
		transitionDuration: SWAP_DURATION,
		transitionTimingFunction: 'linear',
		'@media (prefers-reduced-motion: reduce)': {
			transitionDuration: '0.01s'
		}
	},
	panelOverlayHidden: {
		visibility: 'hidden',
		opacity: 0,
		pointerEvents: 'none'
	},
	footer: {
		paddingBlockStart: spacingVars['--spacing-2'],
		// Same reason as the header: the content box owns the inline inset, so
		// Done's edge lines up with the grid's rather than sitting 4px inside it.
		// One grid cell, so the two actions stack and the row is as tall as one
		// button whichever is showing.
		display: 'grid',
		gridTemplateColumns: '1fr'
	},
	/**
	 * One footer action. Both occupy the same cell, and the wheels' one is a
	 * layer over the calendar's pair exactly as the panels above are. The row
	 * never changes height either way.
	 */
	footerAction: {
		gridArea: '1 / 1',
		// Side by side and equal: the calendar's cell holds Reset and Save, the
		// wheels' holds one button.
		display: 'flex',
		gap: spacingVars['--spacing-2']
	},
	sheetBody: {
		// One inset on every edge. The block-start is the exception and has to
		// be: the sheet's grab handle floats out of flow, costing no layout
		// height of its own, so the content wrapper owes it the 24px it occupies
		// — which reads as the same inset, because the handle sits in it.
		paddingInline: spacingVars['--spacing-4'],
		paddingBlockStart: spacingVars['--spacing-6'],
		paddingBlockEnd: spacingVars['--spacing-4']
	},
	/**
	 * Declared by upstream and referenced by nothing in its own file, so
	 * StyleX's tree-shake compensation drops it on both sides and it emits no
	 * CSS at all. Kept here so this module stays a line-for-line reading of
	 * upstream's — deleting it would be the one divergence a future diff of the
	 * two files could not explain.
	 */
	divider: {
		blockSize: borderVars['--border-width'],
		backgroundColor: colorVars['--color-border'],
		marginBlockStart: spacingVars['--spacing-1']
	}
});

/** The bordered closed field: input chrome, sheet trigger, tooltip anchor. */
export function touchDateFieldWrapperAttrs(
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

/** The leading calendar-glyph button that opens the sheet. */
export function touchDateFieldIconButtonAttrs(isDisabled: boolean): SvelteStyleAttrs {
	return sx(
		focusOutlineStyles.focusVisible,
		styles.iconButton,
		isDisabled && styles.iconButtonDisabled
	);
}

/** The `<input role="combobox">` — readOnly, but a real input all the same. */
export function touchDateFieldInputAttrs(isDisabled: boolean): SvelteStyleAttrs {
	return sx(styles.input, isDisabled && styles.inputDisabled);
}

/** The picker column inside the sheet. */
export function touchSurfaceAttrs(): SvelteStyleAttrs {
	return sx(styles.surface);
}

/** The title + arrows row. */
export function touchHeaderAttrs(): SvelteStyleAttrs {
	return sx(styles.header);
}

/** The month-stepper pair at the trailing corner. */
export function touchMonthArrowsAttrs(isWheelOpen: boolean): SvelteStyleAttrs {
	return sx(styles.monthArrows, isWheelOpen && styles.monthArrowsHidden);
}

/**
 * Passed through to `IconButton`'s `xstyle`, so it is a style *argument* list
 * rather than finished attributes — the button merges it after its own.
 */
export function touchMonthArrowXstyle(canStep: boolean): StyleArg[] {
	return [styles.monthArrow, !canStep && styles.monthArrowUnavailable];
}

/** The flex wrapper carrying the RTL mirror on a stepper glyph. */
export function touchMonthArrowIconAttrs(): SvelteStyleAttrs {
	return sx(styles.monthArrowIcon, rtlStyles.mirror);
}

/** The month/year button that toggles the wheels. */
export function touchTitleAttrs(): SvelteStyleAttrs {
	return sx(styles.title, focusOutlineStyles.focusVisible);
}

/**
 * Passed through to `Icon`'s `xstyle`. The transform rides on the Icon itself,
 * not a wrapper span, so the element a theme can target is the element that
 * moves.
 */
export function touchTitleChevronXstyle(isOpen: boolean): StyleArg[] {
	return [styles.titleChevron, isOpen && styles.titleChevronOpen];
}

/** The decorative weekday header row. */
export function touchWeekdaysAttrs(isWheelOpen: boolean): SvelteStyleAttrs {
	return sx(styles.weekdays, isWheelOpen && styles.weekdaysHidden);
}

/** One weekday name. */
export function touchWeekdayAttrs(): SvelteStyleAttrs {
	return sx(styles.weekday);
}

/** The one-cell grid the two panels share. */
export function touchBodyAttrs(): SvelteStyleAttrs {
	return sx(styles.body);
}

/** The calendar panel — the layer underneath. */
export function touchPanelBeneathAttrs(isHidden: boolean): SvelteStyleAttrs {
	return sx(styles.panel, styles.panelBeneath, isHidden && styles.panelBeneathHidden);
}

/** The wheels panel — the opaque layer that fades in on top. */
export function touchPanelOverlayAttrs(isHidden: boolean): SvelteStyleAttrs {
	return sx(styles.panel, styles.panelOverlay, isHidden && styles.panelOverlayHidden);
}

/** The footer's single grid cell. */
export function touchFooterAttrs(): SvelteStyleAttrs {
	return sx(styles.footer);
}

/** The calendar's pair of footer buttons. */
export function touchFooterActionBeneathAttrs(isHidden: boolean): SvelteStyleAttrs {
	return sx(styles.footerAction, styles.panelBeneath, isHidden && styles.panelBeneathHidden);
}

/** The wheels' single footer button. */
export function touchFooterActionOverlayAttrs(isHidden: boolean): SvelteStyleAttrs {
	return sx(styles.footerAction, styles.panelOverlay, isHidden && styles.panelOverlayHidden);
}

/** The inset wrapper inside the sheet. */
export function touchSheetBodyAttrs(): SvelteStyleAttrs {
	return sx(styles.sheetBody);
}
