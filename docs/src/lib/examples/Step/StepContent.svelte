<!--
	Ported from upstream's `templates/blocks/components/Step/StepContent.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Step, Stepper, TextInput } from '@astryx-svelte/core';
</script>

<!--
	Anything passed as children renders below the description, indented to line
	up with the label rather than the indicator. In a full flow you would gate
	this on the step being active; here it is a single Step so the slot is
	always shown.
-->
<div style="width: 400px">
	<Stepper activeStep={1} orientation="vertical">
		<Step step={1} label="Billing address" description="Used for invoices and tax calculation">
			<div style="display: flex; flex-direction: column; gap: 12px">
				<TextInput label="Street" placeholder="1 Hacker Way" value="" />
				<TextInput label="City" placeholder="Menlo Park" value="" />
				<div>
					<Button label="Save address" variant="primary" />
				</div>
			</div>
		</Step>
	</Stepper>
</div>
