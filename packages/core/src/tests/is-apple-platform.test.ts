import { afterEach, describe, expect, it, vi } from 'vitest';
import { isApplePlatform } from '$lib/utils/is-apple-platform.js';

/**
 * Astryx's `utils/isApplePlatform.test.ts`, ported case for case — **all 4 of
 * upstream's declarations at the 0.5.2 pin**, in upstream's order and under its
 * titles. Nothing dropped.
 *
 * The module is new at upstream 0.5.1, which consolidated several scattered
 * platform checks into one. It is imported by path rather than through the
 * `utils` barrel, because upstream keeps it off its own barrel — `src/index.ts`
 * does `export * from './utils'` there, so naming it would publish it as API.
 *
 * Standing translations: none needed. This is a pure predicate over `navigator`,
 * so the suite is a transcription — `vi.stubGlobal` behaves identically here, and
 * `it.each` counts as one declaration under this repo's counting rule.
 */
describe('isApplePlatform', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('trusts a client-hints platform that names one', () => {
		vi.stubGlobal('navigator', {
			userAgentData: { platform: 'macOS' },
			platform: 'Win32'
		});
		expect(isApplePlatform()).toBe(true);

		vi.stubGlobal('navigator', {
			userAgentData: { platform: 'Windows' },
			platform: 'MacIntel'
		});
		expect(isApplePlatform()).toBe(false);
	});

	it.each([
		['blank', ''],
		['whitespace', '   '],
		['the spec Unknown sentinel', 'Unknown'],
		['unknown in any case', 'UNKNOWN'],
		['a non-string', null]
	])('falls through to navigator.platform on %s', (_label, platform) => {
		vi.stubGlobal('navigator', {
			userAgentData: { platform },
			platform: 'MacIntel'
		});
		expect(isApplePlatform()).toBe(true);

		vi.stubGlobal('navigator', { userAgentData: { platform }, platform: 'Win32' });
		expect(isApplePlatform()).toBe(false);
	});

	it('falls back to navigator.platform when client hints are absent', () => {
		vi.stubGlobal('navigator', { platform: 'iPhone' });
		expect(isApplePlatform()).toBe(true);

		vi.stubGlobal('navigator', { platform: 'Linux x86_64' });
		expect(isApplePlatform()).toBe(false);
	});

	it('answers false when there is no navigator at all', () => {
		vi.stubGlobal('navigator', undefined);
		expect(isApplePlatform()).toBe(false);
	});
});
