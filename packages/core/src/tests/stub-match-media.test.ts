import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubMatchMedia } from './stub-match-media.js';

/**
 * Ported from Astryx's `__tests__/stubMatchMedia.test.ts`, all **6** cases at the
 * 0.5.0 pin. Nothing is dropped.
 *
 * A test helper with its own suite, which is unusual — the reason is in
 * `stub-match-media.ts`'s header: the failure mode of the blanket stub it
 * replaces is *invisible*, because every test still passes while silently
 * running against reduced motion. A helper whose whole job is to stop a silent
 * wrong answer has to be pinned against giving one.
 *
 * Runs in the **server** project: it stubs a global and reads it back, with no
 * component and no DOM.
 */

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('stubMatchMedia', () => {
	it('routes prefers-reduced-motion independently of every other query', () => {
		// The exact combination the blanket stub could not express: below a
		// breakpoint (matches) while motion is NOT reduced.
		stubMatchMedia({ reduceMotion: false, matches: true });

		expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false);
		expect(matchMedia('(max-width: 768px)').matches).toBe(true);
	});

	it('answers no-preference as the opposite of reduce', () => {
		// Two spellings, opposite meanings. A substring test on
		// 'prefers-reduced-motion' alone would hand both the same answer.
		stubMatchMedia({ reduceMotion: true });

		expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
		expect(matchMedia('(prefers-reduced-motion: no-preference)').matches).toBe(false);
	});

	it('treats the bare preference query as reduce', () => {
		stubMatchMedia({ reduceMotion: true });
		expect(matchMedia('(prefers-reduced-motion)').matches).toBe(true);

		stubMatchMedia({ reduceMotion: false });
		expect(matchMedia('(prefers-reduced-motion)').matches).toBe(false);
	});

	it('defaults to full motion and matching everything else', () => {
		stubMatchMedia();

		expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false);
		expect(matchMedia('(max-width: 768px)').matches).toBe(true);
	});

	it('lets a non-motion query be answered false', () => {
		// Above the breakpoint, motion still reduced — the other axis of the
		// combination, so neither knob can be quietly driving both.
		stubMatchMedia({ reduceMotion: true, matches: false });

		expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
		expect(matchMedia('(max-width: 768px)').matches).toBe(false);
	});

	it('echoes the query and exposes the listener API components subscribe to', () => {
		stubMatchMedia();
		const mql = matchMedia('(max-width: 768px)');

		// `useMediaQuery` subscribes; a stub without these throws on mount rather
		// than failing an assertion, which reads as an unrelated crash.
		expect(mql.media).toBe('(max-width: 768px)');
		expect(typeof mql.addEventListener).toBe('function');
		expect(typeof mql.removeEventListener).toBe('function');
		expect(typeof mql.addListener).toBe('function');
		expect(typeof mql.removeListener).toBe('function');
	});
});
