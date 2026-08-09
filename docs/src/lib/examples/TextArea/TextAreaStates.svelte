<!--
	Ported from upstream's `templates/blocks/components/TextArea/TextAreaStates.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, TextArea } from '@astryx-svelte/core';

	let requiredValue = $state('');
</script>

<Stack direction="vertical" gap={4} style="width: 400px">
	<TextArea
		label="Required field"
		value={requiredValue}
		onChange={(next) => (requiredValue = next)}
		placeholder="Describe the issue..."
		isRequired
	/>
	<TextArea
		label="Disabled field"
		value="This field is read-only and cannot be edited."
		onChange={() => {}}
		isDisabled
	/>
	<TextArea
		label="Loading field"
		value=""
		onChange={() => {}}
		placeholder="Generating summary..."
		isLoading
	/>
</Stack>
