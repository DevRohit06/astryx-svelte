<!--
	Ported from upstream's `templates/blocks/components/DateInput/DateInputClearable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	The local `DateString` type becomes the exported `ISODateString`, and React's
	`style={{maxWidth: 400}}` becomes a CSS string — see `DateInputShowcase.svelte`
	for the full note. `ISODateString` is a template literal type here, so
	upstream's `as DateString` cast on the seeded literal drops out.
-->
<script lang="ts">
	import { DateInput, Stack, Text, type ISODateString } from '@astryx-svelte/core';

	let value = $state<ISODateString | undefined>('2026-04-06');
</script>

<Stack direction="vertical" gap={4} width="100%" style="max-width: 400px">
	<Text type="supporting" color="secondary">
		{value ? `Selected: ${value}` : 'No date selected'}
	</Text>
	<DateInput
		label="Event date"
		description="Pick a date for your event"
		placeholder="Select a date"
		{value}
		onChange={(next) => (value = next)}
		hasClear
	/>
</Stack>
