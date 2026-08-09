<!--
	Ported from upstream's `templates/blocks/components/TimeInput/TimeInputIncrement.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`ISOTimeString` is a branded string, so the seeded literal needs an assertion;
	upstream writes `as never`, this names the type instead. See
	`TimeInputConstrained.svelte` for the full note.
-->
<script lang="ts">
	import { Stack, TimeInput, type ISOTimeString } from '@astryx-svelte/core';

	let slot = $state<ISOTimeString | undefined>('09:00' as ISOTimeString);
</script>

<Stack direction="vertical" gap={3}>
	<TimeInput
		label="Appointment slot"
		increment={15}
		description="Use arrow keys to change by 15 minutes"
		value={slot}
		onChange={(next) => (slot = next)}
		hasClear
	/>
</Stack>
