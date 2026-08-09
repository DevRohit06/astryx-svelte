<!--
	Ported from upstream's `templates/blocks/components/Avatar/AvatarInitialsFallback.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, Stack, Text } from '@astryx-svelte/core';

	const NAMES = [
		{ name: 'John Doe', note: 'First + last' },
		{ name: 'Alice', note: 'Single name' },
		{ name: 'Bob Smith Johnson', note: 'Multi-word' },
		{ name: 'Dr. Sarah Connor', note: 'Prefixed' }
	];
</script>

<Stack direction="horizontal" gap={6} vAlign="center">
	{#each NAMES as entry (entry.name)}
		<Stack direction="vertical" gap={2} hAlign="center">
			<Avatar name={entry.name} size="lg" />
			<Text type="supporting" color="secondary">{entry.note}</Text>
		</Stack>
	{/each}
</Stack>
