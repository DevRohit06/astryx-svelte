<!--
	Ported from upstream's
	`templates/blocks/components/InternationalizationProvider/InternationalizationProvider01ShippedLocale.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`fr-FR.json` is upstream's own partial catalog, copied verbatim with the
	0.2.0 resync and published from the same `./locales/*.json` subpath.
-->
<script lang="ts">
	import {
		InternationalizationProvider,
		SegmentedControl,
		SegmentedControlItem,
		Selector,
		Stack
	} from '@astryx-svelte/core';
	import frFR from '@astryx-svelte/core/locales/fr-FR.json';

	type Locale = 'en' | 'fr-FR';

	let locale = $state<Locale>('en');
	let value = $state<string | null>(null);
</script>

<InternationalizationProvider {locale} messages={{ 'fr-FR': frFR }}>
	<Stack direction="vertical" gap={4} hAlign="center">
		<SegmentedControl
			label="Language"
			value={locale}
			onChange={(next) => (locale = next as Locale)}
			size="sm"
		>
			<SegmentedControlItem value="en" label="EN" />
			<SegmentedControlItem value="fr-FR" label="FR" />
		</SegmentedControl>
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
	</Stack>
</InternationalizationProvider>
