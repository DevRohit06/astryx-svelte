<!--
	Ported from upstream's `templates/blocks/components/MultiSelector/MultiSelectorSearchableMultiSelector.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { MultiSelector } from '@astryx-svelte/core';

	const countries = [
		'United States',
		'United Kingdom',
		'Canada',
		'Australia',
		'Germany',
		'France',
		'Japan',
		'Brazil',
		'India',
		'Mexico'
	];

	let value = $state<string[]>([]);
</script>

<div style="width: 300px">
	<MultiSelector
		label="Countries"
		options={countries}
		{value}
		onChange={(next) => (value = next)}
		hasSearch
		hasSelectAll
		placeholder="Select countries..."
	/>
</div>
