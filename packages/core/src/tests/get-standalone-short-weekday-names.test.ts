/** PORTS: Calendar/getStandaloneShortWeekdayNames.test.ts */

import { describe, expect, it } from 'vitest';
import { getStandaloneShortWeekdayNames } from '$lib/components/calendar/get-standalone-short-weekday-names.js';
import { standaloneShortWeekdayNamesByLocale } from '$lib/components/calendar/standalone-short-weekday-names.generated.js';

/**
 * Ported from Astryx's `Calendar/getStandaloneShortWeekdayNames.test.ts`, all
 * **5** cases at the 0.5.0 pin. Nothing is dropped.
 *
 * Runs in the **server** project: a pure lookup over generated reference data,
 * with no DOM.
 *
 * The identity assertions (`toBe`, not `toEqual`) are upstream's and are load
 * bearing — they prove the resolver returns the generated entry itself rather
 * than a copy, which is what makes the fallback chain observable.
 */

describe('getStandaloneShortWeekdayNames', () => {
	it('preserves the default English weekday names', () => {
		expect(getStandaloneShortWeekdayNames('en')).toEqual([
			'Su',
			'Mo',
			'Tu',
			'We',
			'Th',
			'Fr',
			'Sa'
		]);
	});

	it('returns an exact generated locale entry', () => {
		expect(getStandaloneShortWeekdayNames('ar-SA')).toBe(
			standaloneShortWeekdayNamesByLocale['ar-SA']
		);
	});

	it('ignores Unicode extensions when resolving an exact locale', () => {
		const expected = standaloneShortWeekdayNamesByLocale['zh-TW'];

		expect(getStandaloneShortWeekdayNames('zh-TW')).toBe(expected);
		expect(getStandaloneShortWeekdayNames('zh-TW-u-ca-chinese')).toBe(expected);
	});

	it('falls back from a regional locale to its base language', () => {
		expect(getStandaloneShortWeekdayNames('es-ES')).toBe(standaloneShortWeekdayNamesByLocale.es);
	});

	it('safely falls back to English for malformed and unsupported locales', () => {
		expect(getStandaloneShortWeekdayNames('not_a_locale')).toBe(
			standaloneShortWeekdayNamesByLocale.en
		);
		expect(getStandaloneShortWeekdayNames('xx-ZZ')).toBe(standaloneShortWeekdayNamesByLocale.en);
	});
});
