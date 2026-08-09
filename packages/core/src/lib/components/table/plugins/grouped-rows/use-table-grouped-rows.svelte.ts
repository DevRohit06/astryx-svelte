import type { Snippet } from 'svelte';
import { createSlotBinder } from '../../../../internal/bind-snippet.js';
import type { TablePlugin } from '../../table-types.js';
import { groupHeaderRowStyle } from './grouped-rows.stylex.js';
import { groupHeaderRow, type GroupHeaderArg } from './grouped-rows-slots.svelte';

/**
 * Ported from Astryx's
 * `Table/plugins/groupedRows/useTableGroupedRows.tsx`.
 *
 * The grouping and flattening logic transcribes verbatim, **including the
 * Proxy**. That deserves a note, because it looks like a React workaround and
 * is not: `BaseTable` evaluates `col.renderCell(item)` for every row before
 * `transformBodyRow` gets to replace a header row's cells, so a user renderer
 * doing `item.name.toUpperCase()` would throw on a synthetic header. The Proxy
 * resolves unknown fields to `''`. Our `BaseTable` builds cells in exactly the
 * same order (`bodyCellsFor` runs before `transformBodyRow` in
 * `bodyRowFragment`), so the hazard and the fix both carry over unchanged.
 *
 * `renderGroupHeader` becomes `Snippet<[string, number, boolean]>` — a render
 * prop taking arguments is a parameterised snippet, the port's settled shape.
 *
 * The header row's own `children` is a **keyed** bound snippet, keyed by the
 * same `__group_<groupKey>` string {@link UseTableGroupedRowsResult.idKey}
 * returns — the row's identity, and one that cannot collide with a real row's
 * key. Keying is what keeps the chevron button alive across a toggle:
 * `{@render}` branches on the bound snippet's function identity, so an unkeyed
 * binding would destroy the very button the collapse was triggered from and
 * drop focus to `<body>`. See `createSlotBinder`.
 *
 * The two `Map`s are plain, with `svelte/prefer-svelte-reactivity` disabled:
 * both are grouping scratch built inside a `$derived` and discarded or frozen
 * when it returns, so the derived is the reactive boundary.
 */

// A synthetic group-header row injected into the flattened data. Real rows
// never carry this marker.
const GROUP_HEADER = Symbol('tableGroupHeader');

interface GroupHeader {
	[GROUP_HEADER]: true;
	groupKey: string;
	count: number;
}

function isGroupHeader(item: unknown): item is GroupHeader {
	return (
		typeof item === 'object' &&
		item !== null &&
		(item as Record<symbol, unknown>)[GROUP_HEADER] === true
	);
}

// Proxy handler: any field access beyond the marker fields resolves to `''`
// so user cell renderers (`item.name.toUpperCase()`) never throw on a header.
const HEADER_PROXY_HANDLER: ProxyHandler<Record<string | symbol, unknown>> = {
	get(t: Record<string | symbol, unknown>, prop: string | symbol): unknown {
		if (prop === GROUP_HEADER || prop === 'groupKey' || prop === 'count') {
			return t[prop];
		}
		return prop in t ? t[prop] : '';
	}
};

/**
 * Build a synthetic header row wrapped in a Proxy so arbitrary field access
 * from user cell renderers resolves to `''` instead of throwing — see the
 * module header for why that is reachable.
 */
function makeHeader<T extends Record<string, unknown>>(groupKey: string, count: number): T {
	const target: Record<string | symbol, unknown> = {
		[GROUP_HEADER]: true,
		groupKey,
		count
	};
	return new Proxy(target, HEADER_PROXY_HANDLER) as unknown as T;
}

/** Configuration for {@link useTableGroupedRows}. */
export interface UseTableGroupedRowsConfig<T extends Record<string, unknown>> {
	/** The flat data to group. */
	data: T[];
	/** Derive the group key for a row. Rows with the same key share a section. */
	groupBy: (item: T) => string;
	/** Set of currently-collapsed group keys. */
	collapsedGroups: Set<string>;
	/** Called with a group key when its header is toggled. */
	onToggleGroup: (groupKey: string) => void;
	/**
	 * Custom renderer for a group header's content (right of the chevron).
	 * Defaults to `<groupKey> (<count>)`.
	 */
	renderGroupHeader?: Snippet<[string, number, boolean]>;
	/** Stable key for a real row. Falls back to a positional key when omitted. */
	getRowKey?: (item: T) => string;
	/** Explicit group ordering; groups not listed keep first-seen order after these. */
	groupOrder?: string[];
}

export interface UseTableGroupedRowsResult<T extends Record<string, unknown>> {
	/** Ready-to-use plugin for `<Table plugins>`. */
	plugin: TablePlugin<T>;
	/** Flattened rows: `[header, ...visibleRows, header, ...visibleRows]`. */
	readonly data: T[];
	/**
	 * Row-key resolver (also keys synthetic headers as `__group_<key>`). Pass to
	 * `<Table idKey>` — named for parallelism with the Table prop:
	 * `<Table idKey={grouped.idKey} />`.
	 */
	idKey: (item: T) => string;
}

/**
 * Groups a flat data array into collapsible section rows. Each distinct
 * `groupBy` value becomes a full-width section-header row with a chevron
 * toggle, the group label, and a member count; collapsing hides that group's
 * data rows while keeping the header visible.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   let collapsed = $state(new Set<string>());
 *   const grouped = useTableGroupedRows(() => ({
 *     data: rows,
 *     groupBy: (r) => r.team as string,
 *     collapsedGroups: collapsed,
 *     onToggleGroup: (key) => {
 *       const next = new Set(collapsed);
 *       next.has(key) ? next.delete(key) : next.add(key);
 *       collapsed = next;
 *     },
 *     getRowKey: (r) => r.id as string
 *   }));
 * </script>
 * <Table
 *   data={grouped.data}
 *   {columns}
 *   idKey={grouped.idKey}
 *   plugins={{ grouped: grouped.plugin }}
 * />
 * ```
 */
export function useTableGroupedRows<T extends Record<string, unknown>>(
	config: () => UseTableGroupedRowsConfig<T>
): UseTableGroupedRowsResult<T> {
	const flattened = $derived.by((): T[] => {
		const { data, groupBy, collapsedGroups, groupOrder } = config();
		if (data.length === 0) {
			return [];
		}

		// Group preserving first-seen order.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const groups = new Map<string, T[]>();
		for (const item of data) {
			const key = groupBy(item);
			const bucket = groups.get(key);
			if (bucket) {
				bucket.push(item);
			} else {
				groups.set(key, [item]);
			}
		}

		// Determine iteration order.
		let keys = [...groups.keys()];
		if (groupOrder && groupOrder.length > 0) {
			const ordered = groupOrder.filter((k) => groups.has(k));
			const rest = keys.filter((k) => !groupOrder.includes(k));
			keys = [...ordered, ...rest];
		}

		const out: T[] = [];
		for (const key of keys) {
			const rows = groups.get(key) ?? [];
			out.push(makeHeader<T>(key, rows.length));
			if (!collapsedGroups.has(key)) {
				out.push(...rows);
			}
		}
		return out;
	});

	// Positional fallback index, built once per flattened array so key lookup
	// stays O(1) instead of O(n) per row (which would make table keying O(n²)).
	const positionByItem = $derived.by(() => {
		if (config().getRowKey) {
			return null;
		}
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const map = new Map<T, number>();
		for (let i = 0; i < flattened.length; i++) {
			map.set(flattened[i], i);
		}
		return map;
	});

	const idKey = (item: T): string => {
		if (isGroupHeader(item)) {
			return `__group_${item.groupKey}`;
		}
		const getRowKeyProp = config().getRowKey;
		if (getRowKeyProp) {
			return getRowKeyProp(item);
		}
		return String(positionByItem?.get(item) ?? -1);
	};

	// Bound once per hook call, keyed by the header row's own `__group_<key>`
	// identity — the string `idKey` hands the table, so it can never collide with
	// a real row's key. Keyed, because the chevron must survive the toggle it
	// triggers; see `createSlotBinder`'s note.
	const bindGroupHeader = createSlotBinder<GroupHeaderArg>(groupHeaderRow);

	const plugin: TablePlugin<T> = {
		// Replace a header row's pre-rendered cells with one full-width cell.
		transformBodyRow(props, item) {
			if (!isGroupHeader(item)) {
				return props;
			}
			const header = item as unknown as GroupHeader;
			const collapsed = config().collapsedGroups.has(header.groupKey);
			const toggle = () => config().onToggleGroup(header.groupKey);

			return {
				...props,
				htmlProps: {
					...props.htmlProps,
					// Convenience: clicking anywhere on the row toggles it. The chevron
					// button below is the accessible, keyboard-operable control, so the
					// row keeps its implicit `row` role (no role override here).
					onclick: toggle,
					'aria-expanded': !collapsed
				},
				xstyle: [...props.xstyle, groupHeaderRowStyle],
				// Every member is read **inside** the getter, and that is load-bearing
				// rather than stylistic. `createSlotBinder` keys the bound snippet so its
				// identity survives a re-run, which means the slot's
				// `{@const unwrapSlotArg(arg)}` derived is what carries updates — and a
				// derived only re-runs when a reactive source read *inside* the getter
				// changes. Hoisting `config()` above this object, as an earlier cut did,
				// left the getter reading nothing reactive: the chevron kept its element
				// (the keying worked) but reported `aria-expanded="true"` and
				// "Collapse group" forever after the first toggle, and a group's count
				// never followed its data. The row's own `aria-expanded` was correct the
				// whole time, which is what made it look fine.
				children: bindGroupHeader(idKey(item), () => ({
					groupKey: header.groupKey,
					count: header.count,
					collapsed: config().collapsedGroups.has(header.groupKey),
					toggle,
					renderGroupHeader: config().renderGroupHeader
				}))
			};
		}
	};

	return {
		plugin,
		get data(): T[] {
			return flattened;
		},
		idKey
	};
}
