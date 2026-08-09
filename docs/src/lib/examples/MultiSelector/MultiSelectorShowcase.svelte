<!--
	Ported from upstream's `templates/blocks/components/MultiSelector/MultiSelectorShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { MultiSelector } from '@astryx-svelte/core';

	let value = $state<string[]>([]);
</script>

<div style="width: 300px">
	<MultiSelector
		label="Columns"
		options={['Name', 'Email', 'Role', 'Status', 'Created']}
		{value}
		onChange={(next) => (value = next)}
		placeholder="Select columns..."
	/>
</div>
