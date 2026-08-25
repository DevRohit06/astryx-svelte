import * as stylex from '@stylexjs/stylex';
import { sx, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	radiusVars,
	fontWeightVars,
	typeScaleVars,
	durationVars,
	borderVars
} from '../../styles/tokens.stylex.js';
import { focusOutlineStyles } from '../../utils/focus-outline.stylex.js';
import { dateInputTouchSizes, dateInputTouchGeometry } from './tokens.stylex.js';

/**
 * Ported from Astryx's `DateInput/MonthScroller.tsx`, where the styles are
 * inline in the component file rather than in a module of their own.
 *
 * The continuous surface: months stacked along the inline axis in one
 * scroller, each pane exactly as wide as the scrollport and snapped to its
 * start. Two consequences fall out of that single geometric choice — the
 * picker never changes height, and there is no resting position that shows
 * half of two months.
 *
 * `dynamic.spacer` / `dynamic.pane` are `stylex.create` **function styles**,
 * so the class-parity oracle cannot see them (it reads modules statically);
 * `compare-upstream-css.mjs` is what covers their output.
 */

const DAY_SIZE = dateInputTouchSizes.daySize;

const styles = stylex.create({
	scroller: {
		position: 'relative',
		blockSize: dateInputTouchGeometry.paneBlockSize,
		// Stated, not inherited from the reset: the pane size, the snap offsets
		// and the virtualization all key off the measured box, so a consumer
		// without reset.css (or with a stray box-sizing rule — the reset's is
		// zero-specificity `:where`) must not be able to change what it means.
		boxSizing: 'border-box',
		overflowX: 'auto',
		overflowY: 'hidden',
		// The paging behaviour, now along the inline axis. Every snap area is a
		// full pane, so there is exactly one resting position per month.
		scrollSnapType: 'x mandatory',
		// Keeps a fling inside the picker rather than handing it to the page.
		overscrollBehavior: 'contain',
		scrollbarWidth: 'none',
		// pan-x, so the browser keeps horizontal pans here and hands VERTICAL
		// ones straight to the sheet. That is why this scroller no longer claims
		// the gesture the way the wheels do: with the axes separated there is
		// nothing to fight over, and a downward drag on the calendar can go back
		// to meaning swipe-to-dismiss.
		touchAction: 'pan-x'
	},
	spacer: {
		position: 'relative',
		blockSize: '100%'
	},
	pane: {
		position: 'absolute',
		insetBlock: 0,
		blockSize: dateInputTouchGeometry.paneBlockSize,
		scrollSnapAlign: 'start',
		// No `scroll-snap-stop: always`. It would cap every fling at one month,
		// which is tidy but stops the surface being continuous — "three months
		// ahead" should be one throw, not three flicks. Momentum carrying past
		// several panes is why OVERSCAN is what it is.
		display: 'grid',
		gridTemplateColumns: 'repeat(7, 1fr)',
		gridTemplateRows: dateInputTouchGeometry.paneRows
	},
	row: {
		display: 'contents'
	},
	cell: {
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center'
	},
	day: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		inlineSize: '100%',
		blockSize: '100%',
		minInlineSize: DAY_SIZE,
		minBlockSize: DAY_SIZE,
		padding: 0,
		borderWidth: 0,
		borderStyle: 'none',
		backgroundColor: 'transparent',
		color: colorVars['--color-text-primary'],
		fontSize: typeScaleVars['--text-body-size'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		// A tap on a 44px target should not also select the number inside it.
		userSelect: 'none',
		WebkitTapHighlightColor: 'transparent'
	},
	/**
	 * The circular hit/selection puck inside the tap target. Sizing the puck
	 * rather than the button keeps the touch target at the full cell while the
	 * visual stays a tidy circle.
	 */
	puck: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		inlineSize: `calc(${DAY_SIZE} - 8px)`,
		blockSize: `calc(${DAY_SIZE} - 8px)`,
		borderRadius: radiusVars['--radius-full'],
		borderWidth: borderVars['--border-width'],
		borderStyle: 'solid',
		borderColor: 'transparent',
		backgroundColor: 'transparent',
		transitionProperty: 'background-color, color, border-color',
		transitionDuration: durationVars['--duration-fast']
	},
	puckHoverable: {
		// Two guards, for two different failure modes.
		//
		// `@media (hover: hover)`: on a touch screen a :hover tint sticks to the
		// last tapped day until something else is tapped.
		//
		// `:where(:not(:disabled,[aria-disabled="true"]))`: a browser suppresses a
		// disabled control's EVENTS, not its hover styling, so an unguarded
		// :hover tints a day you cannot pick. The day's disabled state lives on
		// the button (as `aria-disabled`, which keeps it focusable) and this puck
		// is the span inside it, so today the working mechanism is the JS gate at
		// the call site — this guard is what keeps the rule true if the styles
		// ever move onto the button itself.
		backgroundColor: {
			default: 'transparent',
			'@media (hover: hover)': {
				default: 'transparent',
				':hover:where(:not(:disabled,[aria-disabled="true"]))': colorVars['--color-overlay-hover']
			}
		}
	},
	puckToday: {
		borderColor: colorVars['--color-border-emphasized'],
		fontWeight: fontWeightVars['--font-weight-semibold']
	},
	puckSelected: {
		backgroundColor: {
			default: colorVars['--color-accent'],
			// Holds the accent through hover, overriding puckHoverable's tint.
			// Same guarded selector, so the two have equal specificity and
			// application order decides — which is what puts this one on top.
			':hover:where(:not(:disabled,[aria-disabled="true"]))': colorVars['--color-accent']
		},
		borderColor: colorVars['--color-accent'],
		color: colorVars['--color-on-accent'],
		fontWeight: fontWeightVars['--font-weight-semibold']
	},
	/**
	 * A day belonging to the month either side of this pane. Muted the way
	 * Calendar mutes its own, and unselectable for the same reason it is
	 * there: it exists to show where the month ends, not to offer a date.
	 */
	dayOutside: {
		// Exactly what the desktop calendar does to its own spill days: the
		// secondary text colour AND half opacity, which is what makes them read
		// as background rather than as dimmer choices.
		color: colorVars['--color-text-secondary'],
		opacity: 0.5
	},
	dayDisabled: {
		// The desktop's disabled treatment, and deliberately not a disabled
		// COLOUR: it fades whatever colour the day already had (0.3), so an
		// in-month day and a spilled one stay a step apart while disabled, and
		// both land LIGHTER than an enabled spill day rather than darker.
		opacity: 0.3,
		cursor: 'default'
	}
});

const dynamic = stylex.create({
	spacer: (inlineSize: number) => ({
		inlineSize: `${inlineSize}px`
	}),
	// insetInlineStart, not left: under RTL the panes have to lay out from the
	// right, and the scroll math mirrors with them (see scrollOffsetForRow).
	pane: (insetInlineStart: number, inlineSize: number) => ({
		insetInlineStart: `${insetInlineStart}px`,
		inlineSize: `${inlineSize}px`
	})
});

/** The paged scrollport. */
export function monthScrollerAttrs(): SvelteStyleAttrs {
	return sx(styles.scroller);
}

/** The full-length spacer that gives the scroller its scroll width. */
export function monthScrollerSpacerAttrs(inlineSize: number): SvelteStyleAttrs {
	return sx(styles.spacer, dynamic.spacer(inlineSize));
}

/** One absolutely positioned month grid. */
export function monthPaneAttrs(insetInlineStart: number, inlineSize: number): SvelteStyleAttrs {
	return sx(styles.pane, dynamic.pane(insetInlineStart, inlineSize));
}

/** A week, which contributes no box of its own. */
export function monthRowAttrs(): SvelteStyleAttrs {
	return sx(styles.row);
}

/** One `role="gridcell"`. */
export function monthCellAttrs(): SvelteStyleAttrs {
	return sx(styles.cell);
}

/**
 * The day button. Outside FIRST, so disabled wins where both apply: a spilled
 * day past the range is unselectable, and must not be painted more available
 * than the in-month days beside it.
 */
export function monthDayAttrs(isOutside: boolean, isDisabled: boolean): SvelteStyleAttrs {
	return sx(
		styles.day,
		focusOutlineStyles.focusVisible,
		isOutside && styles.dayOutside,
		isDisabled && styles.dayDisabled
	);
}

/** The circular puck inside a day button. */
export function monthPuckAttrs(
	isDisabled: boolean,
	isToday: boolean,
	isSelected: boolean
): SvelteStyleAttrs {
	return sx(
		styles.puck,
		!isDisabled && styles.puckHoverable,
		isToday && styles.puckToday,
		isSelected && styles.puckSelected
	);
}
