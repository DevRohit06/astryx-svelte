/**
 * Ported from Astryx's `Calendar/utils.ts` — a pure re-export surface that gives
 * the shared `plainDate` primitives the calendar-facing names upstream publishes.
 *
 * Only three of these reach the package root: `Calendar/index.ts` re-exports
 * `isSameDay`, `isDateInRange` and `getWeekNumber`, and nothing else from this
 * module. The rest are here because upstream's file declares them and
 * `Calendar.svelte` reads them under these names.
 *
 * A fourth, `formatAccessibleDate`, was published through 0.2.0 as an
 * `@deprecated` shim over `plainDateFormat(pd, DATE_FORMAT_WITH_WEEKDAY)`.
 * 0.3.0 deletes it outright, so it is gone here too.
 */

import { DATE_FORMAT_WITH_WEEKDAY, plainDateFormat } from '../../utils/plain-date.js';

export type { PlainDate } from '../../utils/date-types.js';
export {
	plainDateFromISO as parseISO,
	plainDateToISO as dateToISO,
	plainDateIsEqual as isSameDay,
	plainDateIsInRange as isDateInRange,
	plainDateGetWeekNumber as getWeekNumber
} from '../../utils/plain-date.js';

export { plainDateFormat, DATE_FORMAT_WITH_WEEKDAY };
