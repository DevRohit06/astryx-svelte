<!--
	Ported from upstream's `templates/blocks/components/Text/TextTypes.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, Text } from '@astryx-svelte/core';

	/**
	 * Upstream spreads `hasStrikethrough`/`hasTabularNumbers` straight from the
	 * table, so most rows pass `undefined`. Under `exactOptionalPropertyTypes`
	 * that is not assignable to an optional boolean, so the reads coalesce to
	 * `false` — which is each prop's documented default, so nothing renders
	 * differently.
	 */
	const TYPES = [
		{ type: 'body', label: 'Body text', sample: 'Body text for paragraphs and general content' },
		{
			type: 'large',
			label: 'Large text',
			sample: 'Large text for introductions and callouts'
		},
		{
			type: 'label',
			label: 'Label text',
			sample: 'Label text for form fields and section titles'
		},
		{
			type: 'supporting',
			label: 'Supporting text',
			sample: 'Supporting text for captions and metadata'
		},
		{ type: 'code', label: 'Code text', sample: 'const theme = defineTheme({})' },
		{
			type: 'body',
			label: 'Strikethrough',
			sample: 'Body text with strikethrough decoration',
			hasStrikethrough: true
		},
		{
			type: 'body',
			label: 'Tabular numbers',
			sample: '1,234.56  78.90  100,000.00',
			hasTabularNumbers: true
		}
	] as const;
</script>

<Stack direction="vertical" gap={3}>
	{#each TYPES as entry (entry.label)}
		<Stack direction="vertical" gap={0}>
			<Text type="supporting" color="secondary">{entry.label}</Text>
			<Text
				type={entry.type}
				display="block"
				hasStrikethrough={'hasStrikethrough' in entry ? entry.hasStrikethrough : false}
				hasTabularNumbers={'hasTabularNumbers' in entry ? entry.hasTabularNumbers : false}
			>
				{entry.sample}
			</Text>
		</Stack>
	{/each}
</Stack>
