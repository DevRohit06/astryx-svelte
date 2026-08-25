/**
 * The pure helpers, ported from Astryx's `utils/`. None of them contains React,
 * so every one is a transcription rather than a translation.
 *
 * Three of upstream's `utils/` modules landed earlier under `internal/` —
 * `types.ts`, `themeProps.ts`, `sharedResizeObserver.ts` — and `parseStyleKey`
 * sits with the theme compiler that is its only caller. See the note in port/todo.md.
 *
 * Deliberately not ported (`port/research/06`): `mergeRefs`, `isRenderable`,
 * `mergeProps`, `composeEventHandlers` — Svelte obviates each.
 */

export type { DateRange, DayOfWeek, ISODateString } from './date-types.js';
// `DayOfWeekName` is **not** re-exported here, because upstream's
// `utils/index.ts` does not export it either — it reaches the package root
// through `Calendar/index.ts` alone, and `calendar.svelte` now publishes it from
// there. Exporting it from both would give the root two declaration sites for
// one type. Its companion `normalizeDayOfWeek` is module-private upstream and
// stays so here; Calendar imports it directly.

export { dateToISO, isLocaleDayFirst, parseDateInput, parseISO } from './date-parser.js';

export {
	DATE_FORMAT_LONG,
	DATE_FORMAT_MONTH_ONLY,
	DATE_FORMAT_MONTH_YEAR,
	DATE_FORMAT_SHORT,
	DATE_FORMAT_SHORT_WITH_WEEKDAY,
	DATE_FORMAT_SHORT_WITH_YEAR,
	DATE_FORMAT_WEEKDAY_ONLY,
	DATE_FORMAT_WITH_WEEKDAY,
	formatSharedDate,
	getDaysInMonth,
	plainDateAddDays,
	plainDateAddMonths,
	plainDateCreate,
	plainDateDayOfWeek,
	plainDateFormat,
	plainDateFromDate,
	plainDateFromISO,
	plainDateFromInstant,
	plainDateGetWeekNumber,
	plainDateIsAfter,
	plainDateIsBefore,
	plainDateIsEqual,
	plainDateIsInRange,
	plainDateMax,
	plainDateMin,
	plainDateSetEndOfWeekExclusive,
	plainDateSetFirstOfMonth,
	plainDateSetStartOfWeek,
	plainDateToDate,
	plainDateToISO,
	plainDateToInstant,
	plainDateToday,
	SHARED_DATE_FORMAT_OPTIONS,
	type PlainDate,
	type SharedDateFormat
} from './plain-date.js';

export {
	adjustTime,
	clampTime,
	compareTime,
	createISOTimeString,
	formatDisplayTime12h,
	formatDisplayTime24h,
	formatISOTime,
	isTimeInRange,
	parseISOTime,
	parseTimeInput,
	type ISOTimeString,
	type ParsedTime
} from './time-parser.js';

export { getKey, type Key, type KeyFallback } from './get-key.js';

export { groupItems, getItemGroup, type ItemGroup, type GroupItemsOptions } from './group-items.js';

export { getInputARIA, type InputARIA, type InputARIAInputGroup } from './input-aria.js';

export {
	formatColor,
	formatHex,
	parseColor,
	parseHex,
	parseRgb,
	toGLFloats,
	type RGBA
} from './color.js';

// The dev-logging family, exactly the four names upstream's `utils/index.ts`
// publishes. `__resetDevWarnings` is **not** among them: upstream marks it
// `@internal` and keeps it off its barrel too, so it stays module-public and
// barrel-absent here, reachable only from `dev-warning.ts` — which is where its
// test imports it from. Same standing as `__resetLiveRegionsForTest`.
export { devError, devWarn, formatDevMessage, warnOnce } from './dev-warning.js';

// The RTL mirror, published as upstream's `utils/index.ts` publishes it. The
// `rtlMirrorAttrs` companion is deliberately **not** re-exported: it is this
// package's internal application of the same style, with no upstream
// counterpart, and the parity rule makes an extra published symbol a defect.
export { rtlStyles } from './rtl.stylex.js';

// The shared focus ring, exported for the same reason `rtlStyles` is: a style
// that must be identical across packages, not copied. The `FOCUS_OUTLINE*`
// constants alongside them are module-public but **barrel-absent**, exactly as
// upstream leaves them — they are the imperative escape hatch for
// `useIndicatorFocusRing`, not published API.
export { focusOutlineStyles, focusOutlineProps } from './focus-outline.stylex.js';

// The "should this overlay reclaim focus?" test, new at upstream 0.4.0.
export { isFocusDetached } from './focus-return.js';

// `interaction-modality.ts` is deliberately NOT re-exported. Upstream keeps it
// off every barrel — `PanelSearchInput` is its only consumer, plus a test — so
// it stays module-public and barrel-absent here, on the same standing as
// `rtlMirrorAttrs` and `__resetDevWarnings`. An extra published symbol is a
// defect under the parity rule.

// -----------------------------------------------------------------------------
// Upstream's `utils/` directory, reunited with its subpath
// -----------------------------------------------------------------------------
//
// These ten all live in upstream's `utils/index.ts` and were reachable here only
// from the package root (or, for `parseStyleKey`, from `./theme`), so
// `import {themeProps} from '@astryx-svelte/core/utils'` failed where upstream's
// succeeds. Placement, not absence — recorded in `port/debts.md` as the
// consumer-visible half of the "two homes for one upstream dir" item.
//
// The *files* stay where they are: `internal/types.ts`,
// `internal/theme-props.ts`, `internal/shared-resize-observer.ts` and
// `theme/parse-style-key.ts` are imported by name across the tree, and moving
// them is a whole-tree import churn with no consumer-visible effect. The root
// re-exports stay too, because they have shipped since 0.3.1 and dropping one
// would break a consumer to tidy a barrel. This adds the subpath upstream has.
export type { SizeValue } from '../internal/types.js';
export { parseStyleKey } from '../theme/parse-style-key.js';
export {
	themeProps,
	themeDataAttributes,
	type ClassProps,
	type ClassValue,
	type ThemeProps,
	type ThemeDataAttributes
} from '../internal/theme-props.js';
export { observeResize, unobserveResize } from '../internal/shared-resize-observer.js';

// Both new at upstream 0.4.5, and both published from this barrel there.
// `characters` replaces `.length` / `.charAt(0)` / `.slice(0, n)` on
// user-visible strings; `isImeKeyEvent` moved here from the focus-trap module,
// because it is a pure predicate rather than a hook.
export { characterCount, firstCharacter, truncateCharacters } from './characters.js';
export { isImeKeyEvent } from './ime.js';
