<!--
	Ported from upstream's `templates/blocks/components/Calendar/CalendarSingle.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Calendar, Stack, Text, type ISODateString } from '@astryx-svelte/core';

	let value = $state<ISODateString>('2026-01-15');
</script>

<Stack direction="vertical" gap={4} hAlign="center">
	<Text type="supporting" color="secondary">
		{value ? `Selected: ${value}` : 'Pick a date'}
	</Text>
	<Calendar mode="single" {value} onChange={(val) => (value = val)} focusDate="2026-01-01" />
</Stack>
