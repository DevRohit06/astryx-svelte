import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Probe from './fixtures/command-palette-probe.svelte';
import { createStaticSource } from '$lib/components/typeahead/create-static-source.js';

/**
 * **Beyond upstream, and deliberately so.** This file has no counterpart in
 * Astryx's suite, and none is *possible*: it pins a failure that exists only
 * because of how this port translates `ReactNode`.
 *
 * `CommandPalette.emptySearchText` / `emptyBootstrapText` are `ReactNode`
 * upstream and `string | Snippet` here. The string arm is covered case-for-case
 * by the ported suite (`shows emptyBootstrapText when bootstrap returns
 * nothing`), because every upstream call site passes a plain string. The
 * **snippet arm has no upstream analogue at all** — React has one kind of node,
 * so there is nothing to discriminate and nothing to get wrong.
 *
 * What went wrong here: `CommandPalette` rendered the value as component
 * *content* — `<CommandPaletteEmpty>{emptyBootstrapText}</CommandPaletteEmpty>`
 * — which makes Svelte build a snippet that renders the expression. When the
 * value is itself a `Snippet`, that throws `snippet_without_render_tag`. The
 * fix passes it as the `children` **prop**, which `CommandPaletteEmpty` already
 * discriminates on.
 *
 * Two things make this worth a file rather than a comment:
 *
 * 1. **The ported suite structurally cannot catch it.** All 19 upstream cases
 *    pass strings, so all 19 pass against the broken version.
 * 2. **A production build cannot catch it either.** `snippet_without_render_tag`
 *    is a dev-only Svelte check — the docs site prerendered 165 pages green with
 *    the bug present, and only the dev server surfaced it. That is the same trap
 *    the hydration sweep in TODO.md records, in a second error class.
 *
 * Mutation-checked: restoring the content form fails both cases below.
 */

const emptySource = createStaticSource([]);
const oneItemSource = createStaticSource([{ id: 'home', label: 'Home' }]);

describe('CommandPalette empty text as a snippet', () => {
	it('renders a snippet emptyBootstrapText', async () => {
		const screen = await render(Probe, {
			props: { isOpen: true, searchSource: emptySource, hasSnippetEmptyText: true }
		});
		await expect.element(screen.getByTestId('empty-bootstrap-snippet')).toBeInTheDocument();
	});

	it('renders a snippet emptySearchText', async () => {
		const user = userEvent.setup();
		const screen = await render(Probe, {
			props: { isOpen: true, searchSource: oneItemSource, hasSnippetEmptyText: true }
		});
		// Bootstrap yields one item, so the search arm needs a query that matches
		// nothing — that is the only way to reach `showEmptySearch`.
		await user.fill(screen.getByRole('combobox').element(), 'zzz');
		await expect.element(screen.getByTestId('empty-search-snippet')).toBeInTheDocument();
	});
});
