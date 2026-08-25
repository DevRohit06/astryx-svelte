import { describe, expect, it } from 'vitest';
import {
	getInitialFocusDate,
	type InitialFocusDateOptions
} from '$lib/components/calendar/get-initial-focus-date.js';
import { plainDateFromISO, plainDateToISO } from '$lib/utils/plain-date.js';

/**
 * Ported from Astryx's `Calendar/getInitialFocusDate.test.ts` — **all 13 of its
 * cases at the 0.5.0 pin**, in upstream's order and with upstream's titles.
 * Nothing is dropped.
 *
 * A pure function over `PlainDate`, so this is the node project (`*.test.ts`):
 * no DOM, no component, no clock — `TODAY` is passed in explicitly exactly as
 * upstream passes it, which is the whole point of the module taking `today` as
 * an argument.
 *
 * The only translation is the import path: upstream's `Partial<Parameters<…>[0]>`
 * is spelled against the exported `InitialFocusDateOptions` here, which is the
 * same type by construction.
 */

const TODAY = plainDateFromISO('2026-08-21');

function focusISO(options: Partial<InitialFocusDateOptions>) {
	return plainDateToISO(getInitialFocusDate({ numberOfMonths: 1, today: TODAY, ...options }));
}

describe('getInitialFocusDate', () => {
	it('opens on today when there are no bounds', () => {
		expect(focusISO({})).toBe('2026-08-21');
	});

	it('opens on today when today is inside the min/max window', () => {
		expect(focusISO({ min: '2026-01-01', max: '2026-12-31' })).toBe('2026-08-21');
	});

	it('treats the bounds as inclusive', () => {
		expect(focusISO({ min: '2026-08-21' })).toBe('2026-08-21');
		expect(focusISO({ max: '2026-08-21' })).toBe('2026-08-21');
	});

	it('opens on min when the whole window is in the future', () => {
		expect(focusISO({ min: '2027-03-04', max: '2027-06-30' })).toBe('2027-03-04');
	});

	it('opens on max when the whole window is in the past', () => {
		expect(focusISO({ min: '2019-01-01', max: '2019-04-30' })).toBe('2019-04-01');
	});

	it('clamps against a one-sided min', () => {
		expect(focusISO({ min: '2030-05-17' })).toBe('2030-05-17');
	});

	it('clamps against a one-sided max', () => {
		expect(focusISO({ max: '2020-02-09' })).toBe('2020-02-01');
	});

	it('lands max in the last pane in the two-month layout', () => {
		// Opening on max's month would spend the second pane entirely
		// out of bounds, so the window's end sits on the right instead.
		expect(focusISO({ max: '2020-02-09', numberOfMonths: 2 })).toBe('2020-01-01');
	});

	it('does not shift the two-month layout back past min', () => {
		expect(focusISO({ min: '2020-02-03', max: '2020-02-09', numberOfMonths: 2 })).toBe(
			'2020-02-03'
		);
	});

	it('prefers the selected value over the bounds', () => {
		expect(focusISO({ value: '2031-07-04', min: '2019-01-01' })).toBe('2031-07-04');
	});

	it('uses a range value start as the visible month', () => {
		expect(focusISO({ value: { start: '2019-03-08', end: '2019-03-19' } })).toBe('2019-03-08');
	});

	it('prefers an explicit focusDate over everything else', () => {
		expect(
			focusISO({
				focusDate: '2015-11-02',
				value: '2031-07-04',
				min: '2026-01-01',
				max: '2026-12-31'
			})
		).toBe('2015-11-02');
	});

	it('prefers min when the bounds are inverted', () => {
		// Degenerate input (min after max) — resolve it deterministically
		// rather than reading the second bound off a contradiction.
		expect(focusISO({ min: '2027-01-01', max: '2020-01-01' })).toBe('2027-01-01');
	});
});
