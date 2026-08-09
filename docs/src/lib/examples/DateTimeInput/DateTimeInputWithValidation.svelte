<!--
	Ported from upstream's `templates/blocks/components/DateTimeInput/DateTimeInputWithValidation.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	React's `style={{maxWidth: 400}}` object becomes a CSS string. The
	`as ISODateTimeString` casts stay: it is a *branded* string on both sides, so a
	bare literal does not satisfy it.
-->
<script lang="ts">
	import { DateTimeInput, Stack, type ISODateTimeString } from '@astryx-svelte/core';

	let errorVal = $state<ISODateTimeString | undefined>('2026-01-25T09:00' as ISODateTimeString);
	let warningVal = $state<ISODateTimeString | undefined>('2026-12-25T14:00' as ISODateTimeString);
	let successVal = $state<ISODateTimeString | undefined>('2026-03-10T10:30' as ISODateTimeString);
</script>

<Stack direction="vertical" gap={4} width="100%" style="max-width: 400px">
	<DateTimeInput
		label="Meeting time"
		value={errorVal}
		onChange={(next) => (errorVal = next)}
		status={{ type: 'error', message: 'This time slot is already booked' }}
	/>
	<DateTimeInput
		label="Preferred time"
		value={warningVal}
		onChange={(next) => (warningVal = next)}
		status={{ type: 'warning', message: 'This falls outside business hours' }}
	/>
	<DateTimeInput
		label="Start time"
		value={successVal}
		onChange={(next) => (successVal = next)}
		status={{ type: 'success', message: 'Time confirmed' }}
	/>
</Stack>
