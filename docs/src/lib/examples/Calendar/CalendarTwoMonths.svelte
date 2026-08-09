<!--
	Ported from upstream's `templates/blocks/components/Calendar/CalendarTwoMonths.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Calendar, Stack, Text, type DateRange } from '@astryx-svelte/core';

	let value = $state<DateRange>({ start: '2026-01-25', end: '2026-02-05' });
</script>

<Stack direction="vertical" gap={4} hAlign="center">
	<Text type="supporting" color="secondary">
		{value.start && value.end ? `${value.start} → ${value.end}` : 'Pick a date range'}
	</Text>
	<Calendar
		mode="range"
		numberOfMonths={2}
		{value}
		onChange={(range) => (value = range)}
		focusDate="2026-01-01"
	/>
</Stack>
