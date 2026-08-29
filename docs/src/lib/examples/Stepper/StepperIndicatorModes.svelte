<!--
	Ported from upstream's `templates/blocks/components/Stepper/StepperIndicatorModes.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Icon, Step, Stepper, Text } from '@astryx-svelte/core';

	let active = $state(2);
</script>

<div style="display: flex; gap: 48px; flex-wrap: wrap">
	<div style="max-width: 220px">
		<Text type="label">None</Text>
		<Stepper activeStep={active} orientation="vertical" onStepClick={(index) => (active = index)}>
			<Step step={0} label="Account" indicator="none" />
			<Step step={1} label="Profile" indicator="none" />
			<Step step={2} label="Settings" indicator="none" />
			<Step step={3} label="Review" indicator="none" />
		</Stepper>
	</div>
	<div style="max-width: 220px">
		<Text type="label">Auto</Text>
		<Stepper activeStep={active} orientation="vertical" onStepClick={(index) => (active = index)}>
			<Step step={0} label="Account" />
			<Step step={1} label="Profile" />
			<Step step={2} label="Settings" />
			<Step step={3} label="Review" />
		</Stepper>
	</div>
	<div style="max-width: 220px">
		<Text type="label">Number</Text>
		<Stepper activeStep={active} orientation="vertical" onStepClick={(index) => (active = index)}>
			<Step step={0} label="Account" indicator="number" />
			<Step step={1} label="Profile" indicator="number" />
			<Step step={2} label="Settings" indicator="number" />
			<Step step={3} label="Review" indicator="number" />
		</Stepper>
	</div>
	<div style="max-width: 220px">
		<Text type="label">Custom icon</Text>
		<Stepper activeStep={active} orientation="vertical" onStepClick={(index) => (active = index)}>
			<Step step={0} label="Account">
				{#snippet indicator()}<Icon icon="info" size="sm" />{/snippet}
			</Step>
			<Step step={1} label="Profile">
				{#snippet indicator()}<Icon icon="search" size="sm" />{/snippet}
			</Step>
			<Step step={2} label="Settings">
				{#snippet indicator()}<Icon icon="wrench" size="sm" />{/snippet}
			</Step>
			<Step step={3} label="Review">
				{#snippet indicator()}<Icon icon="check" size="sm" />{/snippet}
			</Step>
		</Stepper>
	</div>
</div>
