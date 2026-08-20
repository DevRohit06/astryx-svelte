import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Citation, { type CitationSource } from '$lib/components/citation/citation.svelte';
import CitationIconProbe from './fixtures/citation-icon-probe.svelte';
import { atomicClasses } from './fixtures/citation-probe.stylex.js';

/**
 * Ported from Astryx 0.2.0's `Citation/Citation.test.tsx`, all 16 cases, in
 * upstream's order and with upstream's titles.
 *
 * **Nothing is dropped.** Upstream's suite has no `displayName` case, no `ref`
 * case, no no-JSX construction form and no snapshot, so the four standing
 * reasons to drop a case do not arise here — 16 upstream cases, 16 here.
 *
 * Two things are worth knowing about how it is written:
 *
 * - **The atomic-class probe is upstream's, kept.** `citation-probe.stylex.ts`
 *   holds the four `stylex.create` styles upstream declares inline; StyleX may
 *   only be imported from a `.ts`/`.stylex.ts` module here, so they moved to a
 *   fixture rather than changing shape. Cases 1–7 previously lived in
 *   `nav-icon.svelte.test.ts` in a *restated* form that read computed colours out
 *   of the browser instead; they move here and go back to upstream's assertion,
 *   because upstream's assertion is the specification and the port's job is to
 *   answer it.
 * - **The node-icon cases need a fixture.** `icon` is a `ReactNode` upstream and
 *   therefore a `Snippet` here, and a snippet can only be authored in a
 *   template — so `citation-icon-probe.svelte` builds the `source` object.
 *
 * Runs in the **client** (real Chromium) project: the probe compares against
 * classes the StyleX plugin emitted for this page.
 */

describe('Citation', () => {
	const source = { title: 'Example Source', url: 'https://example.com' };

	it('renders the source title as a link in the label variant', async () => {
		const screen = await render(Citation, {
			props: { source, number: 1, 'data-testid': 'citation' }
		});
		const el = screen.getByTestId('citation').element();
		expect(el.tagName).toBe('A');
		expect(el).toHaveAttribute('href', 'https://example.com');
		expect(el).toHaveTextContent('Example Source');
	});

	it('renders the index as a badge in the number variant', async () => {
		const screen = await render(Citation, {
			props: { source, number: 3, variant: 'number', 'data-testid': 'citation' }
		});
		const el = screen.getByTestId('citation').element();
		expect(el).toHaveTextContent('3');
		expect(el).toHaveAttribute('role', 'doc-noteref');
		expect(el).toHaveAttribute('aria-label', 'Citation 3: Example Source');
	});

	it('renders as a span when the source has no url', async () => {
		const screen = await render(Citation, {
			props: { source: { title: 'No link' }, number: 1, 'data-testid': 'citation' }
		});
		const el = screen.getByTestId('citation').element();
		expect(el.tagName).toBe('SPAN');
		// doc-noteref is a reference role that is not permitted on a plain
		// (unlinked) span (axe: aria-allowed-role), so it must be omitted here.
		expect(el).not.toHaveAttribute('role');
	});

	it('renders astryx-* class names for theme targeting', async () => {
		const screen = await render(Citation, {
			props: { source, number: 1, 'data-testid': 'citation' }
		});
		expect(screen.getByTestId('citation').element().className).toContain('astryx-citation');
	});

	it('uses the secondary text color in the label variant', async () => {
		const screen = await render(Citation, {
			props: { source, number: 1, 'data-testid': 'citation' }
		});
		const el = screen.getByTestId('citation').element();
		for (const cls of atomicClasses('secondaryText')) {
			expect(el.classList.contains(cls)).toBe(true);
		}
	});

	it('uses the secondary text color, not accent, in the number variant', async () => {
		const screen = await render(Citation, {
			props: { source, number: 1, variant: 'number', 'data-testid': 'citation' }
		});
		const el = screen.getByTestId('citation').element();
		for (const cls of atomicClasses('secondaryText')) {
			expect(el.classList.contains(cls)).toBe(true);
		}
		for (const cls of atomicClasses('accentText')) {
			expect(el.classList.contains(cls)).toBe(false);
		}
	});

	it('keeps the accent-muted badge background when the source has a url', async () => {
		// `numberHover` must not clobber the base background: a hover-only
		// conditional without a default replaces the whole property on merge,
		// leaving linked badges with a transparent pill.
		const screen = await render(Citation, {
			props: { source, number: 1, variant: 'number', 'data-testid': 'citation' }
		});
		const el = screen.getByTestId('citation').element();
		for (const cls of atomicClasses('badgeBackground')) {
			expect(el.classList.contains(cls)).toBe(true);
		}
	});

	// The interactive (pointer) treatment is keyed on `source.url`: a citation
	// with no url is non-interactive and must keep the default cursor.
	const noUrlSource = { title: 'No link' };

	it('does not use the pointer cursor without a url in the label variant', async () => {
		const screen = await render(Citation, {
			props: { source: noUrlSource, number: 1, 'data-testid': 'citation' }
		});
		const el = screen.getByTestId('citation').element();
		for (const cls of atomicClasses('pointerCursor')) {
			expect(el.classList.contains(cls)).toBe(false);
		}
	});

	it('uses the pointer cursor with a url in the label variant', async () => {
		const screen = await render(Citation, {
			props: { source, number: 1, 'data-testid': 'citation' }
		});
		const el = screen.getByTestId('citation').element();
		for (const cls of atomicClasses('pointerCursor')) {
			expect(el.classList.contains(cls)).toBe(true);
		}
	});

	it('does not use the pointer cursor without a url in the number variant', async () => {
		const screen = await render(Citation, {
			props: { source: noUrlSource, number: 1, variant: 'number', 'data-testid': 'citation' }
		});
		const el = screen.getByTestId('citation').element();
		for (const cls of atomicClasses('pointerCursor')) {
			expect(el.classList.contains(cls)).toBe(false);
		}
	});

	it('uses the pointer cursor with a url in the number variant', async () => {
		const screen = await render(Citation, {
			props: { source, number: 1, variant: 'number', 'data-testid': 'citation' }
		});
		const el = screen.getByTestId('citation').element();
		for (const cls of atomicClasses('pointerCursor')) {
			expect(el.classList.contains(cls)).toBe(true);
		}
	});

	// --- Source icon: image URL (back-compat) vs node --------------------------

	it('renders a legacy string icon as a decorative image (back-compat)', async () => {
		// Existing callers pass a favicon URL to `source.icon`. A bare string must
		// still render as <img src>, unchanged from the original behavior.
		const screen = await render(Citation, {
			props: {
				source: {
					title: 'GitHub',
					url: 'https://github.com',
					icon: 'https://example.com/favicon.png'
				},
				number: 1,
				'data-testid': 'citation'
			}
		});
		const container = screen.container;
		const img = container.querySelector('img');
		expect(img).not.toBeNull();
		expect(img).toHaveAttribute('src', 'https://example.com/favicon.png');
		// Decorative: empty alt, and the wrapper is aria-hidden.
		expect(img).toHaveAttribute('alt', '');
		expect(container.querySelector('[aria-hidden="true"] img')).toBe(img);
	});

	it('renders source.src as a decorative image', async () => {
		const screen = await render(Citation, {
			props: {
				// `src` is upstream 0.2.0's image field. The port's `CitationSource`
				// does not declare it, so the cast is what lets the case be asked.
				source: {
					title: 'GitHub',
					url: 'https://github.com',
					src: 'https://example.com/logo.png'
				} as unknown as CitationSource,
				number: 1,
				'data-testid': 'citation'
			}
		});
		const img = screen.container.querySelector('img');
		expect(img).toHaveAttribute('src', 'https://example.com/logo.png');
		expect(img).toHaveAttribute('alt', '');
	});

	// Upstream's title says "ReactNode"; the node is a snippet here, handed in by
	// `citation-icon-probe.svelte`. The assertion is unchanged.
	it('renders a ReactNode icon as-is (not an <img>)', async () => {
		const screen = await render(CitationIconProbe, {
			props: { title: 'GitHub', url: 'https://github.com', number: 1 }
		});
		// The node renders directly; no <img> is produced for a node icon.
		expect(screen.container.querySelector('img')).toBeNull();
		expect(screen.container.querySelector('[data-testid="custom-icon"]')).not.toBeNull();
		// Still decorative — wrapped in an aria-hidden container.
		expect(
			screen.container.querySelector('[aria-hidden="true"] [data-testid="custom-icon"]')
		).not.toBeNull();
	});

	it('prefers a node icon over src when both are provided', async () => {
		const screen = await render(CitationIconProbe, {
			props: {
				title: 'GitHub',
				url: 'https://github.com',
				src: 'https://example.com/logo.png',
				number: 1
			}
		});
		expect(screen.container.querySelector('[data-testid="custom-icon"]')).not.toBeNull();
		expect(screen.container.querySelector('img')).toBeNull();
	});

	it('keeps aria-label as the sole accessible name when an icon is present', async () => {
		const screen = await render(Citation, {
			props: {
				source: {
					title: 'GitHub',
					url: 'https://github.com',
					icon: 'https://example.com/favicon.png'
				},
				number: 2,
				'data-testid': 'citation'
			}
		});
		const el = screen.getByTestId('citation').element();
		expect(el).toHaveAttribute('aria-label', 'Citation 2: GitHub');
	});
});
