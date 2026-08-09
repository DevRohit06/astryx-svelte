<!--
	Ported from upstream's `templates/blocks/components/DateTimeInput/DateTimeInputShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	React's `style={{maxWidth: 400}}` object becomes a CSS string, since Svelte's
	`style` attribute takes one.
-->
<script lang="ts">
	import { DateTimeInput, Stack, type ISODateTimeString } from '@astryx-svelte/core';

	let dateTime = $state<ISODateTimeString | undefined>(undefined);
</script>

<Stack direction="vertical" width="100%" style="max-width: 400px">
	<DateTimeInput
		label="Meeting time"
		placeholder="Select a date"
		value={dateTime}
		onChange={(next) => (dateTime = next)}
		hasClear
	/>
</Stack>
