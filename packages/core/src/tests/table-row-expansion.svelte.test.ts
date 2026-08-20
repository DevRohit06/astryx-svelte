import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness, { multiColumns } from './fixtures/table-row-expansion-fixture.svelte';
import I18nHarness from './fixtures/table-row-expansion-i18n.svelte';

/**
 * Ported from Astryx's
 * `Table/plugins/rowExpansion/useTableRowExpansion.test.tsx` at **v0.4.5** — all
 * **13** of its `it` cases, in upstream's order and under upstream's names.
 * Nothing dropped, nothing added. (Re-derived at the 0.4.5 pin; upstream's file
 * has not moved since v0.4.1, where this header last stated the count.)
 *
 * ## The count changed because the plugin did
 *
 * This file previously carried **14** cases against upstream's 0.3.0 suite: 10
 * for the tree-shaped plugin plus a 4-case `useTableRowExpansionState cycle
 * guard` block. PR #4609 rewrote `useTableRowExpansion` into a detail-panel
 * plugin and **deleted `useTableRowExpansionState` outright**, so upstream's
 * suite was rewritten with it. The cycle guard's four cases went with the hook
 * they tested — the hierarchy they covered is now `useTableTreeState`'s, and
 * `table-tree-state.svelte.test.ts` is where its cycle behaviour is asserted.
 *
 * ## Standing translations
 *
 * - **`InternationalizationProvider` wrapping the harness is its own fixture**
 *   (`table-row-expansion-i18n.svelte`), because a provider's `children` is a
 *   snippet and cannot be written inline in a `render()` props object.
 * - **Upstream's `beforeEach` popover stub is gone**, the same way
 *   `table-context-menu.svelte.test.ts` drops it: it patches `showPopover`,
 *   `hidePopover` and `:popover-open` because jsdom implements none of them.
 *   This suite runs in real Chromium, which does — and that stub is the only
 *   reason upstream needs `{hidden: true}` on its `menuitem` query, since a
 *   closed menu is `display: none` and out of the accessibility tree here.
 *   `getAllByRole('menuitem', {hidden: true})` therefore becomes a container
 *   `[role="menuitem"]` query, exactly as in that file.
 * - **`fireEvent.click` / `fireEvent.contextMenu` become `element.click()` and a
 *   dispatched native `contextmenu`**, each followed by an awaited
 *   `expect.poll` — `act()` has no counterpart and a `$state` write flushes on
 *   its own.
 * - **`Harness` is a fixture component**, because a hook has to run during a
 *   component's init. Its `renderExpanded` is a `Snippet<[Row]>`; the one case
 *   that overrides it selects a second snippet by name (`panelVariant`), since a
 *   `.ts` test file cannot author one. Upstream's inline `<H>` component for the
 *   colSpan case becomes the same harness with its `columns` prop set.
 */

function panels(container: HTMLElement): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('[data-testid="panel"]'));
}

function rightClick(el: Element): void {
	el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
}

function menuItems(container: HTMLElement, pattern: RegExp): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]')).filter((item) =>
		pattern.test(item.textContent ?? '')
	);
}

describe('useTableRowExpansion (detail panel)', () => {
	it('renders an "Expand row" chevron button for every expandable row', async () => {
		const screen = await render(Harness, { props: {} });
		expect(screen.getByRole('button', { name: /expand row/i }).elements().length).toBe(3);
	});

	it('does not render the detail panel while collapsed', async () => {
		const screen = await render(Harness, { props: {} });
		expect(panels(screen.container).length).toBe(0);
	});

	it('renders the detail panel below the row when expanded', async () => {
		const screen = await render(Harness, { props: { initialExpanded: new Set(['a']) } });
		const found = panels(screen.container);
		expect(found.length).toBe(1);
		expect(found[0].textContent).toBe('Ada: Ada bio');
	});

	it('renders renderExpanded content with the row item', async () => {
		const screen = await render(Harness, {
			props: { initialExpanded: new Set(['b']), panelVariant: 'bio' as const }
		});
		expect(panels(screen.container)[0].textContent).toBe('bio=Bo bio');
	});

	it('toggles the panel open on chevron click', async () => {
		const screen = await render(Harness, { props: {} });
		expect(panels(screen.container).length).toBe(0);

		(screen.getByRole('button', { name: /expand row/i }).elements()[0] as HTMLElement).click();

		await expect.poll(() => panels(screen.container).length).toBe(1);
	});

	it('relabels the chevron "Collapse row" and sets aria-expanded when open', async () => {
		const screen = await render(Harness, { props: { initialExpanded: new Set(['a']) } });
		await expect
			.element(screen.getByRole('button', { name: /collapse row/i }))
			.toHaveAttribute('aria-expanded', 'true');
	});

	it('marks the chevron aria-expanded=false when collapsed', async () => {
		const screen = await render(Harness, { props: {} });
		expect(screen.getByRole('button', { name: /expand row/i }).elements()[0]).toHaveAttribute(
			'aria-expanded',
			'false'
		);
	});

	it('renders one detail panel per expanded row', async () => {
		const screen = await render(Harness, { props: { initialExpanded: new Set(['a', 'c']) } });
		expect(panels(screen.container).length).toBe(2);
	});

	it('renders the expanded panel as a full-width cell spanning all columns', async () => {
		const screen = await render(Harness, {
			props: { initialExpanded: new Set(['a']), columns: multiColumns }
		});
		const panelCell = panels(screen.container)[0].closest('td');
		expect(panelCell).not.toBeNull();
		// 2 user columns + 1 injected chevron column = colSpan 3
		expect(panelCell).toHaveAttribute('colspan', '3');
	});

	it('hides the chevron for non-expandable rows and never shows their panel', async () => {
		const screen = await render(Harness, {
			props: { isItemExpandable: (item: { id: string }) => item.id !== 'b' }
		});
		// Only a and c are expandable
		expect(screen.getByRole('button', { name: /expand row/i }).elements().length).toBe(2);
	});

	it('does not render a panel for a non-expandable row even if its key is in expandedKeys', async () => {
		const screen = await render(Harness, {
			props: {
				initialExpanded: new Set(['b']),
				isItemExpandable: (item: { id: string }) => item.id !== 'b'
			}
		});
		expect(panels(screen.container).length).toBe(0);
	});

	it('contributes a context-menu action on expandable rows', async () => {
		const screen = await render(Harness, { props: {} });

		rightClick(screen.getByText('Ada', { exact: true }).element());

		await expect.poll(() => menuItems(screen.container, /expand row/i).length).toBeGreaterThan(0);
	});

	it('localizes the chevron aria-label through the i18n catalog', async () => {
		const screen = await render(I18nHarness, {
			props: {
				locale: 'fr',
				overrides: { fr: { '@astryx.tableRowExpansion.expandRow': 'Développer la ligne' } }
			}
		});

		expect(screen.getByRole('button', { name: 'Développer la ligne' }).elements().length).toBe(3);
	});
});
