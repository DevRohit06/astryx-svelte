import { describe, expect, it, vi } from 'vitest';
import { useTableTreeState } from '$lib/components/table/plugins/tree/use-table-tree-state.svelte.js';

/**
 * Ported from Astryx's `Table/plugins/tree/useTableTreeState.test.tsx` — all
 * **36** of its `it` cases, in upstream's order and under upstream's names.
 * Nothing dropped.
 *
 * ## Standing translations
 *
 * - **`renderHook` has no counterpart, and needs none here.**
 *   `useTableTreeState` reads no context and registers no `$effect`, so it can
 *   be called directly — which is what `renderHook` *is*: run the hook with no
 *   surrounding component. `result.current.x` becomes `state.x`, since the
 *   result's members are getters (see the hook's docstring on why they must be,
 *   and why destructuring this result is the mistake it invites).
 * - **`act(() => …)` disappears.** A `$state` write is visible to the next read,
 *   so the wrapper has nothing to flush.
 * - **`rerender({expanded})` becomes a `$state` reassignment** in the one
 *   controlled case, which is the same thing: the hook's config getter reads a
 *   source that changed. That single case is why this file is
 *   `*.svelte.test.ts` (runes compiled, client project) rather than a node
 *   `*.test.ts` — a plain `let` would not invalidate the flatten's `$derived`.
 *   Nothing in the suite touches the DOM.
 *
 * ## Restated cases (assertion changed; each says so at its site)
 *
 * - "never mutates the consumer data when sortSiblings sorts in place" — the
 *   flatten is a `$derived`, so it is lazy where React's `useMemo` is eager.
 *   Reading `visibleData` is added so the walk actually runs; without it the
 *   assertion would pass without `sortSiblings` ever being called.
 */

// =============================================================================
// Test Data
// =============================================================================

interface FileRow extends Record<string, unknown> {
	id: string;
	name: string;
	size: number;
	children?: FileRow[];
}

/**
 * src/
 *   components/
 *     Button.tsx
 *     Input.tsx
 *   utils.ts
 * README.md
 */
const fileTree: FileRow[] = [
	{
		id: 'src',
		name: 'src',
		size: 0,
		children: [
			{
				id: 'components',
				name: 'components',
				size: 0,
				children: [
					{ id: 'button', name: 'Button.tsx', size: 120 },
					{ id: 'input', name: 'Input.tsx', size: 80 }
				]
			},
			{ id: 'utils', name: 'utils.ts', size: 40 }
		]
	},
	{ id: 'readme', name: 'README.md', size: 10 }
];

const ids = (rows: FileRow[]) => rows.map((r) => r.id);

// =============================================================================
// Flattening
// =============================================================================

describe('useTableTreeState — flattening', () => {
	it('emits only root rows when nothing is expanded', () => {
		const state = useTableTreeState<FileRow>(() => ({ data: fileTree, idKey: 'id' }));

		expect(ids(state.visibleData)).toEqual(['src', 'readme']);
	});

	it('reveals children of defaultExpandedIds in depth-first order', () => {
		const state = useTableTreeState<FileRow>(() => ({
			data: fileTree,
			idKey: 'id',
			defaultExpandedIds: ['src', 'components']
		}));

		expect(ids(state.visibleData)).toEqual([
			'src',
			'components',
			'button',
			'input',
			'utils',
			'readme'
		]);
	});

	it('keeps a collapsed subtree unmounted even when its descendants are in the expanded set', () => {
		// 'components' is expanded but its parent 'src' is not — nothing below
		// 'src' is visible.
		const state = useTableTreeState<FileRow>(() => ({
			data: fileTree,
			idKey: 'id',
			defaultExpandedIds: ['components']
		}));

		expect(ids(state.visibleData)).toEqual(['src', 'readme']);
	});
});

// =============================================================================
// Toggling (uncontrolled)
// =============================================================================

describe('useTableTreeState — uncontrolled toggling', () => {
	it('expands a row via treeConfig.onToggleItem', () => {
		const state = useTableTreeState<FileRow>(() => ({ data: fileTree, idKey: 'id' }));

		state.treeConfig.onToggleItem(fileTree[0]);

		expect(ids(state.visibleData)).toEqual(['src', 'components', 'utils', 'readme']);
	});

	it('collapses an expanded row via treeConfig.onToggleItem', () => {
		const state = useTableTreeState<FileRow>(() => ({
			data: fileTree,
			idKey: 'id',
			defaultExpandedIds: ['src']
		}));

		state.treeConfig.onToggleItem(fileTree[0]);

		expect(ids(state.visibleData)).toEqual(['src', 'readme']);
	});
});

// =============================================================================
// Controlled mode
// =============================================================================

describe('useTableTreeState — controlled mode', () => {
	it('derives visibility from the controlled expandedIds set', () => {
		// Upstream's `rerender({expanded})`: the owner hands down a new set.
		let expanded = $state<ReadonlySet<string>>(new Set<string>());
		const state = useTableTreeState<FileRow>(() => ({
			data: fileTree,
			idKey: 'id',
			expandedIds: expanded,
			onExpandedIdsChange: () => {}
		}));

		expect(ids(state.visibleData)).toEqual(['src', 'readme']);

		expanded = new Set(['src']);
		expect(ids(state.visibleData)).toEqual(['src', 'components', 'utils', 'readme']);
	});

	it('reports toggles through onExpandedIdsChange without mutating its own state', () => {
		const onExpandedIdsChange = vi.fn();
		const state = useTableTreeState<FileRow>(() => ({
			data: fileTree,
			idKey: 'id',
			expandedIds: new Set<string>(),
			onExpandedIdsChange
		}));

		state.treeConfig.onToggleItem(fileTree[0]);

		expect(onExpandedIdsChange).toHaveBeenCalledWith(new Set(['src']));
		// Controlled: the visible rows only change when the owner passes a new set.
		expect(ids(state.visibleData)).toEqual(['src', 'readme']);
	});

	it('fires onExpandedIdsChange in uncontrolled mode too', () => {
		const onExpandedIdsChange = vi.fn();
		const state = useTableTreeState<FileRow>(() => ({
			data: fileTree,
			idKey: 'id',
			onExpandedIdsChange
		}));

		state.treeConfig.onToggleItem(fileTree[0]);

		expect(onExpandedIdsChange).toHaveBeenCalledWith(new Set(['src']));
		expect(ids(state.visibleData)).toEqual(['src', 'components', 'utils', 'readme']);
	});
});

// =============================================================================
// expandAll / collapseAll
// =============================================================================

describe('useTableTreeState — expandAll / collapseAll', () => {
	it('expandAll reveals every level of the tree', () => {
		const state = useTableTreeState<FileRow>(() => ({ data: fileTree, idKey: 'id' }));

		state.expandAll();

		expect(ids(state.visibleData)).toEqual([
			'src',
			'components',
			'button',
			'input',
			'utils',
			'readme'
		]);
	});

	it('collapseAll returns to roots only', () => {
		const state = useTableTreeState<FileRow>(() => ({
			data: fileTree,
			idKey: 'id',
			defaultExpandedIds: ['src', 'components']
		}));

		state.collapseAll();

		expect(ids(state.visibleData)).toEqual(['src', 'readme']);
	});

	it('exposes the current expandedIds set', () => {
		const state = useTableTreeState<FileRow>(() => ({
			data: fileTree,
			idKey: 'id',
			defaultExpandedIds: ['src']
		}));

		expect(state.expandedIds).toEqual(new Set(['src']));
	});
});

// =============================================================================
// Row meta
// =============================================================================

describe('useTableTreeState — row meta', () => {
	it('reports 0-based level, hasChildren, and isExpanded per row', () => {
		const state = useTableTreeState<FileRow>(() => ({
			data: fileTree,
			idKey: 'id',
			defaultExpandedIds: ['src', 'components']
		}));

		const meta = (id: string) => {
			const item = state.visibleData.find((r) => r.id === id);
			if (!item) {
				throw new Error(`row ${id} not visible`);
			}
			return state.treeConfig.getRowMeta(item);
		};

		expect(meta('src')).toEqual({ id: 'src', level: 0, hasChildren: true, isExpanded: true });
		expect(meta('components')).toEqual({
			id: 'components',
			level: 1,
			hasChildren: true,
			isExpanded: true
		});
		expect(meta('button')).toEqual({
			id: 'button',
			level: 2,
			hasChildren: false,
			isExpanded: false
		});
		expect(meta('readme')).toEqual({
			id: 'readme',
			level: 0,
			hasChildren: false,
			isExpanded: false
		});
	});

	it('treats an empty children array as a leaf', () => {
		const data: FileRow[] = [
			{ id: 'a', name: 'a', size: 0, children: [] },
			{ id: 'b', name: 'b', size: 0, children: [{ id: 'c', name: 'c', size: 0 }] }
		];
		const state = useTableTreeState<FileRow>(() => ({ data, idKey: 'id' }));

		expect(state.treeConfig.getRowMeta(data[0])?.hasChildren).toBe(false);
		expect(state.treeConfig.getRowMeta(data[1])?.hasChildren).toBe(true);
	});

	it('flags hasExpandableRows=false for flat data (migration no-op)', () => {
		const flat: FileRow[] = [
			{ id: 'a', name: 'a', size: 1 },
			{ id: 'b', name: 'b', size: 2 }
		];
		const state = useTableTreeState<FileRow>(() => ({ data: flat, idKey: 'id' }));

		expect(state.treeConfig.hasExpandableRows).toBe(false);
	});

	it('flags hasExpandableRows=true when any row has children', () => {
		const state = useTableTreeState<FileRow>(() => ({ data: fileTree, idKey: 'id' }));

		expect(state.treeConfig.hasExpandableRows).toBe(true);
	});
});

// =============================================================================
// Lazy loading (isItemExpandable)
// =============================================================================

describe('useTableTreeState — isItemExpandable', () => {
	it('forces an expander on rows whose children have not loaded yet', () => {
		const lazy: FileRow[] = [
			{ id: 'folder', name: 'folder', size: 0 }, // no children yet
			{ id: 'file', name: 'file', size: 5 }
		];
		const state = useTableTreeState<FileRow>(() => ({
			data: lazy,
			idKey: 'id',
			isItemExpandable: (item) => item.id === 'folder'
		}));

		expect(state.treeConfig.getRowMeta(lazy[0])?.hasChildren).toBe(true);
		expect(state.treeConfig.getRowMeta(lazy[1])?.hasChildren).toBe(false);
		expect(state.treeConfig.hasExpandableRows).toBe(true);
	});

	it('expandAll includes isItemExpandable rows without loaded children', () => {
		const lazy: FileRow[] = [{ id: 'folder', name: 'folder', size: 0 }];
		const onExpandedIdsChange = vi.fn();
		const state = useTableTreeState<FileRow>(() => ({
			data: lazy,
			idKey: 'id',
			isItemExpandable: () => true,
			onExpandedIdsChange
		}));

		state.expandAll();

		expect(onExpandedIdsChange).toHaveBeenCalledWith(new Set(['folder']));
	});
});

// =============================================================================
// Sibling sorting
// =============================================================================

describe('useTableTreeState — sortSiblings', () => {
	it('sorts within sibling groups, never across levels', () => {
		const byNameDesc = (siblings: FileRow[]) =>
			[...siblings].sort((a, b) => b.name.localeCompare(a.name));

		const state = useTableTreeState<FileRow>(() => ({
			data: fileTree,
			idKey: 'id',
			defaultExpandedIds: ['src', 'components'],
			sortSiblings: byNameDesc
		}));

		// Roots sorted desc: src > README.md; src's children desc: utils > components;
		// components' children desc: Input.tsx > Button.tsx. Children always stay
		// directly under their parent.
		expect(ids(state.visibleData)).toEqual([
			'src',
			'utils',
			'components',
			'input',
			'button',
			'readme'
		]);
	});
});

// =============================================================================
// Accessors
// =============================================================================

describe('useTableTreeState — accessors', () => {
	it('supports a custom childrenKey', () => {
		interface OrgRow extends Record<string, unknown> {
			id: string;
			reports?: OrgRow[];
		}
		const org: OrgRow[] = [{ id: 'ceo', reports: [{ id: 'cto' }, { id: 'cfo' }] }];
		const state = useTableTreeState<OrgRow>(() => ({
			data: org,
			idKey: 'id',
			childrenKey: 'reports',
			defaultExpandedIds: ['ceo']
		}));

		expect(state.visibleData.map((r) => r.id)).toEqual(['ceo', 'cto', 'cfo']);
	});

	it('supports a function idKey returning numbers', () => {
		interface NumRow extends Record<string, unknown> {
			num: number;
			children?: NumRow[];
		}
		const data: NumRow[] = [{ num: 1, children: [{ num: 2 }] }];
		const state = useTableTreeState<NumRow>(() => ({
			data,
			idKey: (item) => item.num,
			defaultExpandedIds: ['1']
		}));

		expect(state.visibleData.map((r) => r.num)).toEqual([1, 2]);
	});

	it('passes indent and treeColumnKey through to the tree config', () => {
		const state = useTableTreeState<FileRow>(() => ({
			data: fileTree,
			idKey: 'id',
			indent: 'lg',
			treeColumnKey: 'name'
		}));

		expect(state.treeConfig.indent).toBe('lg');
		expect(state.treeConfig.treeColumnKey).toBe('name');
	});
});

// =============================================================================
// Hostile / degenerate data
// =============================================================================

describe('useTableTreeState — hostile data', () => {
	it('does not blow the stack on a self-referencing cycle', () => {
		const a: FileRow = { id: 'a', name: 'a', size: 0 };
		a.children = [a]; // self-cycle
		const state = useTableTreeState<FileRow>(() => ({
			data: [a],
			idKey: 'id',
			defaultExpandedIds: ['a']
		}));

		// The cyclic edge is skipped: 'a' renders exactly once.
		expect(ids(state.visibleData)).toEqual(['a']);
	});

	it('does not blow the stack when a descendant points back at an ancestor', () => {
		const parent: FileRow = { id: 'p', name: 'p', size: 0 };
		const child: FileRow = { id: 'c', name: 'c', size: 0, children: [parent] };
		parent.children = [child];
		const state = useTableTreeState<FileRow>(() => ({
			data: [parent],
			idKey: 'id',
			defaultExpandedIds: ['p', 'c']
		}));

		expect(ids(state.visibleData)).toEqual(['p', 'c']);
	});

	it('renders duplicate ids in different subtrees without crashing (shared expansion state)', () => {
		const data: FileRow[] = [
			{
				id: 'x',
				name: 'first-x',
				size: 0,
				children: [{ id: 'dup', name: 'dup-under-x', size: 1 }]
			},
			{
				id: 'y',
				name: 'second-y',
				size: 0,
				children: [{ id: 'dup', name: 'dup-under-y', size: 2 }]
			}
		];
		const state = useTableTreeState<FileRow>(() => ({
			data,
			idKey: 'id',
			defaultExpandedIds: ['x', 'y']
		}));

		// Both duplicate rows stay visible; ids sharing a key share expansion.
		expect(ids(state.visibleData)).toEqual(['x', 'dup', 'y', 'dup']);
	});

	it('ignores expanded ids that match no row', () => {
		const state = useTableTreeState<FileRow>(() => ({
			data: fileTree,
			idKey: 'id',
			defaultExpandedIds: ['ghost', 'src']
		}));

		expect(ids(state.visibleData)).toEqual(['src', 'components', 'utils', 'readme']);
	});

	it('handles empty data', () => {
		const state = useTableTreeState<FileRow>(() => ({ data: [], idKey: 'id' }));

		expect(state.visibleData).toEqual([]);
		expect(state.treeConfig.hasExpandableRows).toBe(false);
		state.expandAll(); // must not throw
		expect(state.expandedIds).toEqual(new Set());
	});

	/**
	 * **Restated.** Upstream only calls `renderHook`, because `useMemo` flattens
	 * eagerly during that render. Here the flatten is a `$derived` and runs on
	 * first read, so `visibleData` is read first — otherwise `sortSiblings` never
	 * runs and the assertion is vacuous.
	 */
	it('never mutates the consumer data when sortSiblings sorts in place', () => {
		const inPlaceSorter = (siblings: FileRow[]) =>
			siblings.sort((a, b) => b.name.localeCompare(a.name));

		const childOrderBefore = fileTree[0].children!.map((c) => c.id);
		const state = useTableTreeState<FileRow>(() => ({
			data: fileTree,
			idKey: 'id',
			defaultExpandedIds: ['src'],
			sortSiblings: inPlaceSorter
		}));
		expect(ids(state.visibleData)).toEqual(['src', 'utils', 'components', 'readme']);

		expect(fileTree[0].children!.map((c) => c.id)).toEqual(childOrderBefore);
	});
});

// =============================================================================
// Semantics edge cases
// =============================================================================

describe('useTableTreeState — semantics edges', () => {
	it('defaultExpandedIds is ignored when expandedIds is controlled', () => {
		const state = useTableTreeState<FileRow>(() => ({
			data: fileTree,
			idKey: 'id',
			defaultExpandedIds: ['src'],
			expandedIds: new Set<string>(),
			onExpandedIdsChange: () => {}
		}));

		expect(ids(state.visibleData)).toEqual(['src', 'readme']);
	});

	it('toggling a leaf never marks it expanded', () => {
		const state = useTableTreeState<FileRow>(() => ({ data: fileTree, idKey: 'id' }));
		const readme = fileTree[1];

		state.treeConfig.onToggleItem(readme);

		expect(state.treeConfig.getRowMeta(readme)).toEqual({
			id: 'readme',
			level: 0,
			hasChildren: false,
			isExpanded: false
		});
		expect(ids(state.visibleData)).toEqual(['src', 'readme']);
	});
});

// =============================================================================
// isAllExpanded (drives the header expand-all control)
// =============================================================================

describe('useTableTreeState: isAllExpanded', () => {
	it('reports false when nothing is expanded', () => {
		const state = useTableTreeState<FileRow>(() => ({ data: fileTree, idKey: 'id' }));

		expect(state.isAllExpanded).toBe(false);
	});

	it('reports true only when every expandable row is expanded', () => {
		const state = useTableTreeState<FileRow>(() => ({ data: fileTree, idKey: 'id' }));

		state.expandAll();

		expect(state.isAllExpanded).toBe(true);
	});

	it("reports 'indeterminate' when some but not all expandable rows are expanded", () => {
		const state = useTableTreeState<FileRow>(() => ({
			data: fileTree,
			idKey: 'id',
			defaultExpandedIds: ['src']
		}));

		// 'src' and 'components' are both expandable; only 'src' is expanded.
		expect(state.isAllExpanded).toBe('indeterminate');
	});

	it('returns to false after collapseAll', () => {
		const state = useTableTreeState<FileRow>(() => ({
			data: fileTree,
			idKey: 'id',
			defaultExpandedIds: ['src', 'components']
		}));

		state.collapseAll();

		expect(state.isAllExpanded).toBe(false);
	});

	it('reports false for flat data (no expandable rows)', () => {
		const flat: FileRow[] = [
			{ id: 'a', name: 'A', size: 1 },
			{ id: 'b', name: 'B', size: 2 }
		];
		const state = useTableTreeState<FileRow>(() => ({ data: flat, idKey: 'id' }));

		expect(state.isAllExpanded).toBe(false);
	});

	it('ignores expanded ids that match no expandable row when aggregating', () => {
		// 'readme' is a leaf (not expandable) and 'ghost' matches nothing; neither
		// should count toward the expandable total, so an all-expandable set that
		// omits them still reads as fully expanded.
		const state = useTableTreeState<FileRow>(() => ({
			data: fileTree,
			idKey: 'id',
			defaultExpandedIds: ['src', 'components', 'readme', 'ghost']
		}));

		expect(state.isAllExpanded).toBe(true);
	});

	it('exposes the aggregate state and expand/collapse handlers through treeConfig', () => {
		const state = useTableTreeState<FileRow>(() => ({ data: fileTree, idKey: 'id' }));

		// The headless plugin reads everything it needs to render the header
		// expand-all control from treeConfig, not from the state hook directly.
		expect(state.treeConfig.isAllExpanded).toBe(false);

		state.treeConfig.onExpandAll?.();
		expect(state.isAllExpanded).toBe(true);
		expect(state.treeConfig.isAllExpanded).toBe(true);

		state.treeConfig.onCollapseAll?.();
		expect(state.isAllExpanded).toBe(false);
		expect(state.treeConfig.isAllExpanded).toBe(false);
	});
});
