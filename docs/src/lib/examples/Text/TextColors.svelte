<!--
	Ported from upstream's `templates/blocks/components/Text/TextColors.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, Text } from '@astryx-svelte/core';

	const COLORS = [
		{ color: 'primary', description: 'Primary — Default for headings and body text' },
		{ color: 'secondary', description: 'Secondary — Supporting details and metadata' },
		{ color: 'accent', description: 'Accent — Links, emphasis, and accent-colored text' },
		{ color: 'disabled', description: 'Disabled — Unavailable or inactive content' },
		{ color: 'placeholder', description: 'Placeholder — Empty field hints' }
	] as const;
</script>

<Stack direction="vertical" gap={3}>
	{#each COLORS as entry (entry.color)}
		<Text type="body" color={entry.color}>{entry.description}</Text>
	{/each}
</Stack>
