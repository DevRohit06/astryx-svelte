<!--
	Ported from upstream's `templates/blocks/components/DateRangeInput/DateRangeInputShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	React's `style={{maxWidth: 400}}` object becomes a CSS string, since Svelte's
	`style` attribute takes one. The `as ISODateString` casts stay: `daysAgo` and
	`today` build their strings at runtime, so they do not narrow to the
	template-literal type on their own.
-->
<script lang="ts">
	import { DateRangeInput, Stack, type DateRange, type ISODateString } from '@astryx-svelte/core';

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
		{ label: 'Last 30 days', getRange: () => ({ start: daysAgo(30), end: today() }) }
	];

	let range = $state<DateRange | null>(null);
</script>

<Stack direction="vertical" width="100%" style="max-width: 400px">
	<DateRangeInput label="Date range" value={range} onChange={(next) => (range = next)} {presets} />
</Stack>
