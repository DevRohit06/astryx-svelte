import type { Component, Snippet } from 'svelte';
import type { CitationSource } from '../citation/citation.svelte';

/**
 * The non-props types Astryx declares in `Markdown/Markdown.tsx` and publishes
 * from `Markdown/index.ts`.
 *
 * They live in their own module here because `markdown-render-plan.ts` needs
 * `MarkdownInlinePlugin`, and a plain `.ts` importing from a `.svelte` module
 * block is a cycle waiting to happen. `MarkdownProps` stays in
 * `markdown.svelte`'s `<script module>`, as every component's props interface
 * does. The `dropdown-menu-types.ts` precedent.
 */

/**
 * A plugin that transforms text patterns into custom elements inside Markdown.
 * Applied to parsed text nodes only — code blocks, inline code, and other
 * non-prose contexts are unaffected.
 *
 * Follows Lexical's TextMatchTransformer architecture:
 * - `pattern` for initial regex matching
 * - `getEndIndex` for programmatic boundary refinement
 * - `render` for producing the replacement element
 */
export interface MarkdownInlinePlugin {
	/** Regex with global flag. Matched against text nodes only. */
	pattern: RegExp;

	/**
	 * Optional: refine the match boundary after the regex hits.
	 * Return the end index, or false to reject the match.
	 * Default: match.index + match[0].length
	 */
	getEndIndex?: (text: string, match: RegExpMatchArray) => number | false;

	/**
	 * Render the match. Upstream's `(match, key) => ReactNode` becomes a snippet
	 * taking the same two arguments — the shape a Svelte caller can actually
	 * write markup in.
	 */
	render: Snippet<[RegExpMatchArray, string]>;
}

/**
 * A citation source referenced inline in the markdown via `[id]` or `【id】`.
 * When `sources` is provided, bracket content matching a source key is rendered
 * as a compact superscript citation pill instead of plain text.
 */
export type MarkdownSource = CitationSource;

/**
 * Per-node component overrides.
 *
 * `React.ComponentType<P>` becomes `Component<P>`, and every `ReactNode`
 * children position becomes a `Snippet`. The one exception is `inlineCode`,
 * whose children upstream types as a **string** — that stays a string, passed
 * as an explicit `children` prop rather than as component content, because it
 * is the code text itself and a snippet would hide it from the consumer.
 */
export interface MarkdownComponents {
	code?: Component<{ code: string; language?: string }>;
	inlineCode?: Component<{ children: string }>;
	citation?: Component<{
		source: CitationSource;
		number: number;
		variant: 'label' | 'number';
	}>;
	link?: Component<{ href: string; children: Snippet }>;
	heading?: Component<{
		level: 1 | 2 | 3 | 4 | 5 | 6;
		children: Snippet;
	}>;
	paragraph?: Component<{ children: Snippet }>;
	image?: Component<{ src: string; alt: string }>;
	blockquote?: Component<{ children: Snippet }>;
	hr?: Component<Record<string, never>>;
}
