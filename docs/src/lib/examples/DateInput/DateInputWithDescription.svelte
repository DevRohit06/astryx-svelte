<!--
	Ported from upstream's `templates/blocks/components/DateInput/DateInputWithDescription.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	The local `DateString` type becomes the exported `ISODateString`, and React's
	`style={{maxWidth: 400}}` becomes a CSS string — see `DateInputShowcase.svelte`
	for the full note.
-->
<script lang="ts">
	import { DateInput, Stack, Text, type ISODateString } from '@astryx-svelte/core';

	let value = $state<ISODateString | undefined>(undefined);
</script>

<Stack direction="vertical" gap={4} width="100%" style="max-width: 400px">
	<Text type="supporting" color="secondary">Helper text explains what the field expects</Text>
	<DateInput
		label="Start date"
		description="Your subscription begins on this date"
		placeholder="Select a start date"
		{value}
		onChange={(next) => (value = next)}
	/>
</Stack>
