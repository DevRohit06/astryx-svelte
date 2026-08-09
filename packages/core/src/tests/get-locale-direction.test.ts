import { describe, expect, test } from 'vitest';
import { getLocaleDirection } from '$lib/i18n/get-locale-direction.js';

/**
 * Ported case-for-case from upstream's
 * `i18n/__tests__/getLocaleDirection.test.ts` — 5 cases, 5 here.
 *
 * A **server-project** suite (`*.test.ts`, node environment) deliberately, and
 * that placement is the point rather than an economy: the helper exists to be
 * callable from a `+layout.server.ts` to set `<html dir>`, so running it with no
 * DOM and no Svelte compiler in the pipeline is the thing under test. A rune or
 * a `.svelte.ts` extension creeping into the module would fail here.
 */
describe('getLocaleDirection', () => {
	test('returns ltr for English', () => {
		expect(getLocaleDirection('en')).toBe('ltr');
	});

	test('returns rtl for RTL languages', () => {
		expect(getLocaleDirection('ar')).toBe('rtl');
		expect(getLocaleDirection('he')).toBe('rtl');
		expect(getLocaleDirection('fa')).toBe('rtl');
		expect(getLocaleDirection('ur')).toBe('rtl');
	});

	test('returns ltr for regional LTR tags', () => {
		expect(getLocaleDirection('pt-BR')).toBe('ltr');
		expect(getLocaleDirection('zh-CN')).toBe('ltr');
	});

	test('falls back to ltr for a malformed locale without throwing', () => {
		expect(() => getLocaleDirection('not_a_locale')).not.toThrow();
		expect(getLocaleDirection('not_a_locale')).toBe('ltr');
	});

	test('falls back to ltr for an empty string without throwing', () => {
		expect(() => getLocaleDirection('')).not.toThrow();
		expect(getLocaleDirection('')).toBe('ltr');
	});
});
