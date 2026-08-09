import { parseOutlineFromMarkdown } from './parse-outline-from-markdown.js';
import type { OutlineItem } from './types.js';

/**
 * Extract a stable outline from a Markdown string, ported from Astryx's
 * `Outline/useOutlineFromMarkdown.ts`.
 *
 * Upstream is a one-line `useMemo`, and the memo is the whole point: the parse
 * is not cheap and `Outline` re-renders on every scroll tick. `$derived` is the
 * exact counterpart, so the hook stays one line here too — it takes the
 * markdown as a **getter** (the port's convention, and what gives the derived
 * something to track) and returns the live array as `items`, the shape
 * `useOutlineFromDOM` already established.
 */
export interface OutlineFromMarkdownState {
	/** The extracted headings, in document order. */
	readonly items: OutlineItem[];
}

/** Extract a stable outline from a Markdown string. */
export function useOutlineFromMarkdown(markdown: () => string): OutlineFromMarkdownState {
	const items = $derived(parseOutlineFromMarkdown(markdown()));

	return {
		get items() {
			return items;
		}
	};
}
