<!--
	Ported from upstream's `templates/blocks/components/Slider/SliderWithStatus.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Slider, VStack } from '@astryx-svelte/core';

	let value1 = $state(95);
	let value2 = $state(50);
	let value3 = $state(75);
</script>

<div style="width: 300px">
	<VStack gap={6}>
		<Slider
			label="CPU Usage"
			value={value1}
			onChange={(next: number) => (value1 = next)}
			status={{ type: 'error', message: 'CPU usage is critically high' }}
		/>
		<Slider
			label="Memory"
			value={value2}
			onChange={(next: number) => (value2 = next)}
			status={{ type: 'warning', message: 'Memory usage is moderate' }}
		/>
		<Slider
			label="Disk"
			value={value3}
			onChange={(next: number) => (value3 = next)}
			status={{ type: 'success', message: 'Disk usage is healthy' }}
		/>
	</VStack>
</div>
