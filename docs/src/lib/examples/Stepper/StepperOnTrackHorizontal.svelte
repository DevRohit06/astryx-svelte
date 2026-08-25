<!--
	Ported from upstream's `templates/blocks/components/Stepper/StepperOnTrackHorizontal.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Step, Stepper } from '@astryx-svelte/core';

	let active = $state(2);
</script>

<div style="width: 560px">
	<Stepper
		activeStep={active}
		orientation="horizontal"
		indicatorPosition="on-track"
		onStepClick={(index) => (active = index)}
	>
		<Step step={0} label="Workspace" indicator="number" />
		<Step step={1} label="Team" indicator="number" />
		<Step step={2} label="Integrations" indicator="number" />
		<Step step={3} label="Import" indicator="number" />
		<Step step={4} label="Launch" indicator="number" />
	</Stepper>
</div>
