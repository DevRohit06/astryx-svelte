import type { TableTreeRowMeta, UseTableTreeDataConfig } from './use-table-tree-data.js';

/**
 * Ported from Astryx's `Table/plugins/tree/useTableTreeState.tsx`.
 *
 * The flattening walk transcribes verbatim, including the two subtleties that
 * are easy to lose: the ancestor-chain `path` set, so a cyclic edge is skipped
 * instead of recursing forever, and the `[...items]` copy before `sortSiblings`,
 * so an in-place sorter cannot reorder the consumer's own data. Collapsed
 * subtrees stay *unmounted* rather than hidden, which is upstream's design and
 * the reason `visibleData` exists at all.
 *
 * The translations:
 *
 * - **`config` is a getter**, as every published hook in this port takes.
 * - **`useState` → `$state`** for the uncontrolled branch, seeded from
 *   `defaultExpandedIds` at init exactly as `useState`'s initial value is — a
 *   later change is ignored, which is what "default" means on both sides. The
 *   controlled/uncontrolled resolution is upstream's, unchanged.
 * - **The result's members are getters.** Upstream returns a fresh object per
 *   render, so a consumer reading `visibleData` always sees the current value; a
 *   Svelte hook returns one object for the component's lifetime, so a plain
 *   property would freeze the first flatten. `treeConfig` is the exception on
 *   purpose: it is one stable object whose *own* members are the live part, and
 *   its stability is what lets `useTableTreeData.transformColumns` avoid
 *   re-running on every toggle (see that file's note on the deleted column
 *   cache). `hasExpandableRows` / `indent` / `treeColumnKey` are getters on it;
 *   `getRowMeta` and `onToggleItem` are stable functions, so *reading* them
 *   subscribes to nothing and only *calling* `getRowMeta` reaches the flatten.
 * - **The three `useCallback`s and the two `useMemo`s are gone.** They exist to
 *   keep `getId` / `getChildren` / `getIsExpandable` and the two walks stable
 *   against inline-prop identity churn; a closure over the config getter is
 *   already stable, and a `$derived` reading through it already recomputes only
 *   when its inputs change.
 * - **Both `useRef`s are gone.** `onExpandedIdsChangeRef` is pure identity
 *   hygiene. `expandedIdsRef` also advances itself inside `commitExpandedIds` so
 *   a second toggle in the same React batch builds on the first rather than on
 *   the pre-batch set; a `$state` write is readable immediately, and a
 *   controlled consumer's own `$state` write is too, so re-reading the resolved
 *   `expandedIds` is that behaviour without the shadow copy.
 *
 * Every `Set`/`Map` here is a plain one, with `svelte/prefer-svelte-reactivity`
 * disabled at each site. Two reasons, and they are the same ones
 * `useTableSelectionState` records: `expandedIds` is `ReadonlySet<string>` in
 * upstream's published config and result types, so it is not ours to change;
 * and the rest are built fresh inside a `$derived` (or are scratch inside one
 * walk) and never mutated afterwards, so the derived is already the reactive
 * boundary and a `SvelteSet` would add signal bookkeeping with no reader.
 */

// =============================================================================
// Config
// =============================================================================

export interface UseTableTreeStateConfig<T extends Record<string, unknown>> {
	/** Nested data: rows may carry child rows under `childrenKey`. */
	data: T[];
	/** Row ID accessor: property name, or a function returning a unique id. */
	idKey: (keyof T & string) | ((item: T) => string | number);
	/**
	 * Property holding each row's children array.
	 * @default 'children'
	 */
	childrenKey?: string;
	/** Initial expanded row ids for uncontrolled mode. Ignored when `expandedIds` is provided. */
	defaultExpandedIds?: Iterable<string>;
	/**
	 * Controlled set of expanded row ids. When provided, the hook uses this
	 * instead of internal state. Pair with `onExpandedIdsChange`.
	 */
	expandedIds?: ReadonlySet<string>;
	/** Called with the next expanded set whenever expansion changes. */
	onExpandedIdsChange?: (ids: ReadonlySet<string>) => void;
	/**
	 * Should this row show an expander? Overrides the default
	 * "has a non-empty children array" check — use for lazy loading, where a
	 * row is expandable before its children have been fetched.
	 */
	isItemExpandable?: (item: T) => boolean;
	/**
	 * Sort each sibling group independently during flattening. Children always
	 * stay directly under their parent — sorting never crosses levels. Pass
	 * `applySort` from `useTableSortableState` to compose with column sorting.
	 */
	sortSiblings?: (siblings: T[]) => T[];
	/** Indent step per level, forwarded to useTableTreeData. */
	indent?: 'sm' | 'md' | 'lg';
	/** Column that carries the tree affordance, forwarded to useTableTreeData. */
	treeColumnKey?: string;
}

// =============================================================================
// Result
// =============================================================================

export interface UseTableTreeStateResult<T extends Record<string, unknown>> {
	/** The flattened, currently-visible rows. Pass to `<Table data>`. */
	readonly visibleData: T[];
	/** Ready-to-use config for useTableTreeData. */
	readonly treeConfig: UseTableTreeDataConfig<T>;
	/** The current expanded row ids. */
	readonly expandedIds: ReadonlySet<string>;
	/**
	 * Aggregate expansion state across every expandable row: `true` when all are
	 * expanded, `false` when none are, `'indeterminate'` when some but not all
	 * are. Drives the header expand-all control. Reports `false` for flat data.
	 */
	readonly isAllExpanded: boolean | 'indeterminate';
	/** Expand every expandable row in the tree. */
	expandAll: () => void;
	/** Collapse every row. */
	collapseAll: () => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * `useTableTreeState` — owns the expanded set and flattens nested data.
 *
 * Convenience layer over {@link useTableTreeData}: it produces both the visible
 * flattened rows and a ready-to-use config for the headless plugin, so data
 * shaping stays outside the render pipeline and `Table` receives exactly the
 * rows it renders.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const tree = useTableTreeState(() => ({
 *     data: files, idKey: 'id', defaultExpandedIds: ['src']
 *   }));
 *   const treePlugin = useTableTreeData(() => tree.treeConfig);
 * </script>
 * <Table data={tree.visibleData} {columns} idKey="id" plugins={{ tree: treePlugin }} />
 * ```
 */
export function useTableTreeState<T extends Record<string, unknown>>(
	config: () => UseTableTreeStateConfig<T>
): UseTableTreeStateResult<T> {
	const getId = (item: T): string => {
		const { idKey } = config();
		return typeof idKey === 'function' ? String(idKey(item)) : String(item[idKey]);
	};

	const getChildren = (item: T): T[] => {
		const children = item[config().childrenKey ?? 'children'];
		return Array.isArray(children) ? (children as T[]) : [];
	};

	const getIsExpandable = (item: T): boolean => {
		const { isItemExpandable } = config();
		return isItemExpandable ? isItemExpandable(item) : getChildren(item).length > 0;
	};

	// Internal state (used in uncontrolled mode).
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	let internalExpandedIds = $state<ReadonlySet<string>>(new Set(config().defaultExpandedIds));

	// Resolve controlled vs uncontrolled
	const isControlled = $derived(config().expandedIds !== undefined);
	const expandedIds = $derived(
		isControlled ? (config().expandedIds as ReadonlySet<string>) : internalExpandedIds
	);

	const commitExpandedIds = (next: ReadonlySet<string>): void => {
		if (!isControlled) {
			internalExpandedIds = next;
		}
		config().onExpandedIdsChange?.(next);
	};

	// Flatten: depth-first walk emitting only visible rows, collecting per-row
	// meta ({level, hasChildren, isExpanded}) in the same pass. Children mount
	// only when their parent is expanded, so collapsed subtrees stay unmounted.
	// `path` holds the ids on the current ancestor chain: an edge pointing back
	// at an ancestor is skipped instead of recursing forever. Sibling arrays
	// are copied before sortSiblings so an in-place sorter can't reorder the
	// consumer's data.
	const flattened = $derived.by(() => {
		const { data, sortSiblings } = config();
		const rows: T[] = [];
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const meta = new Map<string, TableTreeRowMeta>();
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const path = new Set<string>();
		const walk = (items: T[], level: number): void => {
			const siblings = sortSiblings ? sortSiblings([...items]) : items;
			for (const item of siblings) {
				const id = getId(item);
				if (path.has(id)) {
					continue; // cyclic edge — this row is its own ancestor
				}
				const hasChildren = getIsExpandable(item);
				const isExpanded = hasChildren && expandedIds.has(id);
				rows.push(item);
				meta.set(id, { id, level, hasChildren, isExpanded });
				if (isExpanded) {
					path.add(id);
					walk(getChildren(item), level + 1);
					path.delete(id);
				}
			}
		};
		walk(data, 0);
		return { visibleData: rows, metaMap: meta };
	});

	// Every expandable row id across the whole tree, including collapsed
	// subtrees (drives expandAll and the migration no-op flag). Same
	// ancestor-chain guard as the flatten walk.
	const allExpandableIds = $derived.by(() => {
		const idsAcc: string[] = [];
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const path = new Set<string>();
		const walk = (items: T[]): void => {
			for (const item of items) {
				const id = getId(item);
				if (path.has(id)) {
					continue;
				}
				if (getIsExpandable(item)) {
					idsAcc.push(id);
				}
				path.add(id);
				walk(getChildren(item));
				path.delete(id);
			}
		};
		walk(config().data);
		return idsAcc;
	});

	const hasExpandableRows = $derived(allExpandableIds.length > 0);

	// Aggregate state for the header expand-all control. Only expandable ids
	// count toward the total, so expanded ids that match a leaf or no row at all
	// never skew the tally.
	const isAllExpanded = $derived.by<boolean | 'indeterminate'>(() => {
		if (!hasExpandableRows) {
			return false;
		}
		const expandedCount = allExpandableIds.filter((id) => expandedIds.has(id)).length;
		if (expandedCount === 0) {
			return false;
		}
		if (expandedCount === allExpandableIds.length) {
			return true;
		}
		return 'indeterminate';
	});

	const onToggleItem = (item: T): void => {
		const id = getId(item);
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const next = new Set(expandedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		commitExpandedIds(next);
	};

	const expandAll = (): void => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		commitExpandedIds(new Set(allExpandableIds));
	};

	const collapseAll = (): void => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		commitExpandedIds(new Set());
	};

	const getRowMeta = (item: T): TableTreeRowMeta | undefined => flattened.metaMap.get(getId(item));

	// One object for the hook's lifetime — see the module header for why that
	// matters to `transformColumns` — with the live members behind getters.
	const treeConfig: UseTableTreeDataConfig<T> = {
		getRowMeta,
		onToggleItem,
		get hasExpandableRows(): boolean {
			return hasExpandableRows;
		},
		get isAllExpanded(): boolean | 'indeterminate' {
			return isAllExpanded;
		},
		onExpandAll: expandAll,
		onCollapseAll: collapseAll,
		get indent(): 'sm' | 'md' | 'lg' | undefined {
			return config().indent;
		},
		get treeColumnKey(): string | undefined {
			return config().treeColumnKey;
		}
	};

	return {
		get visibleData(): T[] {
			return flattened.visibleData;
		},
		get treeConfig(): UseTableTreeDataConfig<T> {
			return treeConfig;
		},
		get expandedIds(): ReadonlySet<string> {
			return expandedIds;
		},
		get isAllExpanded(): boolean | 'indeterminate' {
			return isAllExpanded;
		},
		expandAll,
		collapseAll
	};
}
