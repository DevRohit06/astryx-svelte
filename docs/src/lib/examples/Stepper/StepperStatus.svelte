<!--
	Ported from upstream's `templates/blocks/components/Stepper/StepperStatus.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Step, Stepper } from '@astryx-svelte/core';

	let active = $state(3);
</script>

<div style="width: 100%; max-width: 400px">
	<Stepper activeStep={active} orientation="vertical" onStepClick={(index) => (active = index)}>
		<Step step={0} label="Email verified" description="you@example.com" status="success" />
		<Step step={1} label="Phone verified" description="+1 (555) 012-3456" status="success" />
		<Step step={2} label="Identity document" description="Passport upload failed" status="error" />
		<Step step={3} label="Address verification" description="Pending review" status="accent" />
		<Step step={4} label="Background check" isOptional description="Skipped" />
		<Step step={5} label="Account activated" />
	</Stepper>
</div>
