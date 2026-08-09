import type { UseTableRowExpansionConfig } from './use-table-row-expansion.js';

/**
 * Ported from the `useTableRowExpansionState` half of Astryx's
 * `Table/plugins/rowExpansion/useTableRowExpansion.tsx`. It lives in its own
 * module because it needs runes and the plugin hook does not — the split
 * `selection` and `sortable` already make.
 *
 * @deprecated Superseded by the tree plugin (useTableTreeData +
 *   useTableTreeState). Kept for back-compat; new tree tables should use the
 *   tree plugin. See the migration guide on useTableRowExpansion.
 *
 * The tree walks transcribe verbatim: depth is recorded for *visible*
 * descendants only (the walk stops at a collapsed row), while `allExpandableKeys`
 * walks the whole tree so expand-all reaches rows that are not rendered yet.
 * Four translations:
 *
 * - **`useMemo` → `$derived.by`.** Same memo, with the dependency array
 *   inferred instead of maintained. `useCallback` has nothing to become: a
 *   closure over the config getter is already stable and already live.
 * - **`setExpandedKeys` is a plain setter**, not
 *   `React.Dispatch<SetStateAction<Set<string>>>`. The updater form exists
 *   because a React setter may read stale state inside a batch; `$state` reads
 *   are always current, so `onToggle` derives the next set from the
 *   `expandedKeys` it was handed. `useTableSelectionState` set this precedent
 *   and its docstring carries the full reasoning.
 * - **The result's members are getters.** Upstream returns a fresh object per
 *   render; this hook returns one object for the component's lifetime, so a
 *   plain property would freeze the first flattening. The same applies inside
 *   `expansionConfig`, whose `expandedKeys` and `isAllExpanded` are values
 *   rather than functions.
 * - **`getIsItemExpandable` is forwarded, still possibly `undefined`.**
 *   `useTableRowExpansion` branches on its presence, so wrapping it in an arrow
 *   would silently disable that branch; the getter keeps both the value and the
 *   absence live.
 *
 * Every `Set` and `Map` here is a plain one, with `svelte/prefer-svelte-reactivity`
 * disabled at each site. Two reasons, the same pair `useTableSelectionState`
 * records: `expandedKeys` is `Set<string>` in upstream's published config type,
 * so it is not ours to change; and the rest are built fresh inside a `$derived`
 * (or handed straight to the consumer's setter) and never mutated afterwards, so
 * the derived is already the reactive boundary.
 */

// =============================================================================
// Config
// =============================================================================

/**
 * Configuration for {@link useTableRowExpansionState}.
 *
 * Mirrors the shape of `useTableSelectionState`: you own the
 * `expandedKeys` set (via `$state`), and the hook derives everything the
 * plugin needs — the flattened `data`, per-row depth, expand/collapse
 * handlers, and the expand-all toggle state.
 */
export interface UseTableRowExpansionStateConfig<T extends Record<string, unknown>> {
	/** The full, un-flattened tree. */
	baseData: T[];
	/** Return the children of a row. Leaf rows return an empty array. */
	getChildren: (item: T) => T[];
	/** Derive a stable unique key from a row item. */
	getRowKey: (item: T) => string;
	/**
	 * Should this row be expandable? Rows that return `false` never show a
	 * chevron and are skipped by expand-all. @default rows with children
	 */
	getIsItemExpandable?: (item: T) => boolean;
	/** Controlled set of currently-expanded row keys. */
	expandedKeys: Set<string>;
	/**
	 * Setter for the controlled expanded keys. Receives the next set; upstream's
	 * updater-function form has no counterpart, because a `$state` read is never
	 * stale.
	 */
	setExpandedKeys: (next: Set<string>) => void;
}

export interface UseTableRowExpansionStateResult<T extends Record<string, unknown>> {
	/** The flattened, currently-visible rows. Pass to `<Table data>`. */
	readonly data: T[];
	/** Ready-to-use config for `useTableRowExpansion`. */
	readonly expansionConfig: UseTableRowExpansionConfig<T>;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Manages row-expansion state and derives the config for
 * {@link useTableRowExpansion}.
 *
 * @deprecated Use `useTableTreeState` (with `useTableTreeData`) instead. The
 * tree plugin covers the same affordances (expand-all header control,
 * whole-row click) with a cycle guard and per-row fine-grained re-render. See
 * the migration guide in the `useTableRowExpansion` docs for the before/after
 * and config mapping.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let expandedKeys = $state(new Set<string>());
 *   const expansionState = useTableRowExpansionState(() => ({
 *     baseData: tree,
 *     getChildren: (item) => item.children ?? [],
 *     getRowKey: (item) => item.id,
 *     expandedKeys,
 *     setExpandedKeys: (next) => (expandedKeys = next)
 *   }));
 *   const expansion = useTableRowExpansion(() => expansionState.expansionConfig);
 * </script>
 * <Table data={expansionState.data} {columns} idKey="id" plugins={{ expansion }} />
 * ```
 */
export function useTableRowExpansionState<T extends Record<string, unknown>>(
	config: () => UseTableRowExpansionStateConfig<T>
): UseTableRowExpansionStateResult<T> {
	const isExpandable = (item: T): boolean => {
		const { getIsItemExpandable, getChildren } = config();
		return getIsItemExpandable ? getIsItemExpandable(item) : getChildren(item).length > 0;
	};

	const depthMap = $derived.by(() => {
		const { baseData, getChildren, getRowKey, expandedKeys } = config();
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const map = new Map<string, number>();
		// Ancestor keys on the current walk path — guards against cyclic data.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const path = new Set<string>();
		function walk(items: T[], depth: number): void {
			for (const item of items) {
				const key = getRowKey(item);
				if (path.has(key)) {
					continue; // cyclic edge — skip
				}
				map.set(key, depth);
				if (expandedKeys.has(key)) {
					path.add(key);
					walk(getChildren(item), depth + 1);
					path.delete(key);
				}
			}
		}
		walk(baseData, 0);
		return map;
	});

	const data = $derived.by(() => {
		const { baseData, getChildren, getRowKey, expandedKeys } = config();
		const result: T[] = [];
		// Ancestor keys on the current walk path — guards against cyclic data.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const path = new Set<string>();
		function walk(items: T[]): void {
			for (const item of items) {
				const key = getRowKey(item);
				if (path.has(key)) {
					continue; // cyclic edge — skip
				}
				result.push(item);
				if (expandedKeys.has(key)) {
					path.add(key);
					walk(getChildren(item));
					path.delete(key);
				}
			}
		}
		walk(baseData);
		return result;
	});

	// Every expandable key across the whole tree (drives expand-all).
	const allExpandableKeys = $derived.by(() => {
		const { baseData, getChildren, getRowKey } = config();
		const keys: string[] = [];
		// Ancestor keys on the current walk path — guards against cyclic data.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const path = new Set<string>();
		function walk(items: T[]): void {
			for (const item of items) {
				const key = getRowKey(item);
				if (path.has(key)) {
					continue; // cyclic edge — skip
				}
				if (isExpandable(item)) {
					keys.push(key);
					path.add(key);
					walk(getChildren(item));
					path.delete(key);
				}
			}
		}
		walk(baseData);
		return keys;
	});

	const isAllExpanded = $derived.by((): boolean | 'indeterminate' => {
		if (allExpandableKeys.length === 0) {
			return false;
		}
		const { expandedKeys } = config();
		const expandedCount = allExpandableKeys.filter((k) => expandedKeys.has(k)).length;
		if (expandedCount === 0) {
			return false;
		}
		if (expandedCount === allExpandableKeys.length) {
			return true;
		}
		return 'indeterminate';
	});

	const getDepth = (item: T): number => depthMap.get(config().getRowKey(item)) ?? 0;

	const onToggle = (key: string): void => {
		const { expandedKeys, setExpandedKeys } = config();
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const next = new Set(expandedKeys);
		if (next.has(key)) {
			next.delete(key);
		} else {
			next.add(key);
		}
		setExpandedKeys(next);
	};

	const onToggleExpandAll = (expand: boolean): void => {
		config().setExpandedKeys(
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			expand ? new Set(allExpandableKeys) : new Set()
		);
	};

	const expansionConfig: UseTableRowExpansionConfig<T> = {
		get expandedKeys(): Set<string> {
			return config().expandedKeys;
		},
		onToggle,
		get getRowKey(): (item: T) => string {
			return config().getRowKey;
		},
		get getChildren(): (item: T) => T[] {
			return config().getChildren;
		},
		getDepth,
		get getIsItemExpandable(): ((item: T) => boolean) | undefined {
			return config().getIsItemExpandable;
		},
		get isAllExpanded(): boolean | 'indeterminate' {
			return isAllExpanded;
		},
		onToggleExpandAll
	};

	return {
		get data(): T[] {
			return data;
		},
		get expansionConfig(): UseTableRowExpansionConfig<T> {
			return expansionConfig;
		}
	};
}
