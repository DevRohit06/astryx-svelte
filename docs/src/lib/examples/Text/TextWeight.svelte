<!--
	Ported from upstream's `templates/blocks/components/Text/TextWeight.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, Text } from '@astryx-svelte/core';

	const WEIGHTS = [
		{ weight: 'normal', label: 'Normal' },
		{ weight: 'medium', label: 'Medium' },
		{ weight: 'semibold', label: 'Semibold' },
		{ weight: 'bold', label: 'Bold' }
	] as const;
</script>

<Stack direction="vertical" gap={3}>
	{#each WEIGHTS as entry (entry.weight)}
		<Text type="body" weight={entry.weight} display="block">{entry.label}</Text>
	{/each}
</Stack>
