<!--
	Ported from upstream's `templates/blocks/components/NumberInput/NumberInputWithUnits.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { NumberInput } from '@astryx-svelte/core';

	let value = $state<number | null>(50);
</script>

<div style="width: 300px">
	<NumberInput
		label="Discount"
		placeholder="Enter discount"
		min={0}
		max={100}
		units="%"
		{value}
		onChange={(next: number) => (value = next)}
	/>
</div>
