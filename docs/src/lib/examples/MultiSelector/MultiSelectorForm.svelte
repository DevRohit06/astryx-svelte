<!--
	Ported from upstream's `templates/blocks/components/MultiSelector/MultiSelectorForm.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { MultiSelector, VStack } from '@astryx-svelte/core';

	let columns = $state<string[]>(['name', 'email']);
	let filters = $state<string[]>([]);
</script>

<div style="width: 300px">
	<VStack gap={4}>
		<MultiSelector
			label="Visible columns"
			description="Choose which columns to display in the table"
			options={[
				{ value: 'name', label: 'Name' },
				{ value: 'email', label: 'Email' },
				{ value: 'role', label: 'Role' },
				{ value: 'status', label: 'Status' },
				{ value: 'created', label: 'Created at' }
			]}
			value={columns}
			onChange={(next) => (columns = next)}
			hasSelectAll
			isRequired
			triggerDisplay="labels"
		/>
		<MultiSelector
			label="Status filter"
			description="Filter by status"
			options={['Active', 'Inactive', 'Pending', 'Archived']}
			value={filters}
			onChange={(next) => (filters = next)}
			isOptional
			triggerDisplay="badges"
			placeholder="All statuses"
		/>
	</VStack>
</div>
