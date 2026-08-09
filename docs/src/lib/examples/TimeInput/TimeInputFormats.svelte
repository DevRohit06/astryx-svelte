<!--
	Ported from upstream's `templates/blocks/components/TimeInput/TimeInputFormats.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`ISOTimeString` is a branded string, so the seeded literals need an assertion;
	upstream writes `as never` on each, this names the type instead. See
	`TimeInputConstrained.svelte` for the full note.
-->
<script lang="ts">
	import { Stack, Text, TimeInput, type ISOTimeString } from '@astryx-svelte/core';

	let time24h = $state<ISOTimeString | undefined>('14:30' as ISOTimeString);
	let timeSec = $state<ISOTimeString | undefined>('14:30:45' as ISOTimeString);
</script>

<Stack direction="vertical" gap={4}>
	<Text type="supporting" color="secondary">Format variations for different contexts</Text>
	<Stack direction="vertical" gap={3}>
		<TimeInput
			label="24-hour"
			value={time24h}
			onChange={(next) => (time24h = next)}
			hourFormat="24h"
		/>
		<TimeInput
			label="With seconds"
			value={timeSec}
			onChange={(next) => (timeSec = next)}
			hasSeconds
		/>
	</Stack>
</Stack>
