import { describe, expect, it, vi } from 'vitest';
import { tick } from 'svelte';
import { render } from 'vitest-browser-svelte';
import TreeTable, {
	fileTree,
	treeColumns,
	type FileRow
} from './fixtures/table-tree-fixture.svelte';
import TwoTogglesTable from './fixtures/table-tree-two-toggles-fixture.svelte';
import LazyTable from './fixtures/table-tree-lazy-fixture.svelte';
import ZeroColumnsTable from './fixtures/table-tree-zero-columns-fixture.svelte';
import ComposedTable from './fixtures/table-tree-selection-fixture.svelte';
import RowClickSpyTable from './fixtures/table-tree-row-click-spy-fixture.svelte';
import SortedTree from './fixtures/table-tree-sorted-fixture.svelte';
import { renderTable } from './render-table.js';

/**
 * Ported from Astryx's `Table/plugins/tree/useTableTreeData.test.tsx` — all
 * **38** of its `it` cases at the 0.5.0 pin, in upstream's order and under
 * upstream's names.
 * Nothing dropped.
 *
 * ## Standing translations
 *
 * - **Each upstream harness component becomes a probe fixture** in `fixtures/`
 *   (`TreeTable`, `TwoTogglesTable`, `LazyTable`, `ZeroColumnsTable`,
 *   `ComposedTable`, `RowClickSpyTable`, `SortedTree`), because a hook has to
 *   run during a component's init. Upstream's `TreeWithSelection` (row-click
 *   block) is `ComposedTable` with two props parameterised rather than a second
 *   fixture; `SpyTree` becomes `RowClickSpyTable`, which takes the `vi.fn()` as
 *   a prop so the case still owns the assertion.
 * - **A "nothing happened" assertion awaits `tick()` first**, so it cannot pass
 *   merely by running before the flush. React's `user.click` is already
 *   `act()`-wrapped; here the `$state` write flushes on its own and `tick()`
 *   waits for it.
 * - **`within(row).getByRole('button', {name})` becomes an attribute query on
 *   the row.** `page.elementLocator(row)` looks like the counterpart and is a
 *   trap: it *synthesises* a selector from the element's accessible name at the
 *   moment it is called, so a locator scoped to the `src` row stops resolving
 *   the instant the row's own name changes from "Expand row src" to
 *   "Collapse row src" — which is exactly what these cases toggle. The
 *   expander's accessible name **is** its `aria-label`, so
 *   `button[aria-label="…"]` asks the same question and survives the toggle.
 * - **`getBodyRows()` / `getRowByText()` are container queries.** Testing
 *   Library's `getByText` matches an element's *direct* text children;
 *   a Vitest/Playwright text locator matches the deepest element containing the
 *   text, so a trimmed `td` text comparison is the honest equivalent and is what
 *   upstream's helper is really doing. The trim is load-bearing: Svelte's
 *   compiled markup leaves whitespace text nodes inside a `<td>` where JSX
 *   does not.
 * - **`user.click(button)` is `element.click()`** followed by an awaited
 *   assertion — `act()` has no counterpart, and `expect.poll` retries.
 * - **`rerender(<TreeTable …/>)` is `screen.rerender({ … })`.**
 *
 * ## Restated cases (assertion changed; each says so at its site)
 *
 * - "renders without crashing when the table has zero columns" — upstream's
 *   `expect(() => render(…)).not.toThrow()` is vacuous here, since `render` is
 *   async and the promise is never awaited inside the callback.
 */

// =============================================================================
// Helpers
// =============================================================================

/**
 * Only the part of a `render()` result the helpers below read. Naming more of
 * it (`rerender`, the locator factories) makes the structural check fail on
 * `Rerender<C>`'s component generic, which is noise: these are container
 * queries.
 */
interface Screen {
	container: HTMLElement;
}

/** All body rows (skips the header row). */
function getBodyRows(screen: Screen): HTMLElement[] {
	return Array.from(screen.container.querySelectorAll<HTMLElement>('tbody tr'));
}

function findRowByText(screen: Screen, text: string): HTMLElement | undefined {
	return getBodyRows(screen).find((row) =>
		Array.from(row.querySelectorAll('td')).some((td) => td.textContent?.trim() === text)
	);
}

function getRowByText(screen: Screen, text: string): HTMLElement {
	const row = findRowByText(screen, text);
	if (!row) {
		throw new Error(`no row containing "${text}"`);
	}
	return row;
}

/** Upstream's `within(el).getByRole('button', {name})`; the name is the aria-label. */
function buttonIn(el: Element, name: string): HTMLElement | null {
	return el.querySelector<HTMLElement>(`button[aria-label="${name}"]`);
}

/** Upstream's `within(el).queryAllByRole('button')`. */
function buttonsIn(el: Element): HTMLElement[] {
	return Array.from(el.querySelectorAll<HTMLElement>('button'));
}

/**
 * Upstream's `within(getRowByText(text)).getByText(text)` — the element the
 * row-click cases click. Testing Library resolves that to the tree cell's flex
 * wrapper (its `textContent` is the row's name; the expander contributes none).
 * On flat data the plugin is a full pass-through, so the `<td>` has no wrapper
 * element at all and the cell itself is the innermost node holding the text.
 * Either way the click bubbles to the `<tr>` and `closest()` finds no
 * interactive ancestor, which is what the guard under test reads.
 */
function rowBodyTarget(screen: Screen, text: string): HTMLElement {
	const row = getRowByText(screen, text);
	const td = Array.from(row.querySelectorAll('td')).find((c) => c.textContent?.trim() === text);
	if (!td) {
		throw new Error(`no cell containing "${text}"`);
	}
	return (td.firstElementChild as HTMLElement | null) ?? td;
}

/** Upstream's `within(row).getByText(text).closest('td')?.firstElementChild`. */
function cellWrapper(screen: Screen, text: string): HTMLElement {
	const row = getRowByText(screen, text);
	const td = Array.from(row.querySelectorAll('td')).find((c) => c.textContent?.trim() === text);
	return td?.firstElementChild as HTMLElement;
}

// =============================================================================
// Expander button
// =============================================================================

describe('useTableTreeData — expander', () => {
	it('renders an "Expand row" button on collapsed expandable rows only', async () => {
		const screen = await render(TreeTable, { props: {} });

		const srcRow = getRowByText(screen, 'src');
		expect(buttonIn(srcRow, 'Expand row')).toBeInTheDocument();

		const readmeRow = getRowByText(screen, 'README.md');
		expect(buttonsIn(readmeRow)).toHaveLength(0);
	});

	it('expands children on click and relabels the button "Collapse row"', async () => {
		const screen = await render(TreeTable, { props: {} });

		expect(findRowByText(screen, 'components')).toBeUndefined();

		buttonIn(getRowByText(screen, 'src'), 'Expand row')!.click();

		await expect.poll(() => findRowByText(screen, 'components')).toBeDefined();
		expect(findRowByText(screen, 'utils.ts')).toBeDefined();
		expect(buttonIn(getRowByText(screen, 'src'), 'Collapse row')).toBeInTheDocument();
	});

	it('collapses an expanded row on click, unmounting the subtree', async () => {
		const screen = await render(TreeTable, {
			props: { defaultExpandedIds: ['src', 'components'] }
		});

		expect(findRowByText(screen, 'Button.tsx')).toBeDefined();

		buttonIn(getRowByText(screen, 'src'), 'Collapse row')!.click();

		await expect.poll(() => findRowByText(screen, 'components')).toBeUndefined();
		expect(findRowByText(screen, 'Button.tsx')).toBeUndefined();
		// Unmounted, not hidden: only roots + header remain.
		expect(screen.container.querySelectorAll('tr')).toHaveLength(3);
	});

	it('sets aria-expanded on the expander button', async () => {
		const screen = await render(TreeTable, { props: {} });

		const button = buttonIn(getRowByText(screen, 'src'), 'Expand row')!;
		expect(button).toHaveAttribute('aria-expanded', 'false');

		button.click();

		await expect
			.poll(() =>
				buttonIn(getRowByText(screen, 'src'), 'Collapse row')?.getAttribute('aria-expanded')
			)
			.toBe('true');
	});
});

// =============================================================================
// Whole-row-click expansion
// =============================================================================

describe('useTableTreeData — row-click expansion', () => {
	it('does not toggle on row click when hasRowClickExpansion is unset', async () => {
		const screen = await render(TreeTable, { props: {} });

		rowBodyTarget(screen, 'src').click();
		await tick();

		// Row body click is inert by default: subtree stays collapsed.
		expect(findRowByText(screen, 'components')).toBeUndefined();
		expect(buttonIn(getRowByText(screen, 'src'), 'Expand row')).toBeInTheDocument();
	});

	it('expands an expandable row when its body is clicked', async () => {
		const screen = await render(TreeTable, { props: { hasRowClickExpansion: true } });

		rowBodyTarget(screen, 'src').click();

		await expect.poll(() => findRowByText(screen, 'components')).toBeDefined();
		expect(findRowByText(screen, 'utils.ts')).toBeDefined();
		expect(buttonIn(getRowByText(screen, 'src'), 'Collapse row')).toBeInTheDocument();
	});

	it('collapses an expanded row when its body is clicked', async () => {
		const screen = await render(TreeTable, {
			props: { hasRowClickExpansion: true, defaultExpandedIds: ['src'] }
		});

		expect(findRowByText(screen, 'components')).toBeDefined();

		rowBodyTarget(screen, 'src').click();

		await expect.poll(() => findRowByText(screen, 'components')).toBeUndefined();
		expect(buttonIn(getRowByText(screen, 'src'), 'Expand row')).toBeInTheDocument();
	});

	it('does not toggle when a leaf row body is clicked', async () => {
		const screen = await render(TreeTable, { props: { hasRowClickExpansion: true } });

		const before = screen.container.querySelectorAll('tr').length;
		rowBodyTarget(screen, 'README.md').click();
		await tick();

		// Leaf has no expansion: row count is unchanged.
		expect(screen.container.querySelectorAll('tr')).toHaveLength(before);
	});

	it('toggles once when the chevron is clicked (no double-toggle via row click)', async () => {
		const onToggle = vi.fn();
		const screen = await render(RowClickSpyTable, { props: { onToggle } });

		buttonIn(getRowByText(screen, 'src'), 'Expand row')!.click();

		await expect.poll(() => findRowByText(screen, 'components')).toBeDefined();
		// The chevron stops propagation, so a chevron click toggles exactly once.
		expect(onToggle).toHaveBeenCalledTimes(1);
	});

	it('does not toggle when an interactive control inside the row is clicked', async () => {
		// Compose with selection: each row carries a checkbox in its own column.
		const screen = await render(ComposedTable, {
			props: { defaultExpandedIds: [], hasRowClickExpansion: true }
		});

		const cells = getRowByText(screen, 'src').querySelectorAll('td');
		cells[0].querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
		await tick();

		// Clicking the checkbox selects the row but must NOT expand it.
		expect(findRowByText(screen, 'components')).toBeUndefined();
		expect(buttonIn(getRowByText(screen, 'src'), 'Expand row')).toBeInTheDocument();
	});

	it('is a no-op on flat data even when hasRowClickExpansion is set', async () => {
		const flat: FileRow[] = [
			{ id: 'a', name: 'a.txt', size: 1 },
			{ id: 'b', name: 'b.txt', size: 2 }
		];
		const screen = await render(TreeTable, {
			props: { data: flat, hasRowClickExpansion: true }
		});

		const before = screen.container.querySelectorAll('tr').length;
		rowBodyTarget(screen, 'a.txt').click();
		await tick();

		expect(screen.container.querySelectorAll('tr')).toHaveLength(before);
	});
});

// =============================================================================
// Row ARIA
// =============================================================================

describe('useTableTreeData — row ARIA', () => {
	it('sets 1-based aria-level on every body row', async () => {
		const screen = await render(TreeTable, {
			props: { defaultExpandedIds: ['src', 'components'] }
		});

		expect(getRowByText(screen, 'src')).toHaveAttribute('aria-level', '1');
		expect(getRowByText(screen, 'components')).toHaveAttribute('aria-level', '2');
		expect(getRowByText(screen, 'Button.tsx')).toHaveAttribute('aria-level', '3');
		expect(getRowByText(screen, 'README.md')).toHaveAttribute('aria-level', '1');
	});

	it('sets aria-expanded on expandable rows and omits it on leaves', async () => {
		const screen = await render(TreeTable, { props: { defaultExpandedIds: ['src'] } });

		expect(getRowByText(screen, 'src')).toHaveAttribute('aria-expanded', 'true');
		expect(getRowByText(screen, 'components')).toHaveAttribute('aria-expanded', 'false');
		expect(getRowByText(screen, 'utils.ts')).not.toHaveAttribute('aria-expanded');
		expect(getRowByText(screen, 'README.md')).not.toHaveAttribute('aria-expanded');
	});
});

// =============================================================================
// Migration no-op (flat data)
// =============================================================================

describe('useTableTreeData — flat data is a no-op', () => {
	const flat: FileRow[] = [
		{ id: 'a', name: 'alpha', size: 1 },
		{ id: 'b', name: 'beta', size: 2 }
	];

	it('renders no expanders, spacers, or tree ARIA for flat data', async () => {
		const screen = await render(TreeTable, { props: { data: flat } });

		expect(buttonsIn(screen.container)).toHaveLength(0);
		for (const row of getBodyRows(screen)) {
			expect(row).not.toHaveAttribute('aria-level');
			expect(row).not.toHaveAttribute('aria-expanded');
		}
	});

	it('renders first-column cell content identically to a plugin-free Table', async () => {
		const withPlugin = await render(TreeTable, { props: { data: flat } });
		const pluginCell = withPlugin.container.querySelector('tbody td');

		const without = await renderTable<FileRow>({ data: flat, columns: treeColumns, idKey: 'id' });
		const plainCell = without.container.querySelector('tbody td');

		expect(pluginCell).toBeTruthy();
		expect(plainCell).toBeTruthy();
		expect(pluginCell?.innerHTML).toBe(plainCell?.innerHTML);
	});
});

// =============================================================================
// Stability across data-shape changes
// =============================================================================

describe('useTableTreeData — stability when the data shape changes', () => {
	const flat: FileRow[] = [
		{ id: 'a', name: 'alpha', size: 1 },
		{ id: 'b', name: 'beta', size: 2 }
	];

	it('does not remount the table when flat data becomes nested', async () => {
		const screen = await render(TreeTable, { props: { data: flat } });
		const tableBefore = screen.container.querySelector('table');

		await screen.rerender({ data: fileTree });

		expect(screen.container.querySelector('table')).toBe(tableBefore);
		// The tree affordance appears without a remount.
		expect(
			screen.container.querySelectorAll('button[aria-label="Expand row"]').length
		).toBeGreaterThan(0);
	});

	it('does not warn about an empty plugin for flat data', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			await render(TreeTable, { props: { data: flat } });
			const pluginWarnings = warn.mock.calls.filter((args) =>
				String(args[0]).includes('no transform methods')
			);
			expect(pluginWarnings).toHaveLength(0);
		} finally {
			warn.mockRestore();
		}
	});

	it('removes tree ARIA from rows when nested data becomes flat', async () => {
		const screen = await render(TreeTable, {
			props: { data: fileTree, defaultExpandedIds: ['src'] }
		});
		expect(getRowByText(screen, 'src')).toHaveAttribute('aria-level', '1');

		await screen.rerender({ data: flat, defaultExpandedIds: ['src'] });

		for (const row of getBodyRows(screen)) {
			expect(row).not.toHaveAttribute('aria-level');
			expect(row).not.toHaveAttribute('aria-expanded');
		}
	});
});

// =============================================================================
// Toggle batching
// =============================================================================

describe('useTableTreeState — batched toggles', () => {
	it('applies two different toggles landing in the same React batch', async () => {
		// Upstream's "React batch" is one synchronous event handler here: the
		// second `onToggleItem` must build on the set the first one wrote.
		const screen = await render(TwoTogglesTable, { props: {} });

		(screen.getByRole('button', { name: 'expand two' }).element() as HTMLElement).click();

		// Both toggles must survive the batch.
		await expect.poll(() => findRowByText(screen, 'components')).toBeDefined();
		expect(findRowByText(screen, 'Button.tsx')).toBeDefined();
	});
});

// =============================================================================
// Indentation
// =============================================================================

describe('useTableTreeData — indentation', () => {
	it('indents nested rows by calc(level * step) and leaves roots unindented', async () => {
		const screen = await render(TreeTable, {
			props: { defaultExpandedIds: ['src', 'components'] }
		});

		expect(cellWrapper(screen, 'src').getAttribute('style') ?? '').not.toContain('calc');
		expect(cellWrapper(screen, 'components').getAttribute('style')).toContain('calc(1 *');
		expect(cellWrapper(screen, 'Button.tsx').getAttribute('style')).toContain('calc(2 *');
	});

	it('respects the indent token size', async () => {
		const screen = await render(TreeTable, {
			props: { defaultExpandedIds: ['src'], indent: 'lg' }
		});

		// lg maps to the --spacing-6 token
		expect(cellWrapper(screen, 'utils.ts').getAttribute('style')).toContain('--spacing-6');
	});

	it('never indents with a physical inline padding (logical property lives in the StyleX class)', async () => {
		// The indent is a StyleX dynamic style: the inline style carries only
		// the CSS variable with the calc value; the paddingInlineStart property
		// itself is compiled into the class. Guard against a regression to
		// physical inline padding, which would not mirror in RTL.
		const screen = await render(TreeTable, { props: { defaultExpandedIds: ['src'] } });

		const style = cellWrapper(screen, 'utils.ts').getAttribute('style') ?? '';
		expect(style).toContain('calc(1 *');
		expect(style).not.toContain('padding-left');
		expect(style).not.toContain('margin-left');
	});

	it('supports deep nesting with no depth cap', async () => {
		// a > b > c > d > e (levels 0..4)
		let node: FileRow = { id: 'e', name: 'leaf-e', size: 0 };
		for (const id of ['d', 'c', 'b', 'a']) {
			node = { id, name: `node-${id}`, size: 0, children: [node] };
		}
		const screen = await render(TreeTable, {
			props: { data: [node], defaultExpandedIds: ['a', 'b', 'c', 'd'] }
		});

		expect(getRowByText(screen, 'leaf-e')).toHaveAttribute('aria-level', '5');
		expect(cellWrapper(screen, 'leaf-e').getAttribute('style')).toContain('calc(4 *');
	});
});

// =============================================================================
// treeColumnKey
// =============================================================================

describe('useTableTreeData — treeColumnKey', () => {
	it('moves the expander into the configured column', async () => {
		const screen = await render(TreeTable, { props: { treeColumnKey: 'size' } });

		const cells = getRowByText(screen, 'src').querySelectorAll('td');
		// name column carries no expander; size column does
		expect(buttonsIn(cells[0])).toHaveLength(0);
		expect(buttonIn(cells[1], 'Expand row')).toBeInTheDocument();
	});

	it('falls back to the first column when the configured column is absent', async () => {
		// e.g. columnSettings hid the configured tree column — the expander
		// must not vanish while rows still announce aria-expanded.
		const screen = await render(TreeTable, { props: { treeColumnKey: 'not-a-column' } });

		const cells = getRowByText(screen, 'src').querySelectorAll('td');
		expect(buttonIn(cells[0], 'Expand row')).toBeInTheDocument();
	});
});

// =============================================================================
// Lazy loading
// =============================================================================

describe('useTableTreeData — lazy loading', () => {
	it('shows an expander before children exist and reveals them once loaded', async () => {
		const screen = await render(LazyTable, { props: {} });

		buttonIn(screen.container, 'Expand row')!.click();

		await expect.poll(() => findRowByText(screen, 'lazy-child')).toBeDefined();
	});
});

// =============================================================================
// Degenerate configurations
// =============================================================================

describe('useTableTreeData — degenerate configurations', () => {
	/**
	 * **Restated.** Upstream writes `expect(() => render(<ZeroColumnsTable/>)).not.toThrow()`;
	 * `render` is async here, so that assertion would pass without the component
	 * ever mounting. Asserting the mounted result is what the title claims.
	 */
	it('renders without crashing when the table has zero columns', async () => {
		const screen = await render(ZeroColumnsTable, { props: {} });

		expect(screen.container.querySelector('table')).not.toBeNull();
		expect(screen.container.querySelectorAll('thead th')).toHaveLength(0);
	});

	it('updates aria-level in place when a row is reparented deeper', async () => {
		const flat: FileRow[] = [
			{ id: 'a', name: 'alpha', size: 0, children: [{ id: 'k', name: 'kid', size: 1 }] },
			{ id: 'm', name: 'mover', size: 2 }
		];
		const nested: FileRow[] = [
			{
				id: 'a',
				name: 'alpha',
				size: 0,
				children: [
					{ id: 'k', name: 'kid', size: 1 },
					{ id: 'm', name: 'mover', size: 2 }
				]
			}
		];

		const screen = await render(TreeTable, {
			props: { data: flat, defaultExpandedIds: ['a'] }
		});
		expect(getRowByText(screen, 'mover')).toHaveAttribute('aria-level', '1');

		await screen.rerender({ data: nested, defaultExpandedIds: ['a'] });

		expect(getRowByText(screen, 'mover')).toHaveAttribute('aria-level', '2');
	});
});

// =============================================================================
// Composition with selection
// =============================================================================

describe('useTableTreeData — composition with selection', () => {
	it('prepends the selection checkbox column before the tree column', async () => {
		const screen = await render(ComposedTable, { props: {} });

		const cells = getRowByText(screen, 'src').querySelectorAll('td');
		// Checkbox column first, then the tree (name) column with the expander.
		expect(cells[0].querySelector('input[type="checkbox"]')).toBeInTheDocument();
		expect(buttonIn(cells[1], 'Collapse row')).toBeInTheDocument();
	});
});

// =============================================================================
// Composition with sorting
// =============================================================================

describe('useTableTreeData — composition with sorting', () => {
	it('sorts sibling groups via applySort without interleaving levels', async () => {
		const screen = await render(SortedTree, { props: {} });

		const names = getBodyRows(screen).map((row) =>
			row.querySelectorAll('td')[0].textContent?.trim()
		);
		// Roots desc: src > README.md; src's children desc: utils.ts > components.
		// Children stay directly under their parent.
		expect(names).toEqual(['src', 'utils.ts', 'components', 'README.md']);
	});
});

// =============================================================================
// Expand-all header control
// =============================================================================

describe('useTableTreeData: expand-all header control', () => {
	/** The header row is the first row; return its expand-all toggle if present. */
	function queryExpandAllButton(screen: Screen): HTMLElement | null {
		const headerRow = screen.container.querySelector('tr') as HTMLElement;
		return buttonIn(headerRow, 'Expand all rows') ?? buttonIn(headerRow, 'Collapse all rows');
	}

	/** Upstream's `within(screen.getAllByRole('row')[0])`. */
	function headerRow(screen: Screen): HTMLElement {
		return screen.container.querySelector('tr') as HTMLElement;
	}

	it('renders no expand-all control by default', async () => {
		const screen = await render(TreeTable, { props: { defaultExpandedIds: ['src'] } });
		expect(queryExpandAllButton(screen)).toBeNull();
	});

	it('renders an "Expand all" toggle in the tree column header when enabled and collapsed', async () => {
		const screen = await render(TreeTable, { props: { hasExpandAllControl: true } });
		expect(buttonIn(headerRow(screen), 'Expand all rows')).toBeInTheDocument();
	});

	it('expands every row when the collapsed toggle is clicked', async () => {
		const screen = await render(TreeTable, { props: { hasExpandAllControl: true } });

		// Collapsed: only roots are visible.
		expect(getBodyRows(screen)).toHaveLength(2);

		buttonIn(headerRow(screen), 'Expand all rows')!.click();

		// Every level is now visible.
		await expect.poll(() => getBodyRows(screen).length).not.toBe(2);
		expect(findRowByText(screen, 'Button.tsx')).toBeDefined();
	});

	it('relabels the toggle "Collapse all" once everything is expanded', async () => {
		const screen = await render(TreeTable, {
			props: { hasExpandAllControl: true, defaultExpandedIds: ['src', 'components'] }
		});
		expect(buttonIn(headerRow(screen), 'Collapse all rows')).toBeInTheDocument();
	});

	it('collapses back to roots when the expanded toggle is clicked', async () => {
		const screen = await render(TreeTable, {
			props: { hasExpandAllControl: true, defaultExpandedIds: ['src', 'components'] }
		});
		expect(findRowByText(screen, 'Button.tsx')).toBeDefined();

		buttonIn(headerRow(screen), 'Collapse all rows')!.click();

		await expect.poll(() => getBodyRows(screen).length).toBe(2);
		expect(findRowByText(screen, 'Button.tsx')).toBeUndefined();
	});

	it('marks the toggle aria-expanded=false in the indeterminate (partial) state', async () => {
		// 'src' expanded but 'components' not: partially expanded.
		const screen = await render(TreeTable, {
			props: { hasExpandAllControl: true, defaultExpandedIds: ['src'] }
		});
		const toggle = buttonIn(headerRow(screen), 'Expand all rows');
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
	});

	it('does not render the control for flat data even when enabled', async () => {
		const flat: FileRow[] = [
			{ id: 'a', name: 'A', size: 1 },
			{ id: 'b', name: 'B', size: 2 }
		];
		const screen = await render(TreeTable, {
			props: { data: flat, hasExpandAllControl: true }
		});
		expect(queryExpandAllButton(screen)).toBeNull();
	});

	it('renders the toggle inline with the header label, not stacked above it', async () => {
		const screen = await render(TreeTable, { props: { hasExpandAllControl: true } });
		const toggle = buttonIn(headerRow(screen), 'Expand all rows')!;

		// The tree column's <th> holds the label text ('Name'). The bug was that
		// the toggle went into the `before` slot, which BaseTable renders as a
		// block sibling of the label, stacking the chevron ABOVE the title. The
		// fix wraps the label + toggle in one inline-flex container, so they must
		// share the same immediate parent (the toggle is a sibling of the label,
		// not in a separate stacked slot).
		const th = toggle.closest('th');
		expect(th).not.toBeNull();
		// Upstream reaches the label through `getByText('Name')`; the label here
		// is a bare text node inside the wrapper rather than an element, so the
		// wrapper is the toggle's own parent and the assertion is that the text
		// lives there too — the same question, one node shallower.
		const wrapper = toggle.parentElement as HTMLElement;
		expect(wrapper.textContent?.trim()).toBe('Name');
		// StyleX compiles the inline-flex layout to a class on this wrapper;
		// assert the class hook is present.
		expect(wrapper.className).not.toBe('');
		const kids = Array.from(wrapper.childNodes);
		expect(kids.indexOf(toggle)).toBeLessThan(
			kids.findIndex((n) => n.textContent?.trim() === 'Name' && n !== toggle)
		);
	});
});
