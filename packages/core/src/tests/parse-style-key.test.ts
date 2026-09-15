/** PORTS: utils/parseStyleKey.test.ts */

import { describe, expect, it } from 'vitest';
import { parseStyleKey } from '$lib/theme/parse-style-key.js';

/**
 * Astryx's `utils/parseStyleKey.test.ts`, ported case for case, in upstream's
 * order and under upstream's titles. Nothing dropped, nothing added.
 *
 * A **server** project file (`*.test.ts`), as upstream's is: the parser turns a
 * style key into a selector suffix and touches nothing else.
 *
 * The module sits under `theme/` here rather than `utils/`, beside the theme
 * compiler that is its only caller — one of the "two homes for one upstream
 * dir" placements recorded in `port/todo.md`. Only the import path differs.
 *
 * Upstream 0.6.0 moved the output from bare prop/state classes to data-attribute
 * selectors and folded its second `describe` block into the first, so every
 * expectation here changed with the pin. The two cases `theme.test.ts` used to
 * carry stay unfolded here at upstream's granularity.
 *
 * The escaping case builds its metacharacters from char codes. A literal
 * backslash in this file is legible enough, but it is the one thing a shell
 * heredoc silently eats on the way in — CLAUDE.md's `^H` lesson, reached from
 * the other direction — and an expectation that lost its escape would still
 * compile, still lint, and assert the wrong string.
 */
const QUOTE = String.fromCharCode(34);
const BACKSLASH = String.fromCharCode(92);

describe('parseStyleKey', () => {
	it('returns no suffix for base', () => {
		expect(parseStyleKey('base')).toBe('');
	});

	it('preserves the prop axis in data-attribute selectors', () => {
		expect(parseStyleKey('variant:secondary')).toBe('[data-variant="secondary"]');
		expect(parseStyleKey('size:sm')).toBe('[data-size="sm"]');
	});

	it('keeps numeric values literal', () => {
		expect(parseStyleKey('level:2')).toBe('[data-level="2"]');
	});

	it('kebab-cases camelCase prop names', () => {
		expect(parseStyleKey('listStyle:ordered')).toBe('[data-list-style="ordered"]');
	});

	it('combines multiple prop selectors', () => {
		expect(parseStyleKey('variant:destructive+size:sm')).toBe(
			'[data-variant="destructive"][data-size="sm"]'
		);
	});

	it('converts bare states to reflected state attributes', () => {
		expect(parseStyleKey('checked')).toBe('[data-checked="checked"]');
		expect(parseStyleKey('checked+disabled')).toBe(
			'[data-checked="checked"][data-disabled="disabled"]'
		);
	});

	it('combines a prop selector and a bare state selector', () => {
		expect(parseStyleKey('variant:destructive+disabled')).toBe(
			'[data-variant="destructive"][data-disabled="disabled"]'
		);
	});

	it('escapes CSS string metacharacters in values', () => {
		expect(parseStyleKey('variant:quote' + QUOTE + 'slash' + BACKSLASH)).toBe(
			'[data-variant="quote' + BACKSLASH + '22 slash' + BACKSLASH + '5c "]'
		);
	});

	it('preserves empty values for compatibility', () => {
		expect(parseStyleKey('variant:')).toBe('[data-variant=""]');
	});
});
