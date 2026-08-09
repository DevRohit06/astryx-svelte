<!--
	Ported from upstream's `templates/blocks/components/MultiSelector/MultiSelectorColumnVisibilitySelector.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { MultiSelector } from '@astryx-svelte/core';

	const allColumns = [
		{ value: 'name', label: 'Name' },
		{ value: 'email', label: 'Email' },
		{ value: 'role', label: 'Role' },
		{ value: 'status', label: 'Status' },
		{ value: 'created', label: 'Created' },
		{ value: 'updated', label: 'Updated' },
		{ value: 'actions', label: 'Actions' }
	];

	let visible = $state<string[]>(['name', 'email', 'role', 'status']);
</script>

<div style="width: 300px">
	<MultiSelector
		label="Columns"
		isLabelHidden
		options={allColumns}
		value={visible}
		onChange={(next) => (visible = next)}
		hasSelectAll
		hasSearch
		triggerDisplay="count"
		placeholder="Columns"
	/>
</div>
