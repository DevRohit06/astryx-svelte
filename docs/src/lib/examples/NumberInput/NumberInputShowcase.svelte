<!--
	Ported from upstream's `templates/blocks/components/NumberInput/NumberInputShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { NumberInput } from '@astryx-svelte/core';

	let value = $state<number | null>(0);
</script>

<div style="width: 300px">
	<NumberInput
		label="Quantity"
		placeholder="Enter quantity"
		{value}
		onChange={(next: number) => (value = next)}
	/>
</div>
