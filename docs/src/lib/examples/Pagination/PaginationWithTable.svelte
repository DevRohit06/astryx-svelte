<!--
	Ported from upstream's `templates/blocks/components/Pagination/PaginationWithTable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Pagination, Stack, Table } from '@astryx-svelte/core';

	const ALL_DATA = [
		{ id: '1', name: 'Olivia Chen', role: 'Engineer', status: 'Active' },
		{ id: '2', name: 'Marcus Rivera', role: 'Designer', status: 'Active' },
		{ id: '3', name: 'Aisha Patel', role: 'Marketing', status: 'Invited' },
		{ id: '4', name: 'James Okafor', role: 'Engineer', status: 'Active' },
		{ id: '5', name: 'Sofia Nguyen', role: 'Sales', status: 'Active' },
		{ id: '6', name: 'Liam Johansson', role: 'Engineer', status: 'Inactive' },
		{ id: '7', name: 'Elena Kowalski', role: 'Designer', status: 'Active' },
		{ id: '8', name: 'David Kim', role: 'Marketing', status: 'Active' },
		{ id: '9', name: 'Priya Sharma', role: 'Sales', status: 'Invited' },
		{ id: '10', name: 'Noah Tanaka', role: 'Engineer', status: 'Active' },
		{ id: '11', name: 'Fatima Al-Rashid', role: 'Designer', status: 'Active' },
		{ id: '12', name: 'Carlos Mendez', role: 'Marketing', status: 'Inactive' }
	];

	const PAGE_SIZE = 4;

	let page = $state(1);
	const start = $derived((page - 1) * PAGE_SIZE);
	const pageData = $derived(ALL_DATA.slice(start, start + PAGE_SIZE));
</script>

<Stack direction="vertical" style="width:100%;max-width:500px">
	<Table
		idKey="id"
		columns={[
			{ key: 'name', header: 'Name' },
			{ key: 'role', header: 'Role' },
			{ key: 'status', header: 'Status' }
		]}
		data={pageData}
	/>
	<Pagination
		{page}
		onChange={(next) => (page = next)}
		totalItems={ALL_DATA.length}
		pageSize={PAGE_SIZE}
		variant="count"
		size="sm"
		style="justify-content:center;padding-top:8px"
	/>
</Stack>
