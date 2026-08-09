<!--
	Ported from upstream's `templates/blocks/components/Selector/SelectorWithSections.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Selector } from '@astryx-svelte/core';

	let value = $state<string | undefined>();
</script>

<Selector
	style="width: 300px"
	label="Office"
	options={[
		{
			type: 'section',
			title: 'North America',
			options: [
				{ value: 'nyc', label: 'New York' },
				{ value: 'sf', label: 'San Francisco' },
				{ value: 'sea', label: 'Seattle' }
			]
		},
		{
			type: 'section',
			title: 'Europe',
			options: [
				{ value: 'ldn', label: 'London' },
				{ value: 'ber', label: 'Berlin' }
			]
		},
		{
			type: 'section',
			title: 'Asia Pacific',
			options: [
				{ value: 'tyo', label: 'Tokyo' },
				{ value: 'sgp', label: 'Singapore' }
			]
		}
	]}
	{value}
	onChange={(next: string) => (value = next)}
	placeholder="Choose an office..."
/>
