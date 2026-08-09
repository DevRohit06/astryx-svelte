<!--
	Ported from upstream's `templates/blocks/components/DateRangeInput/DateRangeInputWithValidation.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	React's `style={{maxWidth: 400}}` object becomes a CSS string, since Svelte's
	`style` attribute takes one.
-->
<script lang="ts">
	import { DateRangeInput, Stack, type DateRange } from '@astryx-svelte/core';

	let errorRange = $state<DateRange | null>({ start: '2026-01-01', end: '2026-01-31' });
	let warningRange = $state<DateRange | null>({ start: '2026-06-01', end: '2026-06-30' });
	let successRange = $state<DateRange | null>({ start: '2026-03-01', end: '2026-03-31' });
</script>

<Stack direction="vertical" gap={4} width="100%" style="max-width: 400px">
	<DateRangeInput
		label="Booking period"
		value={errorRange}
		onChange={(next) => (errorRange = next)}
		status={{ type: 'error', message: 'Selected dates are no longer available' }}
	/>
	<DateRangeInput
		label="Preferred period"
		value={warningRange}
		onChange={(next) => (warningRange = next)}
		status={{ type: 'warning', message: 'High demand — limited availability' }}
	/>
	<DateRangeInput
		label="Confirmed period"
		value={successRange}
		onChange={(next) => (successRange = next)}
		status={{ type: 'success', message: 'Dates confirmed and available' }}
	/>
</Stack>
