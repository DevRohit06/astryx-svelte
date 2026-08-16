import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import HoverCard from './fixtures/hover-card-fixture.svelte';
import HoverCardParagraph from './fixtures/hover-card-paragraph.svelte';

/**
 * The server-side cases from Astryx's `HoverCard/HoverCard.test.tsx`
 * `SSR / hydration` block. They assert on `renderToString` output, so they
 * belong in the node project against `svelte/server` — the same placement
 * `metadata-list.test.ts` uses. The suite's other twenty cases are in
 * `hover-card.svelte.test.ts`, which also carries the block's full accounting.
 *
 * The first two here are ported verbatim. The third is a restatement of
 * upstream's `hydrates a default-open hover card without a mismatch`: only its
 * server half can run in this port — see `hover-card.svelte.test.ts` for why no
 * project can hold both a server build and a client build of the same component
 * — and that half is asserted more strictly than upstream's, by diffing the
 * whole string rather than looking for one attribute in it. Upstream's fourth
 * case, `server markup matches the first client render`, is dropped for the same
 * reason, and is recorded in port/todo.md.
 */
describe('HoverCard — SSR', () => {
	// Regression coverage for the hydration mismatch (#3107). The floating
	// layer used to be portaled into document.body behind a
	// `typeof document !== 'undefined'` gate: the server rendered nothing while
	// the first client render emitted the portal, so the two trees disagreed.
	//
	// The layer is now rendered inline as inline-safe phrasing markup (a
	// `<span popover>`), identically on the server and the client, so there is
	// nothing for hydration to mismatch.

	it('renders the floating layer in server markup (no document gate)', () => {
		const { body } = render(HoverCard);

		// The popover element is present in the server output...
		expect(body).toContain('popover="manual"');
		expect(body).toContain('Card content');
		// ...and it is a <span> (inline-safe), not a <div>.
		expect(body).toMatch(/<span[^>]*popover="manual"/);
	});

	it('keeps the floating layer inline-safe in server markup inside a paragraph', () => {
		const { body } = render(HoverCardParagraph);

		// No <div> is emitted inside the paragraph — the layer and its wrappers
		// are all phrasing content, so the server string is valid <p> markup that
		// the browser parser will not reparent (which would itself desync
		// hydration).
		expect(body).not.toContain('<div');
		expect(body).toMatch(/<span[^>]*popover="manual"/);
	});

	it('keeps a default-open hover card closed in server markup', () => {
		// isDefaultOpen must not leak the open state into SSR markup — the open
		// call happens in an effect after hydration, so the server output is the
		// same closed markup the first client render produces. Upstream reads that
		// as `expect(serverHTML).toContain('popover="manual"')`, which the closed
		// markup satisfies too; the whole-string diff below is the claim itself.
		// Both renders start their own `$props.id()` counter, so the ids agree.
		const { body } = render(HoverCard, { props: { contentText: 'Default open' } });
		const openBody = render(HoverCard, {
			props: { contentText: 'Default open', isDefaultOpen: true }
		}).body;

		expect(openBody).toContain('popover="manual"');
		expect(openBody).toBe(body);
	});
});
