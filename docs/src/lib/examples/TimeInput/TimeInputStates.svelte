<!--
	Ported from upstream's `templates/blocks/components/TimeInput/TimeInputStates.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`ISOTimeString` is a branded string, so each seeded literal needs an assertion;
	upstream writes `as never`, this names the type instead. See
	`TimeInputConstrained.svelte` for the full note.
-->
<script lang="ts">
	import { Stack, TimeInput, type ISOTimeString } from '@astryx-svelte/core';

	let disabledVal = $state<ISOTimeString | undefined>('10:00' as ISOTimeString);
	let errorVal = $state<ISOTimeString | undefined>('22:00' as ISOTimeString);
	let warningVal = $state<ISOTimeString | undefined>('07:00' as ISOTimeString);
	let successVal = $state<ISOTimeString | undefined>('10:00' as ISOTimeString);
</script>

<Stack direction="vertical" gap={3}>
	<TimeInput
		label="Disabled field"
		value={disabledVal}
		onChange={(next) => (disabledVal = next)}
		isDisabled
	/>
	<TimeInput
		label="Error message"
		value={errorVal}
		onChange={(next) => (errorVal = next)}
		status={{ type: 'error', message: 'Time must be during business hours' }}
	/>
	<TimeInput
		label="Warning message"
		value={warningVal}
		onChange={(next) => (warningVal = next)}
		status={{ type: 'warning', message: 'Early morning — are you sure?' }}
	/>
	<TimeInput
		label="Success message"
		value={successVal}
		onChange={(next) => (successVal = next)}
		status={{ type: 'success', message: 'Time slot is available' }}
	/>
</Stack>
