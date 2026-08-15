import { describe, expect, it } from 'vitest';
import { snapToGraphemeBoundary } from '$lib/hooks/use-streaming-text.svelte.js';

/**
 * The `snapToGraphemeBoundary` half of Astryx's `hooks/useStreamingText.test.ts`
 * at **v0.4.1** — its second `describe`, all 3 cases, titles and assertions
 * unchanged. The 11 cases of the `useStreamingText` describe live next door in
 * `use-streaming-text.svelte.test.ts`; between the two files upstream's 14 are
 * all present.
 *
 * ## Why the file splits where it does
 *
 * `snapToGraphemeBoundary` is a pure function of a string and an offset. It
 * reaches for `Intl.Segmenter` and nothing else — no rune, no DOM, no clock — so
 * it belongs in the **server** project for the same reason `use-typeahead` and
 * `compute-overflow` do: it runs anywhere, including where a browser cannot bind
 * a port, and a Chromium boot buys these three assertions nothing. Its sibling
 * cannot follow it, because the hook is `$effect.pre` plus an `$effect` driving
 * `requestAnimationFrame`, and neither rune runs under `svelte/server`.
 *
 * The import is from the module rather than the barrel, because upstream
 * exports `snapToGraphemeBoundary` from `useStreamingText.ts` and keeps it off
 * `hooks/index.ts` — and so do we.
 *
 * Node has `Intl.Segmenter`, so this exercises the same branch a browser does.
 * The `isLowSurrogate` fallback is unreachable on both, and upstream tests it on
 * neither; it is not a dropped case, it is a branch with no upstream case.
 */

describe('snapToGraphemeBoundary', () => {
	it('does not split a surrogate pair', () => {
		const text = 'a\u{1F389}b'; // 🎉 is a surrogate pair: indices 1 (high) and 2 (low)
		expect(snapToGraphemeBoundary(text, 2)).toBe(1);
		expect(snapToGraphemeBoundary(text, 1)).toBe(1);
	});

	it('does not split a ZWJ emoji sequence', () => {
		// Four people joined by three literal U+200D zero-width joiners, exactly
		// as upstream writes it: 11 UTF-16 code units, one grapheme cluster.
		const family = '\u{1F468}‍\u{1F469}‍\u{1F467}‍\u{1F466}';
		const text = 'x' + family + 'y';
		const familyStart = 1;
		const familyEnd = 1 + family.length;
		for (let offset = familyStart + 1; offset < familyEnd; offset++) {
			expect(snapToGraphemeBoundary(text, offset)).toBe(familyStart);
		}
	});

	it('leaves boundary offsets (start, end, plain-ASCII midpoints) unchanged', () => {
		const text = 'hello';
		expect(snapToGraphemeBoundary(text, 0)).toBe(0);
		expect(snapToGraphemeBoundary(text, 5)).toBe(5);
		expect(snapToGraphemeBoundary(text, 3)).toBe(3);
	});
});
