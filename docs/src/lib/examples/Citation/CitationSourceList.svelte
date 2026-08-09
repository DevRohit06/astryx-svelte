<!--
	Ported from upstream's `templates/blocks/components/Citation/CitationSourceList.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Citation, Stack, Text } from '@astryx-svelte/core';

	const sources = [
		{
			title: 'React Documentation',
			url: 'https://react.dev',
			icon: 'https://react.dev/favicon-32x32.png'
		},
		{
			title: 'TypeScript Handbook',
			url: 'https://www.typescriptlang.org/docs/handbook/',
			icon: 'https://www.typescriptlang.org/favicon-32x32.png'
		},
		{
			title: 'MDN Web Docs',
			url: 'https://developer.mozilla.org',
			icon: 'https://developer.mozilla.org/favicon-48x48.cbbd161b.png'
		},
		{ title: 'W3C WAI-ARIA Specification', url: 'https://www.w3.org/TR/wai-aria/' }
	];
</script>

<Stack direction="vertical" gap={3}>
	<Text type="supporting" color="secondary">Sources</Text>
	<Stack direction="horizontal" gap={2} style="flex-wrap: wrap">
		{#each sources as source, i (source.title)}
			<Citation {source} number={i + 1} variant="label" />
		{/each}
	</Stack>
</Stack>
