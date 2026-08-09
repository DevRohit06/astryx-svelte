<!--
	Ported from upstream's `templates/blocks/components/Calendar/CalendarRangeWithValue.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Calendar, Stack, Text, type DateRange } from '@astryx-svelte/core';

	let value = $state<DateRange>({ start: '2026-01-10', end: '2026-01-20' });
</script>

<Stack direction="vertical" gap={4} hAlign="center">
	<Text type="supporting" color="secondary">
		{value.start && value.end ? `${value.start} → ${value.end}` : 'Pick a start and end date'}
	</Text>
	<Calendar mode="range" {value} onChange={(range) => (value = range)} focusDate="2026-01-01" />
</Stack>
