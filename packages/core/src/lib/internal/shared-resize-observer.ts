/**
 * Ported verbatim from Astryx's `src/utils/sharedResizeObserver.ts` — it is pure
 * DOM code with no React in it.
 *
 * A single `ResizeObserver` can watch thousands of elements, and browsers batch
 * delivery per observer instance. One observer per component (per table cell,
 * say) means N callback dispatches per frame instead of one, so every consumer
 * shares this singleton.
 */

type ResizeCallback = (entry: ResizeObserverEntry) => void;

let observer: ResizeObserver | null = null;
const callbacks = new Map<Element, ResizeCallback>();

function getObserver(): ResizeObserver {
	if (!observer) {
		observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				callbacks.get(entry.target)?.(entry);
			}
		});
	}
	return observer;
}

/**
 * Observe an element's size via the shared observer.
 *
 * Fires `callback` once synchronously on registration with a synthetic entry, so
 * callers need no separate initial-measurement path. Pair every call with
 * {@link unobserveResize}.
 */
export function observeResize(element: Element, callback: ResizeCallback): void {
	callbacks.set(element, callback);
	getObserver().observe(element);

	const entry: Partial<ResizeObserverEntry> = { target: element };
	callback(entry as ResizeObserverEntry);
}

/**
 * Stop observing an element. When the last element goes, the observer is
 * disconnected and released rather than left holding the document alive.
 */
export function unobserveResize(element: Element): void {
	callbacks.delete(element);
	if (observer) {
		observer.unobserve(element);
		if (callbacks.size === 0) {
			observer.disconnect();
			observer = null;
		}
	}
}
