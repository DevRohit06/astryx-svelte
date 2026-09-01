/** PORTS: Blockquote/Blockquote.test.tsx */

import { describe, expect, it, vi } from 'vitest';
import { createAttachmentKey } from 'svelte/attachments';
import { render } from 'vitest-browser-svelte';
import Blockquote from '$lib/components/blockquote/blockquote.svelte';
import TextChildProbe from './fixtures/text-child-probe.svelte';

/**
 * Astryx's `Blockquote/Blockquote.test.tsx` at the **0.5.0** pin, ported case
 * for case.
 *
 * The count is the contract: upstream declares **11** blocks producing **12
 * cases** at this pin — 10 `it`s plus one `it.each` with two rows — and **8**
 * are here. Upstream has no `displayName` case, no snapshot and no no-JSX
 * construction form, so none of those standing drops applies.
 *
 * **The 3 blocks (4 cases) that are not here all arrived at 0.5.0**:
 *
 * - **`never wraps the attribution in a landmark element`** — the guard that
 *   the `cite` attribution is not emitted as a `<section>`/`<aside>`/etc., so
 *   it adds no landmark to the accessibility tree.
 * - **The two-row `it.each`, `renders no cite element when cite is %s`** —
 *   `false` and the empty string, i.e. the `cond && <node>` shapes that must
 *   not produce an empty `<cite>`.
 * - **`renders on the server`** — a `renderToString` case. By this repo's
 *   filename rule it cannot live in this file at all: a server render belongs
 *   in the node project, so porting it means a `blockquote.test.ts` beside this
 *   one, the arrangement `media-query.test.ts` and `hover-card.test.ts` already
 *   use.
 *
 * (This header read "upstream declares **8** `it` blocks at this pin, and **8**
 * are here. **Nothing is dropped.**" at the v0.4.5 pin, where 8 was the whole
 * suite and there was no `it.each`.)
 *
 * Two things are restated, and neither is a dropped case:
 *
 * - **`forwards ref correctly` is the attachment counterpart.** Svelte has no
 *   `ref` prop; `Blockquote` rest-spreads onto its root `<blockquote>`, so an
 *   attachment passed through the rest props reaches the element upstream's
 *   `ref` receives. It checks more than upstream's does — upstream only proves
 *   the callback ran with *an* `HTMLElement`, this also pins *which* element.
 * - **`children` and `cite` are snippets**, and a snippet can only be authored
 *   in a template, so `text-child-probe.svelte` supplies them. It puts the text
 *   child directly on the `<blockquote>` (no wrapping `<span>`), which is what
 *   the `tagName` and `toHaveTextContent` assertions read, and fills `cite` with
 *   either bare text (upstream's `cite="Steve Jobs"`) or a `<span data-testid>`
 *   (upstream's `cite={<span …>}`), which is the "renders cite as ReactNode"
 *   case's whole subject. `ReactNode` in a title therefore stands for "a
 *   snippet"; the assertions are unchanged.
 */

/** What the probe renders into `children` and, for the cite cases, into `cite`. */
type Content = {
	text?: string;
	childTestid?: string;
	slot?: string;
	slotText?: string;
	slotTestid?: string;
};

/** `Blockquote` behind the probe, with the case's own props. */
const quote = (rest: Record<string | symbol, unknown>, content: Content = {}) => ({
	component: Blockquote,
	rest,
	...content
});

describe('Blockquote', () => {
	it('renders children in a blockquote element', async () => {
		const screen = await render(TextChildProbe, {
			props: quote({ 'data-testid': 'bq' }, { text: 'A quoted statement.' })
		});
		const element = screen.getByTestId('bq');
		await expect.element(element).toBeInTheDocument();
		expect(element.element().tagName).toBe('BLOCKQUOTE');
		await expect.element(element).toHaveTextContent('A quoted statement.');
	});

	it('renders astryx-* class name for theme targeting', async () => {
		const screen = await render(TextChildProbe, {
			props: quote({ 'data-testid': 'bq' }, { text: 'Quote' })
		});
		const element = screen.getByTestId('bq').element();
		expect(element.className).toContain('astryx-blockquote');
	});

	it('renders without cite by default', async () => {
		const screen = await render(TextChildProbe, {
			props: quote({ 'data-testid': 'bq' }, { text: 'Quote' })
		});
		const element = screen.getByTestId('bq').element();
		expect(element.querySelector('footer')).toBeNull();
		expect(element.querySelector('cite')).toBeNull();
	});

	it('renders cite when provided', async () => {
		const screen = await render(TextChildProbe, {
			props: quote(
				{ 'data-testid': 'bq' },
				{
					text: 'Design is not just what it looks like.',
					slot: 'cite',
					slotText: 'Steve Jobs'
				}
			)
		});
		const element = screen.getByTestId('bq').element();
		const footer = element.querySelector('footer');
		expect(footer).toBeInTheDocument();
		const cite = element.querySelector('cite');
		expect(cite).toBeInTheDocument();
		expect(cite).toHaveTextContent('Steve Jobs');
	});

	it('renders cite as ReactNode', async () => {
		const screen = await render(TextChildProbe, {
			props: quote(
				{ 'data-testid': 'bq' },
				{
					text: 'Quote',
					slot: 'cite',
					slotText: 'Custom attribution',
					slotTestid: 'custom-cite'
				}
			)
		});
		await expect.element(screen.getByTestId('custom-cite')).toBeInTheDocument();
		await expect.element(screen.getByTestId('custom-cite')).toHaveTextContent('Custom attribution');
	});

	it('forwards ref correctly', async () => {
		// The attachment counterpart to upstream's `ref` — see the header.
		const ref = vi.fn();
		const screen = await render(TextChildProbe, {
			props: quote({ [createAttachmentKey()]: (node: Element) => ref(node) }, { text: 'Quote' })
		});
		expect(ref).toHaveBeenCalledWith(expect.any(HTMLElement));
		expect(ref).toHaveBeenCalledWith(screen.container.firstElementChild);
	});

	it('passes through additional props', async () => {
		const screen = await render(TextChildProbe, {
			props: quote({ 'data-testid': 'bq', 'aria-label': 'Important quote' }, { text: 'Quote' })
		});
		const element = screen.getByTestId('bq');
		await expect.element(element).toHaveAttribute('aria-label', 'Important quote');
	});

	it('renders ReactNode children', async () => {
		const screen = await render(TextChildProbe, {
			props: quote(
				{ 'data-testid': 'bq' },
				{ text: 'Paragraph inside blockquote', childTestid: 'child-p' }
			)
		});
		await expect.element(screen.getByTestId('child-p')).toBeInTheDocument();
	});
});
