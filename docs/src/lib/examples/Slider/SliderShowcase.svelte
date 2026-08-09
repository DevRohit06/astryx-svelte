<!--
	Ported from upstream's `templates/blocks/components/Slider/SliderShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Slider } from '@astryx-svelte/core';

	let value = $state(50);
</script>

<Slider label="Volume" {value} onChange={(next: number) => (value = next)} style="width: 300px" />
