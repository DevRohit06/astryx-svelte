<!--
	Ported from upstream's `templates/blocks/components/Badge/BadgeCountBadges.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, Stack, Text } from '@astryx-svelte/core';

	const COUNTS = [
		{ variant: 'info', label: '3', note: 'Messages' },
		{ variant: 'error', label: '99+', note: 'Alerts' },
		{ variant: 'success', label: '12', note: 'Completed' },
		{ variant: 'warning', label: '5', note: 'Pending' }
	] as const;
</script>

<Stack direction="horizontal" gap={8} hAlign="center" vAlign="center">
	{#each COUNTS as entry (entry.note)}
		<Stack direction="vertical" gap={2} hAlign="center">
			<Badge variant={entry.variant} label={entry.label} />
			<Text type="supporting" color="secondary">{entry.note}</Text>
		</Stack>
	{/each}
</Stack>
