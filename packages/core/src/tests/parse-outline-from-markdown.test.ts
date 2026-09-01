/** PORTS: Outline/parseOutlineFromMarkdown.test.ts */

import { describe, expect, it } from 'vitest';
import { parseOutlineFromMarkdown } from '$lib/components/outline/parse-outline-from-markdown.js';

/**
 * Astryx's `Outline/parseOutlineFromMarkdown.test.ts`, ported case for case.
 *
 * Upstream has **12** `it` cases in one describe at the **0.5.0** pin. All 12 are here, with their
 * assertions unchanged — the helper is pure and transcribed from upstream line
 * for line, so there is nothing to translate. Nothing is dropped.
 *
 * No DOM and no runes, so this is a plain `.test.ts` and runs in the **server**
 * project; a `.svelte.test.ts` would boot Chromium for nothing.
 *
 * Upstream has **no suite for `useOutlineFromMarkdown`** — it is a one-line
 * `useMemo` over this helper, and our port is the same one line over `$derived`.
 * Nothing is invented for it here; the only thing a Svelte-side case could add
 * is that the `$derived` recomputes, which is a Svelte guarantee rather than a
 * port behaviour.
 */

describe('parseOutlineFromMarkdown', () => {
	it('returns an empty outline for content with no headings', () => {
		expect(parseOutlineFromMarkdown('just a paragraph of text')).toEqual([]);
		expect(parseOutlineFromMarkdown('')).toEqual([]);
	});

	it('extracts headings with their level and slugified id', () => {
		const outline = parseOutlineFromMarkdown('# Getting Started');
		expect(outline).toEqual([{ id: 'getting-started', label: 'Getting Started', level: 1 }]);
	});

	it('captures heading levels distinctly', () => {
		const outline = parseOutlineFromMarkdown(['# One', '## Two', '### Three'].join('\n\n'));
		expect(outline.map((i) => i.level)).toEqual([1, 2, 3]);
		expect(outline.map((i) => i.label)).toEqual(['One', 'Two', 'Three']);
	});

	it('slugifies punctuation and spaces into single hyphens', () => {
		const outline = parseOutlineFromMarkdown('# Hello, World!  Again');
		expect(outline[0].id).toBe('hello-world-again');
	});

	it('strips quotes rather than converting them to hyphens', () => {
		const outline = parseOutlineFromMarkdown(`# The "Best" Way`);
		expect(outline[0].id).toBe('the-best-way');
	});

	it('trims leading and trailing hyphens from the slug', () => {
		const outline = parseOutlineFromMarkdown('# ...leading and trailing...');
		expect(outline[0].id).not.toMatch(/^-/);
		expect(outline[0].id).not.toMatch(/-$/);
	});

	it('deduplicates repeated slugs with a numeric suffix', () => {
		const outline = parseOutlineFromMarkdown(['# Setup', '# Setup', '# Setup'].join('\n\n'));
		expect(outline.map((i) => i.id)).toEqual(['setup', 'setup-1', 'setup-2']);
		// labels stay unchanged even as ids are disambiguated
		expect(outline.every((i) => i.label === 'Setup')).toBe(true);
	});

	it('falls back to "section" when a heading slugifies to empty', () => {
		const outline = parseOutlineFromMarkdown(['# !!!', '# @@@'].join('\n\n'));
		expect(outline.map((i) => i.id)).toEqual(['section', 'section-1']);
	});

	it('flattens inline formatting into the label text', () => {
		const outline = parseOutlineFromMarkdown('# **Bold** and _italic_ text');
		expect(outline[0].label).toBe('Bold and italic text');
		expect(outline[0].id).toBe('bold-and-italic-text');
	});

	it('includes inline code content in the label', () => {
		const outline = parseOutlineFromMarkdown('# The `useState` hook');
		expect(outline[0].label).toBe('The useState hook');
	});

	it('does not treat fenced code block content as headings', () => {
		const md = ['# Real Heading', '', '```', '# not a heading', '```'].join('\n');
		const outline = parseOutlineFromMarkdown(md);
		expect(outline.map((i) => i.label)).toEqual(['Real Heading']);
	});

	it('trims surrounding whitespace from labels', () => {
		const outline = parseOutlineFromMarkdown('#    Spaced Out   ');
		expect(outline[0].label).toBe('Spaced Out');
	});
});
