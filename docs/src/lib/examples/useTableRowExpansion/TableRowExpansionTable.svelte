<!--
	Ported from upstream's `templates/blocks/components/Table/TableRowExpansionTable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	**Replaced wholesale at upstream 0.4.1 (PR #4609)**, which rewrote
	`useTableRowExpansion` from a tree plugin into a detail-panel one. The file
	tree this example used to show is now `useTableTreeData`'s subject; upstream's
	block is a master-detail order table, and this is that block. The orders, the
	columns and the initially-expanded `ord-1001` are upstream's, unchanged —
	including leaving `columns` *unannotated*, as upstream does.

	Three translations:

	- **`useState` → `$state`.** `useState<Set<string>>(new Set(['ord-1001']))`
	  becomes `$state(new Set(['ord-1001']))`; the `Set` is a plain one and
	  reassignment is the reactive boundary. Upstream's `setExpandedKeys(prev =>
	  …)` updater becomes a copy-and-reassign, because the updater form exists only
	  to guard against a batched React setter reading stale state and a `$state`
	  read never is.
	- **The hook takes a getter**, where upstream passes the config object.
	- **`renderExpanded` is a `Snippet<[Order]>`**, not `(item) => ReactNode`.
	  Upstream writes the panel's JSX inline in the config; here it is a top-level
	  snippet the config getter reads at render time, which is when a snippet
	  exists.

	No icon substitutions: the expand/collapse chevron is the plugin's own chrome.
-->
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
	} from '@astryx-svelte/core';

	interface Order extends Record<string, unknown> {
		id: string;
		customer: string;
		status: string;
		total: string;
		items: { name: string; qty: number; price: string }[];
	}

	const orders: Order[] = [
		{
			id: 'ord-1001',
			customer: 'Ada Lovelace',
			status: 'Shipped',
			total: '$248.00',
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
			items: [{ name: 'USB-C cable', qty: 4, price: '$13.00' }]
		},
		{
			id: 'ord-1003',
			customer: 'Grace Hopper',
			status: 'Delivered',
			total: '$1,200.00',
			items: [{ name: 'Standing desk', qty: 1, price: '$1,200.00' }]
		}
	];

	const columns = [
		{ key: 'customer', header: 'Customer', width: proportional(2) },
		{ key: 'status', header: 'Status', width: pixel(130) },
		{ key: 'total', header: 'Total', width: pixel(110) }
	];

	let expandedKeys = $state(new Set(['ord-1001']));

	const expansion = useTableRowExpansion<Order>(() => ({
		expandedKeys,
		onToggle: (key) => {
			// Scratch space, built fresh and reassigned — the reassignment is the
			// reactive boundary, so a `SvelteSet` would buy nothing here.
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const next = new Set(expandedKeys);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			expandedKeys = next;
		},
		getRowKey: (item) => item.id,
		// The detail panel renders arbitrary content below the row: here, the
		// order's line items. Any component composes here (charts, forms, tables).
		renderExpanded: lineItems
	}));
</script>

{#snippet lineItems(item: Order)}
	<VStack gap={2}>
		<Heading level={4}>Line items</Heading>
		{#each item.items as line (line.name)}
			<HStack gap={3}>
				<Badge label={`x${line.qty}`} variant="info" />
				<Text type="body">{line.name}</Text>
				<Text type="body" color="secondary">{line.price}</Text>
			</HStack>
		{/each}
	</VStack>
{/snippet}

<Table data={orders} {columns} idKey="id" hasHover plugins={{ expansion }} />
