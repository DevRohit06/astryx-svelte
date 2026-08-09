<!--
	Ported from upstream's `templates/blocks/components/Slider/SliderRangeSlider.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Slider } from '@astryx-svelte/core';

	let value = $state<[number, number]>([20, 80]);
</script>

<Slider
	label="Price range"
	{value}
	onChange={(next: [number, number]) => (value = next)}
	style="width: 300px"
/>
