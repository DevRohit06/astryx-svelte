<!--
	Ported from upstream's `templates/blocks/components/Stepper/StepperOnTrackVertical.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Step, Stepper } from '@astryx-svelte/core';

	let active = $state(2);
</script>

<div style="width: 100%; max-width: 400px">
	<Stepper
		activeStep={active}
		orientation="vertical"
		indicatorPosition="on-track"
		onStepClick={(index) => (active = index)}
	>
		<Step step={0} label="Create workspace" description="Name and configure your workspace" />
		<Step step={1} label="Invite team members" description="Add collaborators by email" />
		<Step step={2} label="Set up integrations" description="Connect Slack, GitHub, Jira" />
		<Step step={3} label="Import data" description="Bring in existing projects" />
		<Step step={4} label="Launch" description="Go live with your team" />
	</Stepper>
</div>
