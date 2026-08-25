<!--
	Ported from upstream's `templates/blocks/components/Step/StepShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Step, Stepper, Text } from '@astryx-svelte/core';
</script>

<!--
	One Step, and every part it renders: the indicator, the label with its
	optional marker and trailing slot, and the description beneath. A Step is
	always wrapped in a Stepper — that is where it reads its progress from —
	so a single Step in a single Stepper is the smallest complete example.
-->
<div style="width: 380px">
	<Stepper activeStep={1} orientation="vertical">
		<Step
			step={1}
			label="Connect a repository"
			description="Astryx reads your build settings from the default branch"
			isOptional
		>
			{#snippet endContent()}<Text type="supporting">2 min</Text>{/snippet}
		</Step>
	</Stepper>
</div>
