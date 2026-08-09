<!--
	Ported from upstream's `templates/blocks/components/Calendar/CalendarConstraints.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	One type-level adjustment: upstream writes `'2026-01-10' as ISODateString` on
	`min`/`max`/`focusDate`. This port declares `ISODateString` as a template
	literal type, so a well-formed literal already satisfies it and the casts drop
	out. The values themselves are unchanged.
-->
<script lang="ts">
	import { Calendar, Stack, Text, type ISODateString } from '@astryx-svelte/core';

	const isWeekday = (date: Date) => {
		const day = date.getDay();
		return day !== 0 && day !== 6;
	};

	let value = $state<ISODateString | undefined>(undefined);
</script>

<Stack direction="vertical" gap={4} hAlign="center">
	<Text type="supporting" color="secondary">Jan 10 – Mar 20, weekdays only</Text>
	<Calendar
		mode="single"
		min="2026-01-10"
		max="2026-03-20"
		dateConstraints={[isWeekday]}
		{value}
		onChange={(val) => (value = val)}
		focusDate="2026-01-01"
	/>
</Stack>
