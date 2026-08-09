<!--
	Ported from upstream's `templates/blocks/components/DateInput/DateInputDateRange.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	The local `DateString` type becomes the exported `ISODateString`, and React's
	`style={{maxWidth: 400}}` becomes a CSS string — see `DateInputShowcase.svelte`
	for the full note. The `as DateString` casts on `min`/`max` stay, because these
	are *computed* strings rather than literals and so do not narrow to the
	template-literal type on their own.

	The bounds are derived from the current month on purpose upstream, so the
	example always shows a live, in-range window rather than a stale hardcoded one.
-->
<script lang="ts">
	import { DateInput, Stack, Text, type ISODateString } from '@astryx-svelte/core';

	const pad = (n: number) => String(n).padStart(2, '0');
	const today = new Date();
	const year = today.getFullYear();
	const month = today.getMonth();
	const startDay = 8;
	const endDay = 21;
	const min = `${year}-${pad(month + 1)}-${pad(startDay)}` as ISODateString;
	const max = `${year}-${pad(month + 1)}-${pad(endDay)}` as ISODateString;
	const monthName = new Date(year, month, 1).toLocaleString('en-US', { month: 'short' });
	const description = `Available dates: ${monthName} ${startDay} – ${endDay}, ${year}`;

	let value = $state<ISODateString | undefined>(undefined);
</script>

<Stack direction="vertical" gap={4} width="100%" style="max-width: 400px">
	<Text type="supporting" color="secondary">
		{value ? `Booked: ${value}` : 'Pick a date in the available range'}
	</Text>
	<DateInput
		label="Booking date"
		{min}
		{max}
		{description}
		placeholder="Select a booking date"
		{value}
		onChange={(next) => (value = next)}
	/>
</Stack>
