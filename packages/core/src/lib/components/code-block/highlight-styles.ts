/**
 * Ported verbatim from Astryx's `CodeBlock/highlightStyles.ts`.
 *
 * Deliberately **not** a StyleX module: it hand-writes one `<style>` element
 * into `document.head`, once per page, because `::highlight()` pseudo-element
 * rules and the `:root` token fallbacks have no `stylex.create` expression. The
 * one-shot insert is guarded by a module-level flag, as upstream's is.
 *
 * The `.astryx-codeeditor` half of each rule targets upstream's lab
 * `CodeEditor`, which this port does not ship. Kept verbatim — trimming it would
 * be a divergence, and the selector simply matches nothing here.
 */

import { syntaxTokenDefaults } from '../../theme/syntax/tokens.js';

/**
 * Build the fallback CSS custom properties from the syntax token defaults.
 * These provide colors when no theme explicitly sets --color-syntax-* tokens.
 * Themes override these via higher-specificity [data-astryx-theme] selectors.
 */
const FALLBACK_TOKENS = `:root {\n${Object.entries(syntaxTokenDefaults)
	.map(([name, value]) => `  ${name}: ${value};`)
	.join('\n')}\n}`;

/**
 * Scoped ::highlight() rules — attached to the `code` element so the
 * browser only checks highlight ranges within code content, not the
 * entire document tree. Using `code::highlight()` instead of bare
 * `::highlight()` avoids expensive style recalc on every element.
 */
const HIGHLIGHT_STYLES = `
${FALLBACK_TOKENS}

.astryx-code-block code::highlight(astryx-keyword),
.astryx-codeeditor code::highlight(astryx-keyword) { color: var(--color-syntax-keyword); }
.astryx-code-block code::highlight(astryx-string),
.astryx-codeeditor code::highlight(astryx-string) { color: var(--color-syntax-string); }
.astryx-code-block code::highlight(astryx-comment),
.astryx-codeeditor code::highlight(astryx-comment) { color: var(--color-syntax-comment); }
.astryx-code-block code::highlight(astryx-number),
.astryx-codeeditor code::highlight(astryx-number) { color: var(--color-syntax-number); }
.astryx-code-block code::highlight(astryx-function),
.astryx-codeeditor code::highlight(astryx-function) { color: var(--color-syntax-function); }
.astryx-code-block code::highlight(astryx-type),
.astryx-codeeditor code::highlight(astryx-type) { color: var(--color-syntax-type); }
.astryx-code-block code::highlight(astryx-tag),
.astryx-codeeditor code::highlight(astryx-tag) { color: var(--color-syntax-tag); }
.astryx-code-block code::highlight(astryx-attribute),
.astryx-codeeditor code::highlight(astryx-attribute) { color: var(--color-syntax-attribute); }
.astryx-code-block code::highlight(astryx-property),
.astryx-codeeditor code::highlight(astryx-property) { color: var(--color-syntax-property); }
.astryx-code-block code::highlight(astryx-operator),
.astryx-codeeditor code::highlight(astryx-operator) { color: var(--color-syntax-operator); }
.astryx-code-block code::highlight(astryx-constant),
.astryx-codeeditor code::highlight(astryx-constant) { color: var(--color-syntax-constant); }
.astryx-code-block code::highlight(astryx-punctuation),
.astryx-codeeditor code::highlight(astryx-punctuation) { color: var(--color-syntax-punctuation); }
.astryx-code-block code::highlight(astryx-variable),
.astryx-codeeditor code::highlight(astryx-variable) { color: var(--color-syntax-variable); }

/* Span-based fallback classes — used when highlightMode='spans' or
   when the CSS Custom Highlight API is not available. */
.astryx-token-keyword         { color: var(--color-syntax-keyword); }
.astryx-token-string           { color: var(--color-syntax-string); }
.astryx-token-comment         { color: var(--color-syntax-comment); }
.astryx-token-number           { color: var(--color-syntax-number); }
.astryx-token-function       { color: var(--color-syntax-function); }
.astryx-token-type               { color: var(--color-syntax-type); }
.astryx-token-tag                 { color: var(--color-syntax-tag); }
.astryx-token-attribute     { color: var(--color-syntax-attribute); }
.astryx-token-property       { color: var(--color-syntax-property); }
.astryx-token-operator       { color: var(--color-syntax-operator); }
.astryx-token-constant       { color: var(--color-syntax-constant); }
.astryx-token-punctuation { color: var(--color-syntax-punctuation); }
.astryx-token-variable       { color: var(--color-syntax-variable); }
`;

let inserted = false;

/**
 * Injects the ::highlight() CSS rules into the document <head>.
 * Safe to call multiple times — only injects once.
 */
export function ensureHighlightStyles(): void {
	if (inserted) {
		return;
	}
	if (typeof document === 'undefined') {
		return;
	}

	const style = document.createElement('style');
	style.setAttribute('data-astryx-highlight-styles', '');
	style.textContent = HIGHLIGHT_STYLES;
	document.head.appendChild(style);
	inserted = true;
}

/**
 * Token types that map to highlight names.
 * Used to create CSS.highlights entries with the `astryx-` prefix.
 */
export const TOKEN_TYPES = [
	'keyword',
	'string',
	'comment',
	'number',
	'function',
	'type',
	'tag',
	'attribute',
	'property',
	'operator',
	'constant',
	'punctuation',
	'variable'
] as const;
