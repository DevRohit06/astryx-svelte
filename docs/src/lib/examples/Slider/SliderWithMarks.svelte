<!--
	Ported from upstream's `templates/blocks/components/Slider/SliderWithMarks.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Slider } from '@astryx-svelte/core';

	let value = $state(50);
</script>

<Slider
	style="width: 300px"
	label="Volume"
	{value}
	onChange={(next: number) => (value = next)}
	marks={[
		{ value: 0, label: '0' },
		{ value: 25, label: '25' },
		{ value: 50, label: '50' },
		{ value: 75, label: '75' },
		{ value: 100, label: '100' }
	]}
/>
