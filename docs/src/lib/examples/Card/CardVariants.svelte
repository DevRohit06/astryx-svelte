<!--
	Ported from upstream's `templates/blocks/components/Card/CardVariants.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Stack, Text } from '@astryx-svelte/core';

	const VARIANTS = [
		{ variant: 'default', label: 'General', note: '4 tasks due today' },
		{ variant: 'muted', label: 'Archived', note: 'No activity in 30 days' },
		{ variant: 'blue', label: 'Engineering', note: '12 open issues' },
		{ variant: 'green', label: 'Marketing', note: '3 campaigns active' },
		{ variant: 'orange', label: 'Urgent', note: '2 items need review' },
		{ variant: 'purple', label: 'Design', note: '5 drafts in progress' }
	] as const;
</script>

<Stack direction="horizontal" gap={3} style="flex-wrap: wrap">
	{#each VARIANTS as entry (entry.variant)}
		<Card variant={entry.variant} width={160}>
			<Stack direction="vertical" gap={1}>
				<Text type="body" weight="bold">{entry.label}</Text>
				<Text type="supporting" color="secondary">{entry.note}</Text>
			</Stack>
		</Card>
	{/each}
</Stack>
