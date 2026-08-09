<!--
	Ported from upstream's
	`templates/blocks/components/InternationalizationProvider/InternationalizationProvider02Overrides.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { InternationalizationProvider, Selector } from '@astryx-svelte/core';

	let value = $state<string | null>(null);
</script>

<InternationalizationProvider
	locale="en"
	overrides={{ en: { '@astryx.selector.placeholder': 'Choose...' } }}
>
	<Selector
		style="width: 300px"
		label="Billing region"
		options={[
			{ value: 'americas', label: 'Americas' },
			{ value: 'emea', label: 'EMEA' },
			{ value: 'apac', label: 'APAC' }
		]}
		{value}
		onChange={(next) => (value = next)}
		hasClear
	/>
</InternationalizationProvider>
