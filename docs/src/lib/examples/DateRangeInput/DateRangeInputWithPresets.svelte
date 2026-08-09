<!--
	Ported from upstream's `templates/blocks/components/DateRangeInput/DateRangeInputWithPresets.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	React's `style={{maxWidth: 400}}` object becomes a CSS string — see
	`DateRangeInputShowcase.svelte` for the note on the retained casts.
-->
<script lang="ts">
	import {
		DateRangeInput,
		Stack,
		Text,
		type DateRange,
		type ISODateString
	} from '@astryx-svelte/core';

	function daysAgo(n: number): ISODateString {
		// `prefer-svelte-reactivity` wants a `SvelteDate`, which is for a `Date`
		// held in reactive state. This one is local to the call, is read once and
		// is never observed — and `setDate` is what gives upstream its DST-correct
		// arithmetic, which subtracting milliseconds would not.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const d = new Date();
		d.setDate(d.getDate() - n);
		return d.toISOString().slice(0, 10) as ISODateString;
	}

	function today(): ISODateString {
		return new Date().toISOString().slice(0, 10) as ISODateString;
	}

	const presets = [
		{ label: 'Last 7 days', getRange: () => ({ start: daysAgo(7), end: today() }) },
		{ label: 'Last 14 days', getRange: () => ({ start: daysAgo(14), end: today() }) },
		{ label: 'Last 30 days', getRange: () => ({ start: daysAgo(30), end: today() }) },
		{ label: 'Last 90 days', getRange: () => ({ start: daysAgo(90), end: today() }) }
	];

	let range = $state<DateRange | null>(null);
</script>

<Stack direction="vertical" gap={4} width="100%" style="max-width: 400px">
	<Text type="supporting" color="secondary">
		{range ? `${range.start} → ${range.end}` : 'No range selected'}
	</Text>
	<DateRangeInput
		label="Report period"
		description="Use a preset or pick a custom range"
		value={range}
		onChange={(next) => (range = next)}
		{presets}
	/>
</Stack>
