<!--
	Ported from upstream's `templates/blocks/components/PowerSearch/PowerSearchPresetFilters.tsx`.
	Transcribed, not re-authored.

	Config, enum values (em dashes included), preset filters, placeholder and
	width are upstream's, unchanged. `useState` → `$state`.
-->
<script lang="ts">
	import { PowerSearch } from '@astryx-svelte/core';
	import type { PowerSearchConfig, PowerSearchFilter } from '@astryx-svelte/core';

	const statusValues = [
		{ value: 'open', label: 'Open' },
		{ value: 'in_progress', label: 'In Progress' },
		{ value: 'review', label: 'In Review' },
		{ value: 'closed', label: 'Closed' }
	];

	const priorityValues = [
		{ value: 'p0', label: 'P0 — Critical' },
		{ value: 'p1', label: 'P1 — High' },
		{ value: 'p2', label: 'P2 — Medium' },
		{ value: 'p3', label: 'P3 — Low' }
	];

	const config: PowerSearchConfig = {
		name: 'TaskSearch',
		fields: [
			{
				key: 'status',
				label: 'Status',
				defaultOperator: 'is',
				operators: [
					{ key: 'is', label: 'is', value: { type: 'enum', values: statusValues } },
					{
						key: 'is_not',
						label: 'is not',
						value: { type: 'enum', values: statusValues }
					}
				]
			},
			{
				key: 'title',
				label: 'Title',
				defaultOperator: 'contains',
				operators: [{ key: 'contains', label: 'contains', value: { type: 'string' } }]
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

	let filters = $state<PowerSearchFilter[]>([
		{ field: 'status', operator: 'is', value: { type: 'enum', value: 'open' } },
		{ field: 'priority', operator: 'is', value: { type: 'enum', value: 'p1' } }
	]);
</script>

<PowerSearch
	style="width: 360px"
	{config}
	{filters}
	onChange={(newFilters) => (filters = [...newFilters])}
	placeholder="Add more filters..."
/>
