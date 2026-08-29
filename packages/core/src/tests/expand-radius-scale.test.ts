import { describe, expect, it } from 'vitest';
import { expandRadiusScale } from '$lib/theme/expand-radius-scale.js';

/**
 * Astryx's `theme/expandRadiusScale.test.ts`, ported case for case — **6
 * upstream cases at the 0.5.0 pin, 6 here**, in upstream's order and under upstream's
 * titles. Nothing dropped, nothing added.
 *
 * A **server** project file (`*.test.ts`), as upstream's is: `expandRadiusScale`
 * is arithmetic over a config object with no DOM and no component in it.
 *
 * No translation beyond the import path. The module is upstream's line for line
 * — the port's only divergence is the `--radius-chat` comment, and the case
 * below that pins it (`applies multiplier`) asserts the same value upstream's
 * does.
 */
describe('expandRadiusScale', () => {
	it('generates default scale', () => {
		const tokens = expandRadiusScale({ base: 4, multiplier: 1 });
		expect(tokens['--radius-none']).toBe('0px');
		expect(tokens['--radius-inner']).toBe('4px');
		expect(tokens['--radius-element']).toBe('8px');
		expect(tokens['--radius-container']).toBe('12px');
		expect(tokens['--radius-page']).toBe('28px');
		expect(tokens['--radius-chat']).toBe('28px');
		expect(tokens['--radius-full']).toBe('9999px');
	});

	it('applies multiplier', () => {
		const tokens = expandRadiusScale({ base: 4, multiplier: 1.5 });
		expect(tokens['--radius-inner']).toBe('6px');
		expect(tokens['--radius-element']).toBe('12px');
		expect(tokens['--radius-container']).toBe('18px');
		expect(tokens['--radius-page']).toBe('42px');
		expect(tokens['--radius-chat']).toBe('42px');
	});

	it('multiplier 0 produces all zeros', () => {
		const tokens = expandRadiusScale({ base: 4, multiplier: 0 });
		expect(tokens['--radius-none']).toBe('0px');
		expect(tokens['--radius-inner']).toBe('0px');
		expect(tokens['--radius-element']).toBe('0px');
		expect(tokens['--radius-container']).toBe('0px');
		expect(tokens['--radius-page']).toBe('0px');
		expect(tokens['--radius-chat']).toBe('0px');
		expect(tokens['--radius-full']).toBe('9999px');
	});

	it('fixed tokens are unaffected by multiplier', () => {
		const tokens = expandRadiusScale({ base: 4, multiplier: 2 });
		expect(tokens['--radius-none']).toBe('0px');
		expect(tokens['--radius-full']).toBe('9999px');
	});

	it('rounds fractional results to nearest integer', () => {
		const tokens = expandRadiusScale({ base: 3, multiplier: 1.3 });
		// 3 * 1 * 1.3 = 3.9 → 4px
		expect(tokens['--radius-inner']).toBe('4px');
		// 3 * 2 * 1.3 = 7.8 → 8px
		expect(tokens['--radius-element']).toBe('8px');
	});

	it('works with non-standard base', () => {
		const tokens = expandRadiusScale({ base: 6, multiplier: 1 });
		expect(tokens['--radius-inner']).toBe('6px');
		expect(tokens['--radius-element']).toBe('12px');
		expect(tokens['--radius-container']).toBe('18px');
		expect(tokens['--radius-page']).toBe('42px');
	});
});
