/** PORTS: CodeBlock/highlightRanges.test.ts */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyHighlightRangesChunked } from '$lib/components/code-block/highlight-ranges.js';
import type { TokenLine } from '$lib/components/code-block/tokenizer.js';

/**
 * Astryx's `CodeBlock/highlightRanges.test.ts`, ported case for case.
 *
 * Upstream has **3** `it` cases in one describe block at the **0.5.0** pin. All 3 are ported with
 * their assertions unchanged — `highlight-ranges.ts` is pure DOM, transcribed
 * verbatim, so there is nothing to translate. Nothing is dropped.
 *
 * It needs a real document *and* real `Range` objects, so this is a
 * `.svelte.test.ts` and runs in the **client** (Chromium) project even though no
 * Svelte component is involved.
 *
 * Setup translations (none of these change a case):
 * - Upstream's `beforeEach` stubs `requestAnimationFrame`/`cancelAnimationFrame`.
 *   `highlightRanges.ts` calls neither — the stub is vestigial, left over from an
 *   earlier implementation — so it is not reproduced. Faking rAF in a real
 *   browser would also be a live hazard for anything else on the page.
 * - `globalThis.CSS` / `globalThis.Highlight` are replaced with `vi.stubGlobal`
 *   rather than by direct assignment. Chromium *does* implement both, so the
 *   stub matters more here than in jsdom: without it the ranges would go into
 *   the browser's real highlight registry and the test could not read their
 *   count back. `vi.unstubAllGlobals()` puts the real ones back, which upstream's
 *   `vi.restoreAllMocks()` does not need to do because jsdom had none.
 */

// Mock CSS Highlight API
class MockHighlight extends Set<Range> {}
const mockHighlightsMap = new Map<string, MockHighlight>();

beforeEach(() => {
	mockHighlightsMap.clear();

	vi.stubGlobal('CSS', {
		highlights: {
			get: (name: string) => mockHighlightsMap.get(name),
			set: (name: string, h: MockHighlight) => mockHighlightsMap.set(name, h)
		}
	});

	vi.stubGlobal('Highlight', MockHighlight);
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

function createCodeElement(lines: string[]): HTMLElement {
	const code = document.createElement('code');
	for (let i = 0; i < lines.length; i++) {
		const div = document.createElement('div');
		div.setAttribute('data-line', String(i + 1));
		div.textContent = lines[i] || '​';
		code.appendChild(div);
	}
	return code;
}

describe('applyHighlightRangesChunked', () => {
	it('creates ranges for tokens on each line', () => {
		const codeEl = createCodeElement(['const x = 1;', 'let y = 2;']);
		const tokenLines: TokenLine[] = [
			[{ type: 'keyword', start: 0, end: 5 }], // "const"
			[{ type: 'keyword', start: 0, end: 3 }] // "let"
		];

		// Need to inject the style element mock
		const mockStyle = document.createElement('style');
		mockStyle.setAttribute('data-astryx-highlight-styles', '');
		document.head.appendChild(mockStyle);

		const cleanup = applyHighlightRangesChunked(codeEl, tokenLines);

		const kwHighlight = mockHighlightsMap.get('astryx-keyword');
		expect(kwHighlight).toBeDefined();
		expect(kwHighlight!.size).toBe(2);

		cleanup();
		expect(kwHighlight!.size).toBe(0);
	});

	it('handles empty token lines', () => {
		const codeEl = createCodeElement(['', 'const x = 1;']);
		const tokenLines: TokenLine[] = [[], [{ type: 'keyword', start: 0, end: 5 }]];

		const mockStyle = document.createElement('style');
		mockStyle.setAttribute('data-astryx-highlight-styles', '');
		document.head.appendChild(mockStyle);

		const cleanup = applyHighlightRangesChunked(codeEl, tokenLines);

		const kwHighlight = mockHighlightsMap.get('astryx-keyword');
		expect(kwHighlight).toBeDefined();
		expect(kwHighlight!.size).toBe(1);

		cleanup();
	});

	it('returns cleanup that removes all ranges', () => {
		const codeEl = createCodeElement(['const x = 1;']);
		const tokenLines: TokenLine[] = [
			[
				{ type: 'keyword', start: 0, end: 5 },
				{ type: 'number', start: 10, end: 11 }
			]
		];

		const mockStyle = document.createElement('style');
		mockStyle.setAttribute('data-astryx-highlight-styles', '');
		document.head.appendChild(mockStyle);

		const cleanup = applyHighlightRangesChunked(codeEl, tokenLines);

		const kwHighlight = mockHighlightsMap.get('astryx-keyword');
		const numHighlight = mockHighlightsMap.get('astryx-number');
		expect(kwHighlight!.size).toBe(1);
		expect(numHighlight!.size).toBe(1);

		cleanup();
		expect(kwHighlight!.size).toBe(0);
		expect(numHighlight!.size).toBe(0);
	});
});
