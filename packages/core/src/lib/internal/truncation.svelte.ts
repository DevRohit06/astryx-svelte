import type { Attachment } from 'svelte/attachments';
import { observeResize, unobserveResize } from './shared-resize-observer.js';

/**
 * Overflow detection for clamped text, ported from Astryx's
 * `src/Text/useTruncation.ts`.
 *
 * Upstream returns a ref callback; the Svelte equivalent is an attachment, which
 * gives us the same "run on mount, re-run when the inputs change, clean up on
 * unmount" lifecycle without a ref to thread through. `maxLines` is passed as a
 * getter so reading it inside the attachment registers the dependency — changing
 * `maxLines` re-runs the attachment, which is exactly upstream's `useCallback`
 * dependency list expressed as reactivity.
 *
 * This only ever runs in the browser: attachments do not execute during SSR, so
 * the server renders the untruncated markup and the first client pass measures.
 */
export interface Truncation {
	/** Whether the content currently overflows its clamp. */
	readonly isTruncated: boolean;
	/** The element's full text, for the tooltip or `title` fallback. */
	readonly fullText: string;
	/** Attach to the clamped element with `{@attach truncation.attach}`. */
	readonly attach: Attachment<HTMLElement>;
}

export function createTruncation(maxLines: () => number): Truncation {
	let isTruncated = $state(false);
	let fullText = $state('');

	function check(element: HTMLElement, lines: number): void {
		fullText = element.textContent ?? '';

		if (lines === 1) {
			isTruncated = element.scrollWidth > element.offsetWidth;
			return;
		}

		// With `-webkit-line-clamp` active, browsers may report scrollHeight as the
		// *clamped* height, so the naive scrollHeight > offsetHeight check silently
		// returns false. A Range over the contents measures the real text box.
		let contentHeight = element.scrollHeight;
		try {
			const range = document.createRange();
			range.selectNodeContents(element);
			contentHeight = range.getBoundingClientRect().height;
			range.detach();
		} catch {
			// Fall back to scrollHeight where Range is unavailable.
		}
		isTruncated = contentHeight > element.offsetHeight;
	}

	const attach: Attachment<HTMLElement> = (element) => {
		const lines = maxLines();

		if (lines === 0) {
			isTruncated = false;
			fullText = '';
			return;
		}

		if (typeof ResizeObserver === 'undefined') {
			check(element, lines);
			return;
		}

		// observeResize fires once on registration, so this covers the initial
		// measurement as well as later resizes.
		observeResize(element, () => check(element, lines));
		return () => unobserveResize(element);
	};

	return {
		get isTruncated() {
			return isTruncated;
		},
		get fullText() {
			return fullText;
		},
		attach
	};
}
