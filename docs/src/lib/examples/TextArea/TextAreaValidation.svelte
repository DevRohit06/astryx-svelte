<!--
	Ported from upstream's `templates/blocks/components/TextArea/TextAreaValidation.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, TextArea } from '@astryx-svelte/core';

	let errorValue = $state('Fix the');
	let warningValue = $state('Summarize the Q2 results');
	let successValue = $state(
		'Redesign the onboarding flow to reduce drop-off by 15% in Q3. Focus on simplifying the account creation step and adding a progress indicator.'
	);
	let errorNoMsgValue = $state('Invalid content');
</script>

<Stack direction="vertical" gap={4} style="width: 400px">
	<TextArea
		label="Error message"
		value={errorValue}
		onChange={(next) => (errorValue = next)}
		status={{ type: 'error', message: 'Description must be at least 20 characters.' }}
	/>
	<TextArea
		label="Warning message"
		value={warningValue}
		onChange={(next) => (warningValue = next)}
		status={{ type: 'warning', message: 'Consider adding more detail for clarity.' }}
	/>
	<TextArea
		label="Success message"
		value={successValue}
		onChange={(next) => (successValue = next)}
		status={{ type: 'success', message: 'Looks good — clear and actionable.' }}
	/>
	<TextArea
		label="Error without message"
		value={errorNoMsgValue}
		onChange={(next) => (errorNoMsgValue = next)}
		status={{ type: 'error' }}
	/>
</Stack>
