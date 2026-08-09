<!--
	Ported from upstream's `templates/blocks/components/PowerSearch/PowerSearchShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Config, preset filters, placeholder and width are upstream's, unchanged.
	`useState` → `$state`, and `setFilters([...newFilters])` → reassignment; the
	spread is upstream's and is kept, since `onChange` hands back a
	`ReadonlyArray`.
-->
<script lang="ts">
	import { PowerSearch } from '@astryx-svelte/core';
	import type { PowerSearchConfig, PowerSearchFilter } from '@astryx-svelte/core';

	const config: PowerSearchConfig = {
		name: 'BasicSearch',
		fields: [
			{
				key: 'status',
				label: 'Status',
				defaultOperator: 'is',
				operators: [
					{
						key: 'is',
						label: 'is',
						value: {
							type: 'enum',
							values: [
								{ value: 'open', label: 'Open' },
								{ value: 'in_progress', label: 'In Progress' },
								{ value: 'closed', label: 'Closed' }
							]
						}
					}
				]
			},
			{
				key: 'title',
				label: 'Title',
				defaultOperator: 'contains',
				operators: [{ key: 'contains', label: 'contains', value: { type: 'string' } }]
			}
		]
	};

	const initialFilters: PowerSearchFilter[] = [
		{ field: 'status', operator: 'is', value: { type: 'enum', value: 'open' } },
		{
			field: 'title',
			operator: 'contains',
			value: { type: 'string', value: 'dashboard' }
		}
	];

	let filters = $state<PowerSearchFilter[]>(initialFilters);
</script>

<PowerSearch
	style="width: 400px"
	{config}
	{filters}
	onChange={(newFilters) => (filters = [...newFilters])}
	placeholder="Search by status, title..."
/>
