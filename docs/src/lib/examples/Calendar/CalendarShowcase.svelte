<!--
	Ported from upstream's `templates/blocks/components/Calendar/CalendarShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Calendar, type ISODateString } from '@astryx-svelte/core';

	let value = $state<ISODateString | undefined>('2026-04-15');
</script>

<Calendar mode="single" {value} onChange={(next) => (value = next)} />
