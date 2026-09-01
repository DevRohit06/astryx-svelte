/** PORTS: Table/plugins/groupedRows/useTableGroupedRows.test.tsx */

import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './fixtures/table-grouped-rows-fixture.svelte';
import { customGroupHeader } from './fixtures/table-plugin-slots.svelte';

/**
 * Astryx's `Table/plugins/groupedRows/useTableGroupedRows.test.tsx`, ported case
 * for case — **10 of upstream's 12 declarations at the 0.5.0 pin**, in
 * upstream's order and under its titles.
 *
 * **The 2 that are not here arrived at 0.5.0**, and both guard the same
 * invariant — a column's `renderCell` must never be handed a group *header*
 * row:
 *
 * - `never runs a column renderCell against a group header row`.
 * - `renders the group headers without throwing`, declared inside a
 *   `describe.each` over `['grouped first', true]` and `['rowStatus first',
 *   false]`, so it runs twice — it pins the invariant whichever order the
 *   consumer registers the `grouped` and `rowStatus` plugins in.
 *
 * (This header read "**10 of 10** … Nothing dropped", true at the v0.4.5 pin.)
 *
 * Upstream's `Harness`, `OrderedHarness` and `ChangingHarness` are one fixture,
 * `fixtures/table-grouped-rows-fixture.svelte`; they differ only in a prop and a
 * button. `renderGroupHeader` is a `Snippet` here rather than a render prop, so
 * the custom-header case imports its snippet from
 * `fixtures/table-plugin-slots.svelte` — a snippet can only be authored in a
 * template.
 *
 * ## Two cases caught a real defect, and it is now fixed
 *
 * "toggles a group via its chevron and back again" and "keeps a group collapsed
 * across a data change" originally failed with upstream's assertions unchanged,
 * for one reason: the group-header cell's props were frozen at first render.
 * `use-table-grouped-rows.svelte.ts`'s `transformBodyRow` computed `collapsed`
 * and destructured `config()` *outside* the getter it hands to
 * `bindGroupHeader`, so the bound snippet's argument closure read no reactive
 * source. `createSlotBinder`'s own header states the requirement it missed:
 * swapping in a new `get` "does not by itself wake the snippet's derived; it
 * re-runs when a reactive source read **inside** `get` changes."
 *
 * Observed at the time, and worth keeping because of how *partial* the symptom
 * was: the `<tr>` correctly flipped to `aria-expanded="false"` and the member
 * rows left, but the chevron button — the same DOM node throughout, so the
 * binder's identity guarantee was intact — kept `aria-expanded="true"` and the
 * label "Collapse group Core". The member count froze the same way. Half the
 * row updated and half did not, which is exactly what makes this class of bug
 * survive a casual look.
 *
 * The two cases were parked as `it.fails` rather than `it.skip` so the marker
 * would retire itself, and it did: fixing the hook to read through the getter
 * made them fail as "expected to fail", and they are now plain `it`.
 *
 * Standing translations:
 *
 * - `render` is async and takes `{ props }`; `fireEvent.click` is the local
 *   `click()` below, which keeps `fireEvent`'s non-retrying semantics — a
 *   `userEvent.click` would retry for fifteen seconds on the frozen chevron
 *   label rather than reporting what upstream's synchronous `getByRole` reports.
 * - `queryByText(...)` → `getByText(...).query()`, which is `null` when absent.
 * - `getByText` carries `{ exact: true }`, and the group-label sites assert a
 *   different string from upstream's in order to ask upstream's question. A
 *   label renders as `<span>Core <span>(2)</span></span>`, one subtree whose full
 *   text is "Core (2)". Testing Library matches an element's *direct* text
 *   nodes and so sees "Core"; this runner matches the whole subtree and sees
 *   "Core (2)", so upstream's `getByText('Core')` has no transcription — exact
 *   matches nothing and substring matches by accident. Asserting the whole
 *   label text resolves the identical element upstream's assertion does, and is
 *   no weaker than it. The sibling `(2)` / `(1)` assertions are unaffected.
 * - `within(rows[1]).getByText(…)` is `getByRole('row').nth(1).getByText(…)`.
 */

/** `fireEvent.click`: resolve the element now, click it now. */
function click(locator: { element(): Element }): void {
	(locator.element() as HTMLElement).click();
}

describe('useTableGroupedRows', () => {
	it('renders a header row per group with label and count', async () => {
		const screen = await render(Harness, { props: {} });
		// Two groups: Core (2), Infra (1).
		// `Core`/`Infra` need the full label text here. Upstream's `getByText`
		// matches an element's **direct text nodes**, so `'Core'` finds the label
		// span in `<span>Core <span>(2)</span></span>`; this runner's locator
		// matches the whole subtree, where that span reads "Core (2)", so
		// `'Core'` with `{ exact: true }` matches nothing. Asserting the label's
		// whole text resolves to the same element upstream's assertion does and
		// is no weaker than it.
		await expect.element(screen.getByText('Core (2)', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('(2)', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Infra (1)', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('(1)', { exact: true })).toBeInTheDocument();
	});

	it('shows group members when expanded', async () => {
		const screen = await render(Harness, { props: {} });
		await expect.element(screen.getByText('Alice', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Bob', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Carol', { exact: true })).toBeInTheDocument();
	});

	it('hides members of a collapsed group but keeps the header', async () => {
		const screen = await render(Harness, { props: { initialCollapsed: new Set(['Core']) } });
		// Whole label text; see the first case.
		await expect.element(screen.getByText('Core (2)', { exact: true })).toBeInTheDocument();
		expect(screen.getByText('Alice', { exact: true }).query()).toBeNull();
		expect(screen.getByText('Bob', { exact: true }).query()).toBeNull();
		// Other group unaffected.
		await expect.element(screen.getByText('Carol', { exact: true })).toBeInTheDocument();
	});

	// One of the two cases that caught the frozen-header-props defect the file
	// header narrates. While it was live the group collapsed but the chevron's
	// accessible name stayed "Collapse group Core", so the second `getByRole`
	// found nothing. Fixed; the case is a plain `it` and passes.
	it('toggles a group via its chevron and back again', async () => {
		const screen = await render(Harness, { props: {} });
		await expect.element(screen.getByText('Alice', { exact: true })).toBeInTheDocument();
		// The standalone chevron button toggles the group; its accessible name is
		// qualified with the group key.
		click(screen.getByRole('button', { name: 'Collapse group Core', exact: true }));
		await expect.poll(() => screen.getByText('Alice', { exact: true }).query()).toBeNull();
		expect(screen.getByText('Bob', { exact: true }).query()).toBeNull();
		// Whole label text; see the first case.
		await expect.element(screen.getByText('Core (2)', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Carol', { exact: true })).toBeInTheDocument();
		// Toggle back: the Core chevron now says "Expand group Core".
		click(screen.getByRole('button', { name: 'Expand group Core', exact: true }));
		await expect.element(screen.getByText('Alice', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Bob', { exact: true })).toBeInTheDocument();
	});

	it('exposes each group toggle as a named, keyboard-operable button', async () => {
		const screen = await render(Harness, { props: {} });
		// Native <button>: focusable and operable without a custom key handler.
		const coreToggle = screen.getByRole('button', { name: 'Collapse group Core', exact: true });
		expect(coreToggle.element().tagName).toBe('BUTTON');
		await expect.element(coreToggle).toHaveAttribute('aria-expanded', 'true');
	});

	it('sets aria-expanded on the header row reflecting collapse state', async () => {
		const screen = await render(Harness, { props: { initialCollapsed: new Set(['Core']) } });
		const rows = screen.getByRole('row');
		// rows[1] = Core header (collapsed), rows[2] = Infra header (expanded).
		await expect.element(rows.nth(1)).toHaveAttribute('aria-expanded', 'false');
		await expect.element(rows.nth(2)).toHaveAttribute('aria-expanded', 'true');
	});

	it('respects groupOrder in the flattened data', async () => {
		const screen = await render(Harness, { props: { groupOrder: ['Infra', 'Core'] } });
		// Upstream asserts `grouped.data.length > 0` from inside its harness's
		// render; the fixture exposes the flattened rows instead.
		expect(screen.component.api.data.length).toBeGreaterThan(0);
		// rows[0] = column header; rows[1] = first group header (Infra).
		// Whole label text; see the first case.
		await expect
			.element(screen.getByRole('row').nth(1).getByText('Infra (1)', { exact: true }))
			.toBeInTheDocument();
	});

	it('renders custom group header content via renderGroupHeader', async () => {
		const screen = await render(Harness, { props: { renderGroupHeader: customGroupHeader } });
		await expect.element(screen.getByText('Core::2::open', { exact: true })).toBeInTheDocument();
		await expect.element(screen.getByText('Infra::1::open', { exact: true })).toBeInTheDocument();
	});

	it('renders nothing (no group headers) for empty data', async () => {
		const screen = await render(Harness, { props: { rows: [] } });
		// Column header row still renders; no group header rows.
		expect(screen.getByText('Core', { exact: true }).query()).toBeNull();
		expect(screen.getByText('Infra', { exact: true }).query()).toBeNull();
		expect(screen.getByRole('button', { name: /group/i }).query()).toBeNull();
	});

	// The other case that caught the frozen-header-props defect the file header
	// narrates. While it was live the group stayed collapsed but the member count
	// was frozen at "(2)". Fixed; the case is a plain `it` and passes.
	//
	// Upstream's four post-click assertions are all here, **reordered**: React's
	// `fireEvent` flushes inside `act`, so upstream can assert absence on the next
	// line. `click()` here is a raw `element.click()` and Svelte flushes on a
	// microtask, so the two `queryByText`s have to be anchored to an observation
	// that the data change has landed — otherwise they read the pre-click DOM and
	// merely restate the initial condition two lines above. The count going
	// 2 → 3 is that anchor, and it is upstream's own last assertion.
	it('keeps a group collapsed across a data change (state keyed by group)', async () => {
		const screen = await render(Harness, {
			props: { initialCollapsed: new Set(['Core']), canAddRow: true }
		});
		// Core collapsed initially: Alice hidden.
		expect(screen.getByText('Alice', { exact: true }).query()).toBeNull();
		// Add a new Core member; Core must stay collapsed (keyed by group value).
		click(screen.getByText('add', { exact: true }));
		// Count reflects the new member (3) — the data change has landed.
		await expect.element(screen.getByText('(3)', { exact: true })).toBeInTheDocument();
		// Still collapsed: neither the existing member nor the new one renders.
		expect(screen.getByText('Alice', { exact: true }).query()).toBeNull();
		expect(screen.getByText('Dave', { exact: true }).query()).toBeNull();
		// Header still present, now counting the new member. Whole label text; see
		// the first case.
		await expect.element(screen.getByText('Core (3)', { exact: true })).toBeInTheDocument();
	});
});
