import { describe, expect, it } from 'vitest';
import { parseStyleKey } from '$lib/theme/parse-style-key.js';

/**
 * Astryx's `utils/parseStyleKey.test.ts`, ported case for case — **10 upstream
 * cases at the 0.5.0 pin, 10 here**, in upstream's order and under upstream's titles.
 * Nothing dropped, nothing added.
 *
 * A **server** project file (`*.test.ts`), as upstream's is: the parser turns a
 * style key into a class-selector suffix and touches nothing else.
 *
 * The module sits under `theme/` here rather than `utils/`, beside the theme
 * compiler that is its only caller — one of the "two homes for one upstream
 * dir" placements recorded in `port/todo.md`. Only the import path differs.
 *
 * `theme.test.ts` carried two of these ten, folded into cases of its own that
 * asserted several keys apiece. They are unfolded to upstream's granularity
 * here and removed from there.
 */
describe('parseStyleKey', () => {
	it('returns empty string for base', () => {
		expect(parseStyleKey('base')).toBe('');
	});

	it('converts variant:value to .value', () => {
		expect(parseStyleKey('variant:secondary')).toBe('.secondary');
	});

	it('prefixes numeric values with prop name', () => {
		expect(parseStyleKey('level:1')).toBe('.level-1');
	});

	it('handles compound keys', () => {
		expect(parseStyleKey('variant:destructive+size:sm')).toBe('.destructive.sm');
	});

	it('handles compound with numeric value', () => {
		expect(parseStyleKey('variant:primary+level:2')).toBe('.primary.level-2');
	});
});

describe('parseStyleKey — bare state keys', () => {
	it('converts bare state to .state', () => {
		expect(parseStyleKey('checked')).toBe('.checked');
	});

	it('converts disabled state', () => {
		expect(parseStyleKey('disabled')).toBe('.disabled');
	});

	it('converts selected state', () => {
		expect(parseStyleKey('selected')).toBe('.selected');
	});

	it('handles compound bare states', () => {
		expect(parseStyleKey('checked+disabled')).toBe('.checked.disabled');
	});

	it('handles mixed bare state + prop:value', () => {
		expect(parseStyleKey('variant:destructive+disabled')).toBe('.destructive.disabled');
	});
});
