<!--
	Ported from upstream's `templates/blocks/components/TimeInput/TimeInputShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { TimeInput, type ISOTimeString } from '@astryx-svelte/core';

	let time = $state<ISOTimeString | undefined>(undefined);
</script>

<TimeInput
	label="Time"
	placeholder="Select a time"
	value={time}
	onChange={(next) => (time = next)}
/>
