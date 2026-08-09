<!--
	Ported from upstream's `templates/blocks/components/Slider/SliderFormattedValue.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Slider } from '@astryx-svelte/core';

	let value = $state(72);
</script>

<Slider
	style="width: 300px"
	label="Temperature"
	{value}
	onChange={(next: number) => (value = next)}
	valueDisplay="text"
	min={60}
	max={90}
	step={1}
	formatValue={(v: number) => `${v}°F`}
/>
