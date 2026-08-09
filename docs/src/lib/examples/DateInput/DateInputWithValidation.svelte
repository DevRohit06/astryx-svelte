<!--
	Ported from upstream's `templates/blocks/components/DateInput/DateInputWithValidation.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	The local `DateString` type becomes the exported `ISODateString`, and React's
	`style={{maxWidth: 400}}` becomes a CSS string — see `DateInputShowcase.svelte`
	for the full note. `ISODateString` is a template literal type here, so
	upstream's `as DateString` casts on the seeded literals drop out.
-->
<script lang="ts">
	import { DateInput, Stack, type ISODateString } from '@astryx-svelte/core';

	let errorVal = $state<ISODateString | undefined>('2026-01-25');
	let warningVal = $state<ISODateString | undefined>('2026-12-25');
	let successVal = $state<ISODateString | undefined>('2026-03-10');
</script>

<Stack direction="vertical" gap={4} width="100%" style="max-width: 400px">
	<DateInput
		label="Event date"
		value={errorVal}
		onChange={(next) => (errorVal = next)}
		status={{ type: 'error', message: 'This date is already booked' }}
	/>
	<DateInput
		label="Preferred date"
		value={warningVal}
		onChange={(next) => (warningVal = next)}
		status={{ type: 'warning', message: 'This date falls on a holiday' }}
	/>
	<DateInput
		label="Start date"
		value={successVal}
		onChange={(next) => (successVal = next)}
		status={{ type: 'success', message: 'Date confirmed' }}
	/>
</Stack>
