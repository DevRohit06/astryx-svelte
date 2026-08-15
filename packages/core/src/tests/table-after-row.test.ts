import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import AfterRowFixture from './fixtures/table-after-row-fixture.svelte';

/**
 * `BodyRowRenderProps.afterRow` — the pipeline member `useTableRowExpansion`
 * hangs its detail panel on (upstream `Table/types.ts:293-298`,
 * `BaseTable.tsx:246-255`).
 *
 * **No upstream counterpart, and the reason is the hazard.** Upstream returns
 * `<>{row}{afterRow}</>` from its row renderer, so "sibling" is the only thing
 * the expression can mean and nothing about it is worth asserting. In Svelte the
 * row is a `<TableRow>` *component* with a children snippet, so the obvious
 * placement for `{@render afterRow()}` is inside it — and a `<tr>` nested in a
 * `<tr>` is not a parse error. The HTML parser silently reparents it out of the
 * row, so the page looks nearly right, the expansion suite's `colspan`
 * assertion still passes, and only the row *count* and the panel's position
 * give it away. That is a Svelte-specific structural failure React cannot
 * reproduce, which is the bar `CLAUDE.md` sets for a test beyond upstream's.
 *
 * Placed in the node project against `svelte/server` — the placement
 * `batch-5-server-markup.test.ts` uses — because the question is purely about
 * emitted structure and the string answers it directly.
 *
 * Mutation-checked: moving the `{@render rowProps.afterRow()}` inside
 * `<TableRow>` in `base-table.svelte` fails the second case (the panel's `<tr>`
 * opens while the preceding row is still open).
 */

/** Everything the fixture emitted before the panel row's own `<tr`. */
function markupBeforePanel(body: string): string {
	const panelIndex = body.indexOf('data-testid="after-row"');
	expect(panelIndex).toBeGreaterThan(-1);
	return body.slice(0, body.lastIndexOf('<tr', panelIndex));
}

describe('BodyRowRenderProps.afterRow — SSR', () => {
	it('renders the plugin-supplied row once per body row', () => {
		const { body } = render(AfterRowFixture);
		const matches = body.match(/data-testid="after-row"/g) ?? [];
		expect(matches.length).toBe(2);
	});

	it('renders it as a sibling of the row, not nested inside it', () => {
		const { body } = render(AfterRowFixture);
		const before = markupBeforePanel(body);

		// The last `<tr` opened before the panel must already be closed. Nested,
		// the data row's `<tr` would be the last tag of either kind.
		expect(before.lastIndexOf('</tr>')).toBeGreaterThan(before.lastIndexOf('<tr'));
	});
});
