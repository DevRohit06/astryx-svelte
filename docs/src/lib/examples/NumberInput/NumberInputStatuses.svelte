<!--
	Ported from upstream's `templates/blocks/components/NumberInput/NumberInputStatuses.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { NumberInput, VStack } from '@astryx-svelte/core';

	let error = $state<number | null>(-5);
	let warning = $state<number | null>(150);
	let success = $state<number | null>(25);
</script>

<div style="width: 300px">
	<VStack gap={4}>
		<NumberInput
			label="Budget"
			value={error}
			onChange={(next: number) => (error = next)}
			status={{ type: 'error', message: 'Must be a positive amount' }}
		/>
		<NumberInput
			label="Headcount"
			value={warning}
			onChange={(next: number) => (warning = next)}
			status={{ type: 'warning', message: 'Exceeds typical team size' }}
		/>
		<NumberInput
			label="Completion"
			units="%"
			value={success}
			onChange={(next: number) => (success = next)}
			status={{ type: 'success', message: 'On track' }}
		/>
	</VStack>
</div>
