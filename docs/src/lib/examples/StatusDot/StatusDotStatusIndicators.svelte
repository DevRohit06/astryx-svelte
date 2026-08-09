<!--
	Ported from upstream's `templates/blocks/components/StatusDot/StatusDotStatusIndicators.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, StatusDot, Text, VStack } from '@astryx-svelte/core';

	const statuses = [
		{ variant: 'success', label: 'Online' },
		{ variant: 'warning', label: 'Away' },
		{ variant: 'error', label: 'Offline' },
		{ variant: 'neutral', label: 'Unknown' }
	] as const;
</script>

<VStack gap={2}>
	{#each statuses as entry (entry.variant)}
		<HStack gap={2} vAlign="center">
			<StatusDot variant={entry.variant} label={entry.label} />
			<Text type="body">{entry.label}</Text>
		</HStack>
	{/each}
</VStack>
