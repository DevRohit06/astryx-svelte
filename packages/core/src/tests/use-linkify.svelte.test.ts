/** PORTS: Link/useLinkify.test.tsx */

import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { LinkifySegment, UseLinkifyOptions } from '$lib/components/link/use-linkify.js';
import Renderer from './fixtures/use-linkify-renderer.svelte';

/**
 * Ported from Astryx's `Link/useLinkify.test.tsx`, all 13 cases at the 0.5.0 pin.
 *
 * Upstream's `useLinkify` returns `ReactNode[]` — strings interleaved with
 * rendered `<Link>` elements. Ours returns structured `LinkifySegment[]` (a
 * `{ type: 'text' } | { type: 'link' }` union) that the caller renders, because
 * a Svelte function cannot emit markup. That return-shape change is a single
 * deliberate divergence, so every case asserting on the array is RESTATED to the
 * segment shape: upstream's `toEqual(['Hello world'])` becomes
 * `toEqual([{ type: 'text', text: 'Hello world' }])`, and `result[0] === 'Visit '`
 * becomes `result[0]` deep-equal to `{ type: 'text', text: 'Visit ' }`.
 *
 * The five cases that assert on `container.querySelector('a')` are unchanged in
 * substance: the probe renders the segments (link segments through `<Link>`), so
 * a real `<a>` exists to query. `result.current` is the probe's instance export,
 * read via `render(...).component.result`.
 *
 * The three `textContent` assertions `.trim()` the result: `Link`'s markup keeps
 * a whitespace text node between the label `<Text>` and its `{#if isExternalLink}`
 * external-icon block, which JSX strips but Svelte preserves. That whitespace is
 * an artifact of the `Link` component, not of `useLinkify` — the label segment
 * itself is exactly `'T1234'` / `'Diff 5678'` — so trimming it keeps the
 * assertion checking the label the hook produced, which is the case's point.
 */

const linkify = async (text: string, options?: UseLinkifyOptions) => {
	const screen = await render(Renderer, { props: { text, options } });
	return { result: screen.component.result as LinkifySegment[], screen };
};

const text = (t: string): LinkifySegment => ({ type: 'text', text: t });

describe('useLinkify', () => {
	// RESTATED: `toEqual(['Hello world'])` → the single text segment.
	it('returns plain text when no links are found', async () => {
		const { result } = await linkify('Hello world');
		expect(result).toEqual([text('Hello world')]);
	});

	// RESTATED: `toEqual([''])` → a single empty text segment.
	it('returns plain text for empty string', async () => {
		const { result } = await linkify('');
		expect(result).toEqual([text('')]);
	});

	// RESTATED: index assertions read the segment shape rather than a raw string.
	it('detects URLs', async () => {
		const { result } = await linkify('Visit https://example.com today');
		expect(result).toHaveLength(3);
		expect(result[0]).toEqual(text('Visit '));
		expect(result[2]).toEqual(text(' today'));
	});

	it('renders URLs as Link elements', async () => {
		const { screen } = await linkify('Visit https://example.com');
		const link = screen.container.querySelector('a');
		expect(link?.getAttribute('href')).toBe('https://example.com');
	});

	// RESTATED: index assertions read the segment shape.
	it('detects email addresses', async () => {
		const { result } = await linkify('Email hi@example.com for info');
		expect(result).toHaveLength(3);
		expect(result[0]).toEqual(text('Email '));
		expect(result[2]).toEqual(text(' for info'));
	});

	it('renders email links with mailto:', async () => {
		const { screen } = await linkify('Email hi@example.com');
		const link = screen.container.querySelector('a');
		expect(link?.getAttribute('href')).toBe('mailto:hi@example.com');
	});

	// RESTATED: index assertions read the segment shape.
	it('detects multiple links in one string', async () => {
		const { result } = await linkify('Go to https://a.com and https://b.com now');
		expect(result).toHaveLength(5);
		expect(result[0]).toEqual(text('Go to '));
		expect(result[2]).toEqual(text(' and '));
		expect(result[4]).toEqual(text(' now'));
	});

	// RESTATED (length/index) + unchanged DOM assertions.
	it('supports custom patterns', async () => {
		const { result, screen } = await linkify('Check T1234 for details', {
			patterns: [
				{
					pattern: /\bT(\d+)\b/g,
					href: (m) => `https://tasks.example.com/${m[1]}`
				}
			]
		});
		expect(result).toHaveLength(3);
		expect(result[0]).toEqual(text('Check '));
		expect(result[2]).toEqual(text(' for details'));

		const link = screen.container.querySelector('a');
		expect(link?.getAttribute('href')).toBe('https://tasks.example.com/1234');
		expect(link?.textContent?.trim()).toBe('T1234');
	});

	it('custom patterns take priority over builtins', async () => {
		const { screen } = await linkify('See https://example.com/T1234', {
			patterns: [
				{
					pattern: /https:\/\/example\.com\/T(\d+)/g,
					href: (m) => `https://tasks.example.com/${m[1]}`,
					label: (m) => `T${m[1]}`
				}
			]
		});
		const link = screen.container.querySelector('a');
		expect(link?.textContent?.trim()).toBe('T1234');
		expect(link?.getAttribute('href')).toBe('https://tasks.example.com/1234');
	});

	it('supports custom label function', async () => {
		const { screen } = await linkify('See D5678 here', {
			patterns: [
				{
					pattern: /\bD(\d+)\b/g,
					href: (m) => `https://phabricator.example.com/${m[0]}`,
					label: (m) => `Diff ${m[1]}`
				}
			]
		});
		const link = screen.container.querySelector('a');
		expect(link?.textContent?.trim()).toBe('Diff 5678');
	});

	// RESTATED: `toEqual(['Visit https://example.com'])` → the single text segment.
	it('can disable builtins', async () => {
		const { result } = await linkify('Visit https://example.com', { hasBuiltins: false });
		expect(result).toEqual([text('Visit https://example.com')]);
	});

	// RESTATED: `result[1] === ' is cool'` → the trailing text segment.
	it('handles text that starts with a link', async () => {
		const { result } = await linkify('https://example.com is cool');
		expect(result).toHaveLength(2);
		expect(result[1]).toEqual(text(' is cool'));
	});

	// RESTATED: `result[0] === 'Visit '` → the leading text segment.
	it('handles text that ends with a link', async () => {
		const { result } = await linkify('Visit https://example.com');
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual(text('Visit '));
	});
});
