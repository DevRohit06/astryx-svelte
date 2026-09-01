/** PORTS: NumberInput/numberInputCommit.test.ts */

import { describe, expect, it } from 'vitest';
import {
	parseNumberInput,
	resolveNumberInputCommit
} from '$lib/components/number-input/number-input-commit.js';

/**
 * Astryx's `NumberInput/numberInputCommit.test.ts`, ported case for case.
 * Upstream at the **0.5.2** pin declares **6** `it` blocks producing **6**
 * cases, and all 6 are here. Nothing is dropped.
 *
 * Upstream's own header says it validates `numberInputCommit.ts` *independently
 * of React*; the module imports nothing but a type and the parser, so the port
 * is a transcription and this runs in the **server** project.
 *
 * `1·234·567` (U+00B7) is the invalid draft on both sides, and it is invalid
 * for a reason the parser suite pins: the middle dot was dropped from
 * `SEPARATOR_CHARS` at 0.5.1, so no locale reads it between digits.
 */

describe('parseNumberInput', () => {
	it('validates the complete localized draft', () => {
		expect(parseNumberInput('1.234.567', { locale: 'de-DE' })).toBe(1234567);
		expect(parseNumberInput('1·234·567', { locale: 'de-DE' })).toBeNull();
	});
});

describe('resolveNumberInputCommit', () => {
	it('commits one valid localized draft', () => {
		expect(
			resolveNumberInputCommit('1.234.567', {
				locale: 'de-DE',
				hasClear: false
			})
		).toEqual({
			type: 'commit',
			value: 1234567,
			didClamp: false
		});
	});

	it('reverts the whole draft when parsing fails', () => {
		expect(
			resolveNumberInputCommit('1·234·567', {
				locale: 'en-US',
				hasClear: false
			})
		).toEqual({ type: 'revert' });
	});

	it('clamps an out-of-range draft and requests normalization', () => {
		expect(
			resolveNumberInputCommit('100', {
				min: 1,
				max: 2,
				isIntegerOnly: true,
				hasClear: false
			})
		).toEqual({ type: 'commit', value: 2, didClamp: true });
	});

	it('distinguishes a clearable empty draft from a revert', () => {
		expect(resolveNumberInputCommit('', { hasClear: true })).toEqual({
			type: 'clear'
		});
		expect(resolveNumberInputCommit('', { hasClear: false })).toEqual({
			type: 'revert'
		});
	});

	it('reverts when no value can satisfy the bounds', () => {
		expect(
			resolveNumberInputCommit('10', {
				min: 5,
				max: 2,
				hasClear: false
			})
		).toEqual({ type: 'revert' });
	});
});
