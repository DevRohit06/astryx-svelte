<script lang="ts">
	import {
		Badge,
		Heading,
		HStack,
		Table,
		Text,
		VStack,
		pixel,
		proportional,
		useTableRowExpansion
	} from '$lib/index.js';
	import type { TableColumn } from '$lib/index.js';

	/**
	 * Upstream's `TableRowExpansion.stories.tsx`, as a sibling route component —
	 * the `table-demos.svelte` shape.
	 *
	 * **Both stories**, rewritten wholesale at upstream 0.4.1 (PR #4609) along
	 * with the plugin. The three tree-mode stories this file used to carry
	 * (`InheritedColumns`, `LeafNodesNotExpandable`, `ExpandOnRowClick`) are gone
	 * with the tree mode; `table-tree-demos.svelte` is where that shape lives now.
	 * `orders`, `columns` and `OrderItems` are shared across the stories upstream
	 * and shared here; the expanded set is not — each story is its own React
	 * component with its own `useState`, so each gets its own `$state` set and its
	 * own hook. Upstream's per-story doc comments, verbatim:
	 *
	 * - **DetailPanel** — "Each row expands a full-width detail panel below it,
	 *   rendered by `renderExpanded(item)`. Click the chevron (or right-click,
	 *   then "Expand/Collapse row") to toggle the panel. The consumer owns the
	 *   `expandedKeys` set. For hierarchical data (child rows that reuse the
	 *   parent columns), use `useTableTreeData` + `useTableTreeState` instead."
	 * - **NotAllRowsExpandable** — "`getIsItemExpandable` restricts which rows can
	 *   expand. Here only orders with more than one line item are expandable; the
	 *   rest show no chevron and no context-menu action."
	 *
	 * Three translations:
	 *
	 * - **`useState` → `$state`.** `useState<Set<string>>(new Set(['ord-1001']))`
	 *   becomes `$state(new Set(['ord-1001']))`. The `Set` is a plain one:
	 *   reassignment is the reactive boundary, so upstream's `toggleKey(prev, key)`
	 *   updater becomes a copy-and-reassign — a `$state` read is never stale, so
	 *   the updater form has nothing left to guard.
	 * - **The hook takes a getter**, where upstream passes the config object.
	 *   Upstream's `useMemo`/`useCallback` around plugin objects have no
	 *   counterpart — the ported hook is already stable — and the storybook file
	 *   uses none anyway.
	 * - **`renderExpanded` is a `Snippet<[Order]>`**, not `(item) => ReactNode`, so
	 *   upstream's `OrderItems` component becomes a snippet rather than a sibling
	 *   component. It is declared at the top level and read by both stories'
	 *   config getters at render time, which is when a snippet exists.
	 */

	// =============================================================================
	// Sample Data: orders with expandable detail panels
	// =============================================================================

	interface Order extends Record<string, unknown> {
		id: string;
		customer: string;
		status: string;
		total: string;
		placed: string;
		items: { name: string; qty: number; price: string }[];
	}

	const orders: Order[] = [
		{
			id: 'ord-1001',
			customer: 'Ada Lovelace',
			status: 'Shipped',
			total: '$248.00',
			placed: '2026-06-20',
			items: [
				{ name: 'Mechanical keyboard', qty: 1, price: '$180.00' },
				{ name: 'Wrist rest', qty: 2, price: '$34.00' }
			]
		},
		{
			id: 'ord-1002',
			customer: 'Alan Turing',
			status: 'Processing',
			total: '$52.00',
			placed: '2026-06-21',
			items: [{ name: 'USB-C cable', qty: 4, price: '$13.00' }]
		},
		{
			id: 'ord-1003',
			customer: 'Grace Hopper',
			status: 'Delivered',
			total: '$1,200.00',
			placed: '2026-06-18',
			items: [{ name: 'Standing desk', qty: 1, price: '$1,200.00' }]
		}
	];

	const columns: TableColumn<Order>[] = [
		{ key: 'customer', header: 'Customer', width: proportional(2) },
		{ key: 'status', header: 'Status', width: pixel(130) },
		{ key: 'total', header: 'Total', width: pixel(110) },
		{ key: 'placed', header: 'Placed', width: pixel(120) }
	];

	/**
	 * Upstream's `toggleKey`. The `Set` is plain, with
	 * `svelte/prefer-svelte-reactivity` disabled for the reason
	 * `use-table-column-settings-state.svelte.ts` records: it is scratch space
	 * built fresh per call and never mutated after it is assigned, so the `$state`
	 * reassignment at the call site is already the reactive boundary.
	 */
	function toggleKey(keys: Set<string>, key: string): Set<string> {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const next = new Set(keys);
		if (next.has(key)) {
			next.delete(key);
		} else {
			next.add(key);
		}
		return next;
	}

	// =============================================================================
	// Stories
	// =============================================================================

	// DetailPanel
	let detailKeys = $state(new Set(['ord-1001']));

	const detailPlugin = useTableRowExpansion<Order>(() => ({
		expandedKeys: detailKeys,
		onToggle: (key) => (detailKeys = toggleKey(detailKeys, key)),
		getRowKey: (item) => item.id,
		renderExpanded: orderItems
	}));

	// NotAllRowsExpandable
	let restrictedKeys = $state(new Set<string>());

	const restrictedPlugin = useTableRowExpansion<Order>(() => ({
		expandedKeys: restrictedKeys,
		onToggle: (key) => (restrictedKeys = toggleKey(restrictedKeys, key)),
		getRowKey: (item) => item.id,
		getIsItemExpandable: (item) => item.items.length > 1,
		renderExpanded: orderItems
	}));
</script>

{#snippet orderItems(order: Order)}
	<VStack gap={2}>
		<Heading level={4}>Line items</Heading>
		{#each order.items as line (line.name)}
			<HStack gap={3}>
				<Badge label={`x${line.qty}`} variant="info" />
				<Text type="body">{line.name}</Text>
				<Text type="body" color="secondary">{line.price}</Text>
			</HStack>
		{/each}
	</VStack>
{/snippet}

<h3>Detail panel</h3>
<Table data={orders} {columns} idKey="id" hasHover plugins={{ expansion: detailPlugin }} />

<h3>Not all rows expandable</h3>
<Table data={orders} {columns} idKey="id" hasHover plugins={{ expansion: restrictedPlugin }} />
