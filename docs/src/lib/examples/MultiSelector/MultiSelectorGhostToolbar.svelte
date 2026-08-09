<!--
	Ported from upstream's `templates/blocks/components/MultiSelector/MultiSelectorGhostToolbar.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, HStack, MultiSelector } from '@astryx-svelte/core';

	let columns = $state<string[]>(['Name', 'Email']);
	let filters = $state<string[]>(['Active']);
</script>

<HStack align="center" gap={2}>
	<Button label="Refresh" variant="ghost" />
	<MultiSelector
		label="Columns"
		isLabelHidden
		variant="ghost"
		options={['Name', 'Email', 'Role', 'Status', 'Created']}
		value={columns}
		onChange={(next) => (columns = next)}
		triggerDisplay="labels"
		placeholder="Columns"
	/>
	<MultiSelector
		label="Status"
		isLabelHidden
		variant="ghost"
		options={['Active', 'Inactive', 'Pending', 'Archived']}
		value={filters}
		onChange={(next) => (filters = next)}
		triggerDisplay="labels"
		placeholder="Status"
		status={{ type: 'warning', message: 'Some filters hide archived rows' }}
		statusVariant="tooltip"
	/>
	<Button label="Export" variant="ghost" />
</HStack>
