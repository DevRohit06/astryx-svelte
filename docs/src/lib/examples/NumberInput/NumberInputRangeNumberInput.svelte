<!--
	Ported from upstream's `templates/blocks/components/NumberInput/NumberInputRangeNumberInput.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { NumberInput } from '@astryx-svelte/core';

	let value = $state<number | null>(3);
</script>

<div style="width: 300px">
	<NumberInput
		label="Team Size"
		placeholder="1–50"
		min={1}
		max={50}
		description="Number of people on the team"
		{value}
		onChange={(next: number) => (value = next)}
	/>
</div>
