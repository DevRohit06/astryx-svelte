/** PORTS: hooks/scrollbarGutter.test.ts */

import { afterEach, describe, expect, it } from 'vitest';
import { holdScrollbarGutter } from '$lib/hooks/scrollbar-gutter.js';

/**
 * Astryx's `hooks/scrollbarGutter.test.ts`, ported whole — **8 of upstream's 8**
 * at the 0.5.0 pin, in upstream's order and with its titles and assertions
 * verbatim. Nothing is dropped.
 *
 * Both the module and the suite are new at 0.5.0, and both are what closes a
 * gap that was a *hook* gap rather than only a test gap: this port's scroll
 * lock hid the scrollbar and let the page jump sideways by its width.
 *
 * ## Why this is a `.svelte.test.ts` and not a `.test.ts`
 *
 * There is no rune in the module — it is a plain `.ts` helper with no state and
 * no effect — but every case here needs a `document`. The server project runs
 * in node, where `typeof document === 'undefined'` sends `holdScrollbarGutter`
 * straight down its own no-DOM early return, and all eight cases would assert
 * on a NOOP and go green having exercised nothing. The client project has a
 * real Chromium, which is where the module actually runs.
 *
 * ## Upstream's stubs, kept — and why they are still needed in a real browser
 *
 * Upstream stubs both halves of the measurement because jsdom does no layout:
 * the viewport (`innerWidth` vs `documentElement.clientWidth`) and the
 * element's own box. Chromium *does* do layout, so the stubs stop being a
 * substitute for a missing engine and become something better — the only way
 * to state the case. `window.innerWidth > root.clientWidth` is the module's
 * classic-vs-overlay-scrollbar test, and whether the machine running the suite
 * has a classic scrollbar is not something a test may depend on: pinning the
 * pair is what makes "a 15px classic scrollbar" and "an overlay scrollbar"
 * *inputs* rather than accidents of the CI image. The `widths` stub is the same
 * argument for the element box, and it is what lets the padding fallback be
 * driven directly — the branch a browser with `scrollbar-gutter` support never
 * takes on its own.
 *
 * `window.innerWidth` is restored in `afterEach` alongside upstream's two
 * deletes. Upstream leaves it pinned because jsdom rebuilds the window per
 * file; here the window is the test iframe's and outlives every case in the
 * file, so putting it back is hygiene rather than a departure — no assertion
 * depends on it.
 */

function stub({
	innerWidth,
	clientWidth,
	widths
}: {
	innerWidth: number;
	clientWidth: number;
	widths?: () => number;
}) {
	Object.defineProperty(window, 'innerWidth', {
		value: innerWidth,
		configurable: true,
		writable: true
	});
	Object.defineProperty(document.documentElement, 'clientWidth', {
		value: clientWidth,
		configurable: true
	});
	if (widths) {
		document.body.getBoundingClientRect = () => ({ width: widths() }) as DOMRect;
	}
}

const rootGutter = () => document.documentElement.style.scrollbarGutter;

describe('holdScrollbarGutter', () => {
	afterEach(() => {
		document.body.style.cssText = '';
		document.documentElement.style.cssText = '';
		// @ts-expect-error -- drop the stub so the browser's own value comes back
		delete document.documentElement.clientWidth;
		// @ts-expect-error -- restore the prototype's implementation
		delete document.body.getBoundingClientRect;
		// @ts-expect-error -- see the header: the iframe's window outlives the case
		delete window.innerWidth;
	});

	it('holds the gutter open when a space-taking scrollbar is about to be hidden', () => {
		// A 1024px window over a 1009px layout viewport = a 15px classic scrollbar.
		stub({ innerWidth: 1024, clientWidth: 1009 });

		const hold = holdScrollbarGutter(document.body);

		expect(rootGutter()).toBe('stable');

		hold.settle();
		hold.release();

		expect(rootGutter()).toBe('');
	});

	it('leaves an overlay scrollbar alone — there is no gutter to hold', () => {
		stub({ innerWidth: 1024, clientWidth: 1024 });

		const hold = holdScrollbarGutter(document.body);
		hold.settle();

		expect(rootGutter()).toBe('');
		expect(document.body.style.paddingRight).toBe('');

		hold.release();
	});

	it('does not pad when holding the gutter kept the element still', () => {
		stub({ innerWidth: 1024, clientWidth: 1009, widths: () => 1009 });

		const hold = holdScrollbarGutter(document.body);
		hold.settle();

		expect(rootGutter()).toBe('stable');
		expect(document.body.style.paddingRight).toBe('');

		hold.release();
	});

	it('falls back to padding when the element grew anyway', () => {
		// What an engine without scrollbar-gutter support does: the gutter request
		// is ignored, the scrollbar goes away, and the element widens by 15px.
		let width = 1009;
		stub({ innerWidth: 1024, clientWidth: 1009, widths: () => width });

		const hold = holdScrollbarGutter(document.body);
		width = 1024;
		hold.settle();

		expect(document.body.style.paddingRight).toBe('15px');

		hold.release();

		expect(document.body.style.paddingRight).toBe('');
	});

	it("adds to the page's own padding instead of replacing it", () => {
		let width = 1009;
		stub({ innerWidth: 1024, clientWidth: 1009, widths: () => width });
		document.body.style.paddingRight = '24px';

		const hold = holdScrollbarGutter(document.body);
		width = 1024;
		hold.settle();

		expect(document.body.style.paddingRight).toBe('39px');

		hold.release();

		expect(document.body.style.paddingRight).toBe('24px');
	});

	it('restores the page’s own scrollbar-gutter rather than clearing it', () => {
		stub({ innerWidth: 1024, clientWidth: 1009 });
		document.documentElement.style.scrollbarGutter = 'stable both-edges';

		const hold = holdScrollbarGutter(document.body);

		expect(rootGutter()).toBe('stable');

		hold.settle();
		hold.release();

		expect(rootGutter()).toBe('stable both-edges');
	});

	it('settles once, however many times it is called', () => {
		let width = 1009;
		stub({ innerWidth: 1024, clientWidth: 1009, widths: () => width });

		const hold = holdScrollbarGutter(document.body);
		width = 1024;
		hold.settle();
		hold.settle();
		hold.settle();

		expect(document.body.style.paddingRight).toBe('15px');

		hold.release();
	});

	it('does nothing where there is no layout to measure', () => {
		stub({ innerWidth: 1024, clientWidth: 0 });

		const hold = holdScrollbarGutter(document.body);
		hold.settle();

		expect(rootGutter()).toBe('');
		expect(document.body.style.paddingRight).toBe('');

		hold.release();
	});
});
