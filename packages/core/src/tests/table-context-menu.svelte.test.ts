import { describe, expect, it, vi } from 'vitest';
import { resolveContextActions } from '$lib/components/table/table-context-menu.svelte';
import type { TableColumn, TablePlugin } from '$lib/components/table/table-types.js';
import { renderTable } from './render-table.js';

/**
 * Ported from Astryx's `Table/tableContextMenu.test.tsx` — all **6** of its `it`
 * cases at the 0.5.0 pin, in order and under upstream's names. Nothing dropped, nothing deferred:
 * both of its plugins are hand-written objects handed to the public `plugins`
 * prop, so none of the ten deferred plugin hooks is involved.
 *
 * Standing translations, following `context-menu.svelte.test.ts` and
 * `dropdown-menu.svelte.test.ts`:
 *
 * - Runs in the **client** (real Chromium) project, so upstream's `beforeEach`
 *   stub of `showPopover` / `hidePopover` / `:popover-open` is **gone** — the
 *   browser implements the Popover API natively. That stub is the only reason
 *   upstream needs `{hidden: true}` on its role queries.
 * - `getAllByRole('menuitem', {hidden: true})` becomes a container
 *   `querySelectorAll('[role="menuitem"]')`: a closed menu is `display: none` in
 *   a real browser and therefore out of the accessibility tree, which is exactly
 *   the case `hidden: true` exists to cover.
 * - `fireEvent.contextMenu(el)` becomes a dispatched native `contextmenu` event;
 *   `fireEvent.click(item)` becomes `item.click()`.
 * - `getByText` passes `{exact: true}`, restoring Testing Library's
 *   whole-string matching over a Vitest locator's substring default.
 * - `render(Table, …)` is `renderTable` from `./render-table.js`, which pins the
 *   row generic per call — `render()` takes the component as a value and so has
 *   no `data` to infer `T` from. See that file.
 */

interface Row extends Record<string, unknown> {
	id: string;
	name: string;
}

const data: Row[] = [
	{ id: '1', name: 'Alice' },
	{ id: '2', name: 'Bob' }
];

const columns: TableColumn<Row>[] = [
	{ key: 'name', header: 'Name' },
	{ key: 'id', header: 'ID' }
];

function menuItems(container: HTMLElement, name?: string): HTMLElement[] {
	const all = Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]'));
	return name == null ? all : all.filter((item) => item.textContent?.trim() === name);
}

function rightClick(el: Element): void {
	el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
}

// =============================================================================
// contextMenuActions via transformHeaderCell
// =============================================================================

describe('Table header context menu', () => {
	it('renders a menu from a plugin that sets contextMenuActions', async () => {
		const onSelect = vi.fn();
		const plugin: TablePlugin<Row> = {
			transformHeaderCell: (props) => ({
				...props,
				contextMenuActions: [{ id: 'pin', label: 'Pin column', onSelect }]
			})
		};
		const screen = await renderTable({ data, columns, idKey: 'id', plugins: { plugin } });
		rightClick(screen.getByText('Name', { exact: true }).element());
		const items = menuItems(screen.container, 'Pin column');
		expect(items.length).toBeGreaterThan(0);
		items[0].click();
		expect(onSelect).toHaveBeenCalledTimes(1);
	});

	it('concatenates actions from multiple plugins (never overridden)', async () => {
		const a: TablePlugin<Row> = {
			transformHeaderCell: (props) => ({
				...props,
				contextMenuActions: [
					...resolveContextActions(props.contextMenuActions),
					{ id: 'a', label: 'Action A', onSelect: () => {} }
				]
			})
		};
		const b: TablePlugin<Row> = {
			transformHeaderCell: (props) => ({
				...props,
				contextMenuActions: [
					...resolveContextActions(props.contextMenuActions),
					{ id: 'b', label: 'Action B', onSelect: () => {} }
				]
			})
		};
		const screen = await renderTable({ data, columns, idKey: 'id', plugins: { a, b } });
		rightClick(screen.getByText('Name', { exact: true }).element());
		expect(menuItems(screen.container, 'Action A').length).toBeGreaterThan(0);
		expect(menuItems(screen.container, 'Action B').length).toBeGreaterThan(0);
	});

	it('does not render a menu when no plugin contributes actions', async () => {
		const screen = await renderTable({ data, columns, idKey: 'id' });
		rightClick(screen.getByText('Name', { exact: true }).element());
		expect(menuItems(screen.container)).toHaveLength(0);
	});

	it('forwards a destructive action variant to the menu item', async () => {
		const plugin: TablePlugin<Row> = {
			transformHeaderCell: (props) => ({
				...props,
				contextMenuActions: [
					{ id: 'delete', label: 'Delete column', variant: 'destructive', onSelect: () => {} },
					{ id: 'pin', label: 'Pin column', onSelect: () => {} }
				]
			})
		};
		const screen = await renderTable({ data, columns, idKey: 'id', plugins: { plugin } });
		rightClick(screen.getByText('Name', { exact: true }).element());
		expect(menuItems(screen.container, 'Delete column')[0]).toHaveAttribute(
			'data-variant',
			'destructive'
		);
		expect(menuItems(screen.container, 'Pin column')[0]).not.toHaveAttribute('data-variant');
	});
});

// =============================================================================
// Body / row context menu
// =============================================================================

describe('Table body context menu', () => {
	it('renders row actions from a plugin that sets contextMenuActions in transformBodyCell', async () => {
		const onSelect = vi.fn();
		const plugin: TablePlugin<Row> = {
			transformBodyCell: (props, _column, item) => ({
				...props,
				contextMenuActions: [
					{
						id: `delete-${item.id}`,
						label: 'Delete row',
						onSelect: () => {
							onSelect(item.id);
						}
					}
				]
			})
		};
		const screen = await renderTable({ data, columns, idKey: 'id', plugins: { plugin } });
		// Right-click the first body cell (Alice).
		const alice = screen.getByText('Alice', { exact: true }).element();
		rightClick(alice);
		// Scoped to the render container, not the `<td>`, as every other case here
		// is. Upstream 0.4.2's corrective portal (#5039) hosts a context layer
		// outside ancestors that cannot legally contain it, and a `<td>` inside
		// `<tr>`/`<tbody>`/`<table>` is four of them — a menu left in a table row is
		// markup the parser reparents. Only the right-clicked cell's menu is open,
		// so the container query still returns exactly Alice's (the "no plugin
		// contributes actions" case above is what pins that: a closed cell
		// contributes no menuitem at all).
		const items = menuItems(screen.container, 'Delete row');
		expect(items.length).toBeGreaterThan(0);
		items[0].click();
		expect(onSelect).toHaveBeenCalledWith('1');
	});

	it('trigger wrapper fills the full cell so the whole cell is right-clickable', async () => {
		const plugin: TablePlugin<Row> = {
			transformBodyCell: (props) => ({
				...props,
				contextMenuActions: [{ id: 'act', label: 'Act', onSelect: () => {} }]
			})
		};
		const screen = await renderTable({ data, columns, idKey: 'id', plugins: { plugin } });
		// The context-menu trigger wraps the cell content. It must fill the cell
		// (block display + 100% width) so right-clicking anywhere in the cell —
		// not just on the content — opens the menu. Regression test for the bug
		// where only the wide first column responded to right-click.
		const alice = screen.getByText('Alice', { exact: true }).element();
		const trigger = alice.closest('div');
		expect(trigger).not.toBeNull();
		expect(trigger?.className).toBeTruthy();
		// The fillCell style sets inline-size:100% + display:block on the trigger.
		const styleAttr = trigger?.getAttribute('class') ?? '';
		// StyleX compiles to atomic classes; just assert the wrapper carries styles
		// (the visual fill is covered by the compiled CSS). The key contract is
		// that the trigger is a styled block wrapper, not a bare inline element.
		expect(styleAttr.length).toBeGreaterThan(0);
	});
});
