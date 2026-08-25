<!--
	Ported from upstream's `templates/blocks/components/Stepper/StepperShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Step, Stepper } from '@astryx-svelte/core';

	let active = $state(2);
</script>

<div style="width: 100%; max-width: 640px">
	<Stepper activeStep={active} orientation="horizontal" onStepClick={(index) => (active = index)}>
		<Step step={0} label="Cart" />
		<Step step={1} label="Shipping" />
		<Step step={2} label="Payment" />
		<Step step={3} label="Review" />
		<Step step={4} label="Confirm" />
	</Stepper>
</div>
