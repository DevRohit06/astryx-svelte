<!--
	Ported from upstream's `templates/blocks/components/Breadcrumbs/BreadcrumbsCustomSeparator.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { BreadcrumbItem, Breadcrumbs, Stack, Text } from '@astryx-svelte/core';

	const SEPARATORS = [
		{ char: '›', label: 'Chevron' },
		{ char: '→', label: 'Arrow' },
		{ char: '·', label: 'Dot' }
	];
</script>

<Stack direction="vertical" gap={4}>
	{#each SEPARATORS as entry (entry.label)}
		<Stack direction="vertical" gap={1}>
			<Text type="supporting" color="secondary">{entry.label}</Text>
			<Breadcrumbs separator={entry.char}>
				<BreadcrumbItem href="/">Home</BreadcrumbItem>
				<BreadcrumbItem href="/docs">Docs</BreadcrumbItem>
				<BreadcrumbItem isCurrent>API Reference</BreadcrumbItem>
			</Breadcrumbs>
		</Stack>
	{/each}
</Stack>
