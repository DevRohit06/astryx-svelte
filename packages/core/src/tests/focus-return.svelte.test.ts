/** PORTS: utils/focusReturn.test.ts */

import { afterEach, describe, expect, it } from 'vitest';
import { isFocusDetached } from '$lib/utils/focus-return.js';

/**
 * Astryx's `utils/focusReturn.test.ts` (4 cases at the 0.5.0 pin), ported whole
 * — **4 of upstream's 4**, nothing dropped. The count is re-derived at the 0.5.0
 * pin; upstream's file has not moved since v0.4.1.
 *
 * Upstream runs it under its jsdom-backed unit environment, so the file is a
 * plain `.test.ts` there. Here it is a `*.svelte.test.ts` — i.e. the **client**
 * project — because two of the four cases need a real `document`: they focus an
 * element and read `document.activeElement`. This repo's server project is
 * `environment: 'node'` with no DOM at all, so those two would not run there,
 * and splitting one four-case suite across two projects to keep a filename
 * would be worse than moving it. Real Chromium is also a stricter oracle for
 * focus than jsdom, which models `activeElement` by hand.
 *
 * The helper itself takes `doc` as a parameter (defaulting to `document`)
 * precisely so the two synthetic cases below can hand it a stand-in — that
 * signature is upstream's, and these are the cases it exists for.
 */
describe('isFocusDetached', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('is true when focus rests on the body (Escape / empty-space dismiss)', () => {
		// Nothing focused → activeElement is <body>.
		(document.activeElement as HTMLElement | null)?.blur();
		expect(isFocusDetached()).toBe(true);
	});

	it('is false when a real element holds focus (the user moved focus there)', () => {
		const input = document.createElement('input');
		document.body.appendChild(input);
		input.focus();
		expect(document.activeElement).toBe(input);
		expect(isFocusDetached()).toBe(false);
	});

	it('treats the documentElement as detached', () => {
		const doc = {
			activeElement: document.documentElement,
			body: document.body,
			documentElement: document.documentElement
		} as unknown as Document;
		expect(isFocusDetached(doc)).toBe(true);
	});

	it('treats a null activeElement as detached', () => {
		const doc = {
			activeElement: null,
			body: document.body,
			documentElement: document.documentElement
		} as unknown as Document;
		expect(isFocusDetached(doc)).toBe(true);
	});
});
