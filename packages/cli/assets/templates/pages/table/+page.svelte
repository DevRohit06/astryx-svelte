<!--
	Ported from upstream's `assets/templates/pages/table/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	One translation, and it recurs across every template in the Table group:
	`TableColumn.renderCell` is a `Snippet<[T]>` here where upstream's is
	`(item: T) => ReactNode`. A template snippet does not exist yet while
	`<script>` runs, so a column array that references one is `$derived.by` —
	deferred to first read, which is inside the render. This is the translation
	core's own `table-demos.svelte` route already makes.

	Upstream writes `<Table<Item> …>`; a Svelte component takes no explicit type
	argument, so the row type is inferred from `data`.
-->
<script lang="ts">
	import {
		Badge,
		Button,
		HStack,
		Layout,
		LayoutContent,
		LayoutHeader,
		Table,
		Text
	} from '@astryx-svelte/core';
	import type { TableColumn } from '@astryx-svelte/core';

	type Item = {
		id: string;
		name: string;
		status: 'active' | 'inactive';
		updatedAt: string;
	};

	const SAMPLE_DATA: Item[] = [
		{ id: '1', name: 'Item One', status: 'active', updatedAt: '2025-01-15' },
		{ id: '2', name: 'Item Two', status: 'inactive', updatedAt: '2025-01-14' },
		{ id: '3', name: 'Item Three', status: 'active', updatedAt: '2025-01-13' }
	];

	const columns = $derived.by<TableColumn<Item>[]>(() => [
		{
			key: 'name',
			header: 'Name',
			renderCell: nameCell
		},
		{
			key: 'status',
			header: 'Status',
			renderCell: statusCell
		},
		{
			key: 'updatedAt',
			header: 'Updated',
			renderCell: updatedAtCell
		},
		{
			key: 'actions',
			header: 'Actions',
			renderCell: actionsCell
		}
	]);

	// Upstream's `const [data] = useState<Item[]>(SAMPLE_DATA)` — the setter is
	// discarded there, so nothing ever writes this.
	let data = $state<Item[]>(SAMPLE_DATA);
</script>

{#snippet nameCell(item: Item)}
	<Text type="body" weight="semibold">{item.name}</Text>
{/snippet}

{#snippet statusCell(item: Item)}
	<Badge variant={item.status === 'active' ? 'success' : 'neutral'} label={item.status} />
{/snippet}

{#snippet updatedAtCell(item: Item)}
	<Text type="body" color="secondary">{item.updatedAt}</Text>
{/snippet}

{#snippet actionsCell()}
	<Button label="Edit" variant="secondary" size="sm" />
{/snippet}

{#snippet header()}
	<LayoutHeader hasDivider>
		<HStack vAlign="center" hAlign="between">
			<Text type="large" weight="semibold">Items</Text>
			<Button label="Add Item" variant="primary" />
		</HStack>
	</LayoutHeader>
{/snippet}

{#snippet content()}
	<LayoutContent>
		<Table {data} {columns} idKey="id" hasHover />
	</LayoutContent>
{/snippet}

<Layout {header} {content} />
