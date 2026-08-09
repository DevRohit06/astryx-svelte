<!--
	Ported from upstream's `templates/blocks/components/Pagination/PaginationPageSize.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream hoists its two `CSSProperties` objects to module scope; here they
	are inline `style` strings, which is what Svelte's `style` attribute takes.
-->
<script lang="ts">
	import { Heading, Pagination, Stack, Table } from '@astryx-svelte/core';

	const DATA = [
		{
			id: '1',
			date: 'Apr 18',
			description: 'Payment received',
			amount: '$2,450.00'
		},
		{
			id: '2',
			date: 'Apr 15',
			description: 'Subscription renewal',
			amount: '$99.00'
		},
		{ id: '3', date: 'Apr 12', description: 'Refund issued', amount: '-$180.00' },
		{ id: '4', date: 'Apr 10', description: 'Invoice paid', amount: '$1,200.00' }
	];

	let page = $state(1);
	let pageSize = $state(10);
</script>

<Stack direction="vertical" style="width:100%;max-width:500px">
	<Heading level={4}>Transactions</Heading>
	<Table
		idKey="id"
		columns={[
			{ key: 'date', header: 'Date' },
			{ key: 'description', header: 'Description' },
			{ key: 'amount', header: 'Amount' }
		]}
		data={DATA}
	/>
	<Pagination
		{page}
		onChange={(next) => (page = next)}
		totalItems={350}
		{pageSize}
		onPageSizeChange={(next) => (pageSize = next)}
		pageSizeOptions={[10, 25, 50, 100]}
		variant="count"
		style="padding-top:8px;flex-direction:row-reverse"
	/>
</Stack>
