import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import HoverCard from './fixtures/hover-card-fixture.svelte';
import HoverCardParagraph from './fixtures/hover-card-paragraph.svelte';

/**
 * The server-side cases from Astryx's `HoverCard/HoverCard.test.tsx`
 * `SSR / hydration` block, at the **0.5.0** pin. They assert on
 * `renderToString` output, so they belong in the node project against
 * `svelte/server` — the same placement `metadata-list.test.ts` uses.
 *
 * The count is the contract, and it is stated against the block rather than the
 * suite: upstream's `SSR / hydration` block declares **4** cases at this pin,
 * and **3** are here. The fourth is dropped with its reason below. Upstream's
 * whole file declares **35** at this pin; the other 24 that are ported live in
 * `hover-card.svelte.test.ts`, which carries the suite-wide accounting —
 * including the seven-case `touch` describe that arrived at 0.5.0 with #5248
 * and is unported.
 *
 * The first two here are ported verbatim. The third is a restatement of
 * upstream's `hydrates a default-open hover card without a mismatch`: only its
 * server half can run in this port — see `hover-card.svelte.test.ts` for why no
 * project can hold both a server build and a client build of the same component
 * — and that half is asserted more strictly than upstream's, by diffing the
 * whole string rather than looking for one attribute in it. Upstream's fourth
 * case, `server markup matches the first client render`, is dropped for the same
 * reason, and is recorded in port/todo.md.
 *
 * **All three were restated at upstream 0.4.2 (#5039)**, which inverted what
 * they assert. The layer used to render inline on both server and client as
 * phrasing markup (`<span popover>`); a context layer now emits *only* an inert
 * `<template>` marker on the server, and resolves its real position — inline or
 * corrected out of an unsafe ancestor — on the client. The hydration-mismatch
 * guarantee (#3107) the block exists for is unchanged and, if anything,
 * stronger: a marker is valid in every position, so there is nothing for the
 * parser to reparent.
 */
describe('HoverCard — SSR', () => {
	it('renders only the inert marker in server markup', () => {
		const { body } = render(HoverCard);

		// No container, and no consumer content, until the client resolves where
		// the layer may live.
		expect(body).not.toContain('popover=');
		expect(body).not.toContain('Card content');
		expect(body).toContain('<template');
	});

	it('emits only a valid marker inside a paragraph', () => {
		const { body } = render(HoverCardParagraph);

		// `<template>` is inert script-supporting content, so the parser has no
		// block layer and no consumer content to reparent out of the `<p>` — which
		// would itself desync hydration.
		expect(body).not.toContain('<div');
		expect(body).not.toContain('popover=');
		expect(body).toContain('<template');
	});

	it('keeps a default-open hover card closed in server markup', () => {
		// isDefaultOpen must not leak the open state into SSR markup — the open
		// call happens in an effect after hydration, so the server output is the
		// same closed markup the first client render produces. The whole-string
		// diff is the claim itself. Both renders start their own `$props.id()`
		// counter, so the ids agree.
		const { body } = render(HoverCard, { props: { contentText: 'Default open' } });
		const openBody = render(HoverCard, {
			props: { contentText: 'Default open', isDefaultOpen: true }
		}).body;

		expect(openBody).toContain('<template');
		expect(openBody).not.toContain('popover=');
		expect(openBody).toBe(body);
	});
});
