<!--
	Ported from upstream's `templates/blocks/components/CheckboxInput/CheckboxInputStatusVariations.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CheckboxInput, Stack } from '@astryx-svelte/core';

	let error = $state<boolean | 'indeterminate'>(false);
	let warning = $state<boolean | 'indeterminate'>(true);
	let success = $state<boolean | 'indeterminate'>(true);
</script>

<Stack direction="vertical" gap={4}>
	<CheckboxInput
		label="Error"
		description="Required field that has not been accepted."
		value={error}
		onChange={(next) => (error = next)}
		status={{ type: 'error', message: 'You must accept the terms to continue' }}
	/>
	<CheckboxInput
		label="Warning"
		description="Enabled setting with a side effect to be aware of."
		value={warning}
		onChange={(next) => (warning = next)}
		status={{ type: 'warning', message: 'This data may be shared with partners' }}
	/>
	<CheckboxInput
		label="Success"
		description="Confirmed setting that has been verified."
		value={success}
		onChange={(next) => (success = next)}
		status={{ type: 'success', message: 'Your email has been verified' }}
	/>
</Stack>
