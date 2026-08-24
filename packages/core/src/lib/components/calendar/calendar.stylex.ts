import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import { rtlStyles } from '../../utils/rtl.stylex.js';
import {
	colorVars,
	durationVars,
	easeVars,
	fontWeightVars,
	radiusVars,
	sizeVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';
import { focusOutlineProps } from '../../utils/focus-outline.stylex.js';

/**
 * Ported from Astryx's `Calendar/styles.ts`, which — unusually for this port —
 * is already a style module of its own upstream rather than inline in the
 * component. That has a consequence for the oracle: because the styles live
 * across a module boundary from `Calendar.tsx`, StyleX never resolves any of the
 * merges, so `dist/Calendar/Calendar.js` carries **zero** inline class strings
 * and all four groups survive as live objects. Calendar's oracle case is
 * therefore object mode only, with no `inline` entries at all.
 *
 * Upstream's own organising rule is kept: `*Styles` groups are structural
 * (spacing, sizing, positioning) and `*Theme` groups are the themeable colours
 * and borders a consumer overrides. That split is why `dayCellStyles.dayToday`,
 * `dayTodayInRange` and `daySelected` are declared **empty** — they are the
 * structural half of a seam whose visual half lives in `dayCellTheme`. They
 * compile to a bare `{$$css: true}` and contribute nothing to the diff, but
 * dropping them would delete the seam, so they are declared here too.
 *
 * `calendarStyles.srOnly` is likewise declared and never applied — upstream
 * declares it and does not use it. It is ported for object parity rather than
 * pruned, on the same standing as the other declared-and-unused keys this port
 * already carries.
 */

// =============================================================================
// Calendar Container Styles
// =============================================================================

export const calendarStyles = stylex.create({
	calendar: {
		display: 'inline-block',
		padding: spacingVars['--spacing-3'],
		minWidth: '220px'
	},
	header: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: spacingVars['--spacing-2'],
		gap: spacingVars['--spacing-2']
	},
	monthYearLabel: {
		flex: 1,
		textAlign: 'center',
		fontWeight: fontWeightVars['--font-weight-semibold'],
		fontSize: typeScaleVars['--text-label-size'],
		color: colorVars['--color-text-primary']
	},
	monthsContainer: {
		display: 'flex',
		gap: spacingVars['--spacing-4']
	},
	srOnly: {
		position: 'absolute',
		width: '1px',
		height: '1px',
		padding: 0,
		margin: '-1px',
		overflow: 'hidden',
		clip: 'rect(0, 0, 0, 0)',
		whiteSpace: 'nowrap',
		borderWidth: 0
	},
	/**
	 * Wrapper for the month nav chevrons. In RTL the flex header already swaps
	 * the buttons' visual sides; the glyphs must mirror with them so "Previous
	 * month" points outward (visually right) instead of inward.
	 *
	 * The mirror itself is **not** declared here. This port hand-rolled the same
	 * `:is([dir="rtl"] *)` transform on this key before 0.2.0 shipped a shared
	 * one; 0.2.0 extracts it as `rtlStyles.mirror`, so the declaration moved out
	 * and `calendarNavIconAttrs` composes the two. Leaving both would emit the
	 * transform twice and diverge from upstream's compiled classes.
	 */
	navIcon: {
		display: 'inline-flex'
	}
});

// =============================================================================
// Month Grid Styles
// =============================================================================

export const monthGridStyles = stylex.create({
	monthGrid: {
		flex: '1 1 0'
	},
	dayName: {
		width: sizeVars['--size-element-md'],
		// Restores the small gap the standalone header used to have below it.
		height: `calc(${sizeVars['--size-element-md']} + ${spacingVars['--spacing-1']})`,
		paddingBottom: spacingVars['--spacing-1'],
		boxSizing: 'border-box',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: typeScaleVars['--text-supporting-size'],
		fontWeight: fontWeightVars['--font-weight-normal'],
		color: colorVars['--color-text-secondary']
	},
	weekNumberHeader: {
		width: sizeVars['--size-element-md']
	},
	daysGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(7, 1fr)'
	},
	daysGridWithNumbers: {
		gridTemplateColumns: 'auto repeat(7, 1fr)'
	},
	weekNumber: {
		width: sizeVars['--size-element-md'],
		height: sizeVars['--size-element-md'],
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: typeScaleVars['--text-supporting-size'],
		color: colorVars['--color-text-secondary']
	},
	weekRow: {
		display: 'contents'
	}
});

// =============================================================================
// Day Cell Styles - Structural (layout, sizing, positioning)
// =============================================================================

export const dayCellStyles = stylex.create({
	// Cell container
	cell: {
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		height: sizeVars['--size-element-md'],
		isolation: 'isolate'
	},

	// Range background - structural positioning
	rangeBg: {
		position: 'absolute',
		top: '2px',
		bottom: '2px',
		insetInlineStart: 0,
		insetInlineEnd: 0
	},
	rangeBgRadiusStart: {
		insetInlineStart: '2px',
		borderStartStartRadius: radiusVars['--radius-full'],
		borderEndStartRadius: radiusVars['--radius-full']
	},
	rangeBgRadiusEnd: {
		insetInlineEnd: '2px',
		borderStartEndRadius: radiusVars['--radius-full'],
		borderEndEndRadius: radiusVars['--radius-full']
	},
	rangeInsetStart: {
		insetInlineStart: '2px'
	},
	rangeInsetEnd: {
		insetInlineEnd: '2px'
	},

	// Preview background - structural positioning
	previewBg: {
		position: 'absolute',
		top: '2px',
		bottom: '2px',
		insetInlineStart: 0,
		insetInlineEnd: 0
	},
	previewBgRadiusStart: {
		insetInlineStart: '2px',
		borderStartStartRadius: radiusVars['--radius-full'],
		borderEndStartRadius: radiusVars['--radius-full']
	},
	previewBgRadiusEnd: {
		insetInlineEnd: '2px',
		borderStartEndRadius: radiusVars['--radius-full'],
		borderEndEndRadius: radiusVars['--radius-full']
	},
	previewStart: {
		insetInlineStart: '2px',
		borderStartStartRadius: radiusVars['--radius-full'],
		borderEndStartRadius: radiusVars['--radius-full']
	},
	previewEnd: {
		insetInlineEnd: '2px',
		borderStartEndRadius: radiusVars['--radius-full'],
		borderEndEndRadius: radiusVars['--radius-full']
	},

	// Day button - structural
	day: {
		width: sizeVars['--size-element-sm'],
		height: sizeVars['--size-element-sm'],
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: '50%',
		borderWidth: 0,
		borderStyle: 'none',
		cursor: {
			default: 'pointer',
			':is(:disabled,[aria-disabled="true"])': 'default'
		},
		fontFamily: 'inherit',
		fontSize: typeScaleVars['--text-body-size'],
		padding: 0,
		position: 'relative',
		zIndex: 1,
		transitionProperty: {
			default: 'background-color, color',
			'@media (prefers-reduced-motion: reduce)': 'none'
		},
		transitionDuration: durationVars['--duration-fast'],
		transitionTimingFunction: easeVars['--ease-standard'],
		// Expand hit target by 2px on each side to prevent gaps.
		//
		// Migrated to logical insets at upstream 0.3.0. This carried a 17a KEEP
		// disable whose stated reason was "the four sides carry the same value, so
		// the box is symmetric and the logical spelling would emit identical CSS" —
		// **and that was false**, exactly as the same claim on `Banner`'s radii was.
		// The oracle proves it: `dayCellStyles.day` differed by four atomic hashes
		// until these two properties moved. `top`/`bottom` stay physical because
		// they are block-axis and direction-neutral, which is upstream's split too.
		'::before': {
			content: '""',
			position: 'absolute',
			top: '-2px',
			insetInlineEnd: '-2px',
			bottom: '-2px',
			insetInlineStart: '-2px'
		}
	},

	// State modifiers - structural only
	dayOutside: {
		opacity: 0.5
	},
	dayToday: {},
	dayTodayInRange: {},
	daySelected: {},
	dayDisabled: {
		cursor: 'default'
	}
});

// =============================================================================
// Day Cell Theme - Colors and visual appearance (customizable)
// =============================================================================

export const dayCellTheme = stylex.create({
	// Range background color
	rangeBg: {
		backgroundColor: colorVars['--color-accent-muted']
	},

	// Preview background (muted overlay)
	previewBg: {
		backgroundColor: colorVars['--color-overlay-hover']
	},

	// Day button - default state
	day: {
		color: colorVars['--color-text-primary'],
		backgroundColor: 'transparent',
		backgroundImage: {
			default: null,
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': `linear-gradient(${colorVars['--color-overlay-hover']}, ${colorVars['--color-overlay-hover']})`
			}
		}
	},

	// Outside days (adjacent months)
	dayOutside: {
		color: colorVars['--color-text-secondary']
	},

	// Today indicator
	dayToday: {
		boxShadow: `inset 0 0 0 1px ${colorVars['--color-border-emphasized']}`
	},

	// Today when inside a selected range
	dayTodayInRange: {
		boxShadow: `inset 0 0 0 1px ${colorVars['--color-text-primary']}`
	},

	// Selected state (single selection or range endpoints)
	daySelected: {
		backgroundColor: colorVars['--color-accent'],
		color: colorVars['--color-on-accent'],
		backgroundImage: {
			default: null,
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': `linear-gradient(${colorVars['--color-overlay-hover']}, ${colorVars['--color-overlay-hover']})`
			}
		}
	},

	// Disabled state
	dayDisabled: {
		opacity: 0.3,
		backgroundImage: {
			default: 'none',
			':hover:where(:not(:disabled,[aria-disabled="true"]))': {
				'@media (hover: hover)': 'none'
			}
		}
	}
});

// =============================================================================
// Attribute helpers — the `sx()` adapter from `stylex.props` to Svelte's
// class/style pair. One per call site in `calendar.svelte` / `month-grid.svelte`
// / `day-cell.svelte`.
// =============================================================================

/** The calendar root. Takes `xstyle` last, so an override *replaces*. */
export function calendarAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(calendarStyles.calendar, xstyle);
}

/** The month-navigation header row. */
export function calendarHeaderAttrs(): SvelteStyleAttrs {
	return sx(calendarStyles.header);
}

/** The centred "January 2026" label between the two nav buttons. */
export function calendarMonthYearLabelAttrs(): SvelteStyleAttrs {
	return sx(calendarStyles.monthYearLabel);
}

/** The flex row holding one or two month grids. */
export function calendarMonthsContainerAttrs(): SvelteStyleAttrs {
	return sx(calendarStyles.monthsContainer);
}

/** The RTL-mirroring wrapper around each chevron glyph. */
/**
 * The month-nav chevron wrapper, mirrored under RTL.
 *
 * The mirror composes onto this element rather than a wrapper — unlike the
 * TreeList/Table chevrons — because `navIcon` carries no `transform` of its
 * own, so there is nothing for `scaleX(-1)` to overwrite. Upstream does the
 * same: `stylex.props(calendarStyles.navIcon, rtlStyles.mirror)`.
 */
export function calendarNavIconAttrs(): SvelteStyleAttrs {
	return sx(calendarStyles.navIcon, rtlStyles.mirror);
}

/** One month pane. */
export function monthGridAttrs(): SvelteStyleAttrs {
	return sx(monthGridStyles.monthGrid);
}

/** The `role="grid"` element; gains a leading column when week numbers show. */
export function daysGridAttrs(hasWeekNumbers: boolean): SvelteStyleAttrs {
	return sx(monthGridStyles.daysGrid, hasWeekNumbers && monthGridStyles.daysGridWithNumbers);
}

/** A `role="row"`, which is `display: contents` so its cells join the grid. */
export function weekRowAttrs(): SvelteStyleAttrs {
	return sx(monthGridStyles.weekRow);
}

/** A weekday `role="columnheader"`. */
export function dayNameAttrs(): SvelteStyleAttrs {
	return sx(monthGridStyles.dayName);
}

/** The blank corner cell above the week-number column. */
export function weekNumberHeaderAttrs(): SvelteStyleAttrs {
	return sx(monthGridStyles.dayName, monthGridStyles.weekNumberHeader);
}

/** A week-number `role="rowheader"`. */
export function weekNumberAttrs(): SvelteStyleAttrs {
	return sx(monthGridStyles.weekNumber);
}

/** A `role="gridcell"`, including the empty placeholder variant. */
export function dayCellAttrs(): SvelteStyleAttrs {
	return sx(dayCellStyles.cell);
}

/**
 * The committed-range background bar.
 *
 * The argument list is upstream's, transcribed verbatim — including the fact
 * that `rangeInsetStart` is applied **twice** (unconditionally for a range start,
 * then again gated on `roundStart`) and that a range *start* takes
 * `rangeInsetEnd` when `roundEnd`. Both look like copy-paste slips and
 * neither changes the emitted classes, since StyleX merges by property hash and
 * a repeated style is idempotent. Deduplicating would diverge from the source
 * for no gain, so it stays.
 */
export function rangeBgAttrs(state: {
	isRangeStart: boolean;
	isRangeEnd: boolean;
	roundStart: boolean;
	roundEnd: boolean;
}): SvelteStyleAttrs {
	return sx(
		dayCellStyles.rangeBg,
		dayCellTheme.rangeBg,
		state.roundStart && dayCellStyles.rangeBgRadiusStart,
		state.roundEnd && dayCellStyles.rangeBgRadiusEnd,
		state.isRangeStart && dayCellStyles.rangeInsetStart,
		state.isRangeStart && state.roundEnd && dayCellStyles.rangeInsetEnd,
		state.isRangeEnd && dayCellStyles.rangeInsetEnd,
		state.isRangeStart && state.roundStart && dayCellStyles.rangeInsetStart
	);
}

/** The hover-preview background bar. */
export function previewBgAttrs(state: {
	isPreviewStart: boolean;
	isPreviewEnd: boolean;
	roundStart: boolean;
	roundEnd: boolean;
}): SvelteStyleAttrs {
	return sx(
		dayCellStyles.previewBg,
		dayCellTheme.previewBg,
		state.roundStart && dayCellStyles.previewBgRadiusStart,
		state.roundEnd && dayCellStyles.previewBgRadiusEnd,
		state.isPreviewStart && dayCellStyles.previewStart,
		state.isPreviewEnd && dayCellStyles.previewEnd
	);
}

/**
 * The day `<button>`. Each structural key is paired with its theme counterpart
 * in the same order upstream applies them, which is what makes the three empty
 * `dayCellStyles` keys load-bearing as a seam rather than dead weight.
 */
export function dayButtonAttrs(state: {
	isOutside: boolean;
	isToday: boolean;
	isSelected: boolean;
	isInRange: boolean;
	isEndpoint: boolean;
	effectivelyDisabled: boolean;
}): SvelteStyleAttrs {
	const todayPlain = state.isToday && !state.isSelected && !state.isInRange;
	const todayInRange = state.isToday && !state.isSelected && state.isInRange;
	return focusOutlineProps.focusVisible(
		dayCellStyles.day,
		dayCellTheme.day,
		state.isOutside && dayCellStyles.dayOutside,
		state.isOutside && dayCellTheme.dayOutside,
		todayPlain && dayCellStyles.dayToday,
		todayPlain && dayCellTheme.dayToday,
		todayInRange && dayCellStyles.dayTodayInRange,
		todayInRange && dayCellTheme.dayTodayInRange,
		state.isEndpoint && dayCellStyles.daySelected,
		state.isEndpoint && dayCellTheme.daySelected,
		state.effectivelyDisabled && dayCellStyles.dayDisabled,
		state.effectivelyDisabled && dayCellTheme.dayDisabled
	);
}
