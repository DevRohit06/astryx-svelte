<!--
	Ported from upstream's `templates/blocks/components/Step/StepIndicator.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Icon, Spinner, Step, Stepper, Text } from '@astryx-svelte/core';
</script>

<!--
	The first four steps are all completed — same progress, so the indicator
	prop is the only difference between them. `auto` is the one that reacts to
	progress: a numbered badge until the step is reached, then a check. The
	last step is in progress instead, because the node it passes to `indicator`
	is a spinner and a spinner only makes sense on work that is running.
-->
<div style="display: flex; flex-wrap: wrap; gap: 24px">
	<div style="width: 190px">
		<Text type="label">auto (default)</Text>
		<Stepper activeStep={1} orientation="vertical">
			<Step step={0} label="Verify email" />
		</Stepper>
	</div>
	<div style="width: 190px">
		<Text type="label">number</Text>
		<Stepper activeStep={1} orientation="vertical">
			<Step step={0} label="Verify email" indicator="number" />
		</Stepper>
	</div>
	<div style="width: 190px">
		<Text type="label">Custom node</Text>
		<Stepper activeStep={1} orientation="vertical">
			<Step step={0} label="Verify email">
				{#snippet indicator()}<Icon icon="wrench" size="sm" />{/snippet}
			</Step>
		</Stepper>
	</div>
	<div style="width: 190px">
		<Text type="label">none</Text>
		<Stepper activeStep={1} orientation="vertical">
			<Step step={0} label="Verify email" indicator="none" />
		</Stepper>
	</div>
	<div style="width: 190px">
		<Text type="label">Spinner (in progress)</Text>
		<Stepper activeStep={0} orientation="vertical">
			<Step step={0} label="Verify email">
				<!--
					`inherit` picks up the indicator's own tint, so the spinner is
					colored by the step's progress and status like any other glyph.
				-->
				{#snippet indicator()}<Spinner size="md" shade="inherit" />{/snippet}
			</Step>
		</Stepper>
	</div>
</div>
