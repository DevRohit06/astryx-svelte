<!--
	Ported from upstream's `templates/blocks/components/PowerSearch/PowerSearchContentSearch.tsx`.
	Transcribed, not re-authored.

	Config (including `contentSearchFieldKey`), enum values, placeholder and width
	are upstream's, unchanged. `useState` → `$state`.
-->
<script lang="ts">
	import { PowerSearch } from '@astryx-svelte/core';
	import type { PowerSearchConfig, PowerSearchFilter } from '@astryx-svelte/core';

	const statusValues = [
		{ value: 'open', label: 'Open' },
		{ value: 'in_progress', label: 'In Progress' },
		{ value: 'closed', label: 'Closed' }
	];

	const priorityValues = [
		{ value: 'p0', label: 'P0 — Critical' },
		{ value: 'p1', label: 'P1 — High' },
		{ value: 'p2', label: 'P2 — Medium' },
		{ value: 'p3', label: 'P3 — Low' }
	];

	const config: PowerSearchConfig = {
		name: 'ContentSearch',
		contentSearchFieldKey: 'title',
		fields: [
			{
				key: 'title',
				label: 'Title',
				defaultOperator: 'contains',
				operators: [
					{ key: 'contains', label: 'contains', value: { type: 'string' } },
					{
						key: 'not_contains',
						label: 'does not contain',
						value: { type: 'string' }
					}
				]
			},
			{
				key: 'status',
				label: 'Status',
				defaultOperator: 'is',
				operators: [{ key: 'is', label: 'is', value: { type: 'enum', values: statusValues } }]
			},
			{
				key: 'priority',
				label: 'Priority',
				defaultOperator: 'is',
				operators: [
					{
						key: 'is',
						label: 'is',
						value: { type: 'enum', values: priorityValues }
					}
				]
			}
		]
	};

	let filters = $state<PowerSearchFilter[]>([]);
</script>

<PowerSearch
	style="width: 300px"
	{config}
	{filters}
	onChange={(newFilters) => (filters = [...newFilters])}
	placeholder="Type to search by title, or pick a field..."
/>
