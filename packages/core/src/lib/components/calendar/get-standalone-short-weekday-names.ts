import {
	standaloneShortWeekdayNamesByLocale,
	type StandaloneShortWeekdayNames
} from './standalone-short-weekday-names.generated.js';

/**
 * Ported from Astryx's `Calendar/getStandaloneShortWeekdayNames.ts`.
 *
 * Private locale resolver for `Calendar`'s weekday headers. Not exported from
 * the package — upstream keeps it Calendar-internal.
 */

const weekdayNamesByLocale: Readonly<Record<string, StandaloneShortWeekdayNames>> =
	standaloneShortWeekdayNamesByLocale;
const englishWeekdayNames = weekdayNamesByLocale.en;

/**
 * Resolve generated weekday reference data as exact locale → language → English.
 * Unicode extensions are ignored through `Intl.Locale.baseName`. Invalid tags and
 * valid but unsupported languages safely use English.
 */
export function getStandaloneShortWeekdayNames(locale: string): StandaloneShortWeekdayNames {
	try {
		const parsed = new Intl.Locale(locale);
		return (
			weekdayNamesByLocale[parsed.baseName] ??
			weekdayNamesByLocale[parsed.language] ??
			englishWeekdayNames
		);
	} catch {
		return englishWeekdayNames;
	}
}
