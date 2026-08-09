import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness, { type TreeItem } from './fixtures/table-row-expansion-fixture.svelte';
import I18nHarness from './fixtures/table-row-expansion-i18n.svelte';
import StateProbe from './fixtures/table-row-expansion-state-probe.svelte';

/**
 * Ported from Astryx's
 * `Table/plugins/rowExpansion/useTableRowExpansion.test.tsx` — all **14** of its
 * `it` cases (10 `useTableRowExpansion`, 4 `useTableRowExpansionState cycle
 * guard`), in upstream's order and under upstream's names. Nothing dropped.
 *
 * ## Standing translations
 *
 * - **`renderHook` becomes a probe fixture.** The cycle-guard block renders no
 *   table: it reads `data` / `expansionConfig` straight off the hook.
 *   `table-row-expansion-state-probe.svelte` runs the hook during a component's
 *   init and exports the result, and `hook.result.current` becomes
 *   `render(...).component.state`. Nothing is snapshotted — the result's
 *   members are getters, which is the hook's own translation.
 * - **`InternationalizationProvider` wrapping the harness is its own fixture**
 *   (`table-row-expansion-i18n.svelte`), because a provider's `children` is a
 *   snippet and cannot be written inline in a `render()` props object.
 *
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
 * - **`screen.getByText('File A1')` becomes a trimmed `td` text query.** A
 *   Vitest/Playwright text locator matches the deepest element containing the
 *   text rather than an element's direct text children, and Svelte's compiled
 *   markup leaves whitespace text nodes inside a `<td>` that JSX does not.
 * - **`Harness` is a probe fixture**, because a hook has to run during a
 *   component's init.
 *
 * ## One thing the port changes that this suite still sees through
 *
 * `useTableRowExpansion` routes the **context-menu label** through the i18n
 * catalog, where upstream hardcodes `'Collapse row'` / `'Expand row'` (the two
 * aria labels beside it were already translated). The catalog's `en` defaults
 * are those exact strings, so the visible text is byte-identical and upstream's
 * `/expand row/i` assertion still asks the same question.
 */

function hasRowText(container: HTMLElement, text: string): boolean {
	return Array.from(container.querySelectorAll('tbody tr td')).some(
		(td) => td.textContent?.trim() === text
	);
}

function rightClick(el: Element): void {
	el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
}

function menuItems(container: HTMLElement, pattern: RegExp): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]')).filter((item) =>
		pattern.test(item.textContent ?? '')
	);
}

describe('useTableRowExpansion', () => {
	it('renders a chevron button for expandable rows', async () => {
		const screen = await render(Harness, { props: {} });
		const buttons = screen.getByRole('button', { name: /expand row/i }).elements();
		// Folder A and Folder B are expandable (top-level with children)
		expect(buttons.length).toBe(2);
	});

	it('shows child rows when expanded', async () => {
		const screen = await render(Harness, { props: { initialExpanded: new Set(['a']) } });
		expect(hasRowText(screen.container, 'File A1')).toBe(true);
		expect(hasRowText(screen.container, 'File A2')).toBe(true);
	});

	it('hides child rows when collapsed', async () => {
		const screen = await render(Harness, { props: {} });
		expect(hasRowText(screen.container, 'File A1')).toBe(false);
	});

	it('toggles expansion on chevron click', async () => {
		const screen = await render(Harness, { props: {} });
		expect(hasRowText(screen.container, 'File A1')).toBe(false);

		(screen.getByRole('button', { name: /expand row/i }).elements()[0] as HTMLElement).click();

		await expect.poll(() => hasRowText(screen.container, 'File A1')).toBe(true);
	});

	it('contributes a context-menu action on expandable rows', async () => {
		const screen = await render(Harness, { props: {} });

		rightClick(screen.getByText('Folder A', { exact: true }).element());

		await expect.poll(() => menuItems(screen.container, /expand row/i).length).toBeGreaterThan(0);
	});

	it('localizes the context-menu action label through the i18n catalog', async () => {
		const screen = await render(I18nHarness, {
			props: {
				locale: 'fr',
				overrides: { fr: { '@astryx.tableRowExpansion.expandRow': 'Développer la ligne' } }
			}
		});

		rightClick(screen.getByText('Folder A', { exact: true }).element());

		await expect
			.poll(() => menuItems(screen.container, /Développer la ligne/).length)
			.toBeGreaterThan(0);
	});

	it('does not show chevron for leaf nodes', async () => {
		const screen = await render(Harness, { props: {} });
		// Leaf C has no children
		expect(hasRowText(screen.container, 'Leaf C')).toBe(true);
		// only 2 expand buttons (Folder A, Folder B), not 3
		expect(screen.getByRole('button', { name: /expand row|collapse row/i }).elements().length).toBe(
			2
		);
	});

	it('renders an expand-all toggle in the header', async () => {
		const screen = await render(Harness, { props: {} });
		await expect
			.element(screen.getByRole('button', { name: /expand all rows/i }))
			.toBeInTheDocument();
	});

	it('expand-all toggle expands every expandable row', async () => {
		const screen = await render(Harness, { props: {} });
		expect(hasRowText(screen.container, 'File A1')).toBe(false);

		(screen.getByRole('button', { name: /expand all rows/i }).element() as HTMLElement).click();

		// Both folders' children become visible.
		await expect.poll(() => hasRowText(screen.container, 'File A1')).toBe(true);
		expect(hasRowText(screen.container, 'File A2')).toBe(true);
		expect(hasRowText(screen.container, 'File B1')).toBe(true);
	});

	it('collapse-all toggle collapses every row', async () => {
		const screen = await render(Harness, { props: { initialExpanded: new Set(['a', 'b']) } });
		expect(hasRowText(screen.container, 'File A1')).toBe(true);

		(screen.getByRole('button', { name: /collapse all rows/i }).element() as HTMLElement).click();

		await expect.poll(() => hasRowText(screen.container, 'File A1')).toBe(false);
		expect(hasRowText(screen.container, 'File B1')).toBe(false);
	});
});

// =============================================================================
// Cycle guard
// =============================================================================

describe('useTableRowExpansionState cycle guard', () => {
	/** A row whose children array contains the row itself (plus a real child). */
	function makeSelfReferential(): TreeItem[] {
		const x: TreeItem = { id: 'x', name: 'Self', children: [] };
		const y: TreeItem = { id: 'y', name: 'Leaf Y', children: [] };
		x.children.push(x, y);
		return [x];
	}

	/** root -> child -> grand, where grand's children point back at root. */
	function makeDeepCycle(): TreeItem[] {
		const root: TreeItem = { id: 'root', name: 'Root', children: [] };
		const child: TreeItem = { id: 'child', name: 'Child', children: [] };
		const grand: TreeItem = { id: 'grand', name: 'Grand', children: [] };
		root.children.push(child);
		child.children.push(grand);
		grand.children.push(root);
		return [root];
	}

	/**
	 * Upstream's `renderState` — `renderHook` over `useTableRowExpansionState`.
	 * The probe fixture runs the hook during a component's init and exports the
	 * result, which `render(...).component` reads; `hook.result.current` becomes
	 * that exported object, whose members are getters rather than a snapshot.
	 */
	async function renderState(baseData: TreeItem[], expandedKeys: Set<string>) {
		const setExpandedKeys = vi.fn();
		const screen = await render(StateProbe, {
			props: { baseData, expandedKeys, setExpandedKeys }
		});
		return { state: screen.component.state, setExpandedKeys };
	}

	it('terminates on a self-referential expanded row and flattens each key once', async () => {
		const { state } = await renderState(makeSelfReferential(), new Set(['x']));
		const { data, expansionConfig } = state;
		expect(data.map((item) => item.id)).toEqual(['x', 'y']);
		expect(expansionConfig.getDepth?.(data[0])).toBe(0);
		expect(expansionConfig.getDepth?.(data[1])).toBe(1);
	});

	it('terminates on a deeper cycle back to the root and flattens each key once', async () => {
		const { state } = await renderState(makeDeepCycle(), new Set(['root', 'child', 'grand']));
		const { data, expansionConfig } = state;
		expect(data.map((item) => item.id)).toEqual(['root', 'child', 'grand']);
		expect(expansionConfig.getDepth?.(data[0])).toBe(0);
		expect(expansionConfig.getDepth?.(data[1])).toBe(1);
		expect(expansionConfig.getDepth?.(data[2])).toBe(2);
		// The cycle guard keeps isAllExpanded computable — true, not a crash.
		expect(expansionConfig.isAllExpanded).toBe(true);
	});

	it('terminates when collecting allExpandableKeys on cyclic data with nothing expanded', async () => {
		const { state, setExpandedKeys } = await renderState(makeDeepCycle(), new Set<string>());
		const { data, expansionConfig } = state;
		expect(data.map((item) => item.id)).toEqual(['root']);
		expansionConfig.onToggleExpandAll?.(true);
		const nextKeys = setExpandedKeys.mock.calls[0][0] as Set<string>;
		expect(Array.from(nextKeys)).toEqual(['root', 'child', 'grand']);
	});

	it('re-walks a shared child under each expanded parent (ancestor-path, not visited-set, semantics)', async () => {
		const leaf: TreeItem = { id: 'leaf', name: 'Leaf', children: [] };
		const shared: TreeItem = { id: 's', name: 'Shared', children: [leaf] };
		const p1: TreeItem = { id: 'p1', name: 'Parent 1', children: [shared] };
		const p2: TreeItem = { id: 'p2', name: 'Parent 2', children: [shared] };
		const { state } = await renderState([p1, p2], new Set(['p1', 'p2', 's']));
		// 's' is on neither parent's ancestor path, so it must flatten under
		// both — the guard only skips true cycles, matching pre-guard behavior
		// for acyclic (DAG-shaped) data.
		expect(state.data.map((item) => item.id)).toEqual(['p1', 's', 'leaf', 'p2', 's', 'leaf']);
	});
});
