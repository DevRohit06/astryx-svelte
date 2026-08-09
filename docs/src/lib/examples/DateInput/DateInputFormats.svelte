<!--
	Ported from upstream's `templates/blocks/components/DateInput/DateInputFormats.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { DateInput, Stack, Text } from '@astryx-svelte/core';
	import type { ISODateString } from '@astryx-svelte/core';

	let value = $state<ISODateString | undefined>('2026-03-21');
</script>

<Stack direction="vertical" gap={4} width="100%" style="max-width: 400px">
	<Text type="supporting" color="secondary">
		The same committed date, displayed with different formats.
	</Text>
	<DateInput label="Short month (date)" {value} onChange={(next) => (value = next)} format="date" />
	<DateInput
		label="Long month (date_long, default)"
		{value}
		onChange={(next) => (value = next)}
		format="date_long"
	/>
	<DateInput
		label="With weekday (date_weekday)"
		{value}
		onChange={(next) => (value = next)}
		format="date_weekday"
	/>
	<DateInput
		label="ISO 8601 (system_date)"
		{value}
		onChange={(next) => (value = next)}
		format="system_date"
	/>
	<DateInput
		label="Custom function"
		{value}
		onChange={(next) => (value = next)}
		format={(iso) => `Ship by ${iso}`}
	/>
</Stack>
