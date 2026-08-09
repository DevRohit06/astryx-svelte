<!--
	Ported from upstream's `templates/blocks/components/Icon/IconStatusIcons.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, Icon, Text, VStack } from '@astryx-svelte/core';

	const statuses = [
		{ icon: 'success', color: 'success', label: 'Deployed successfully' },
		{ icon: 'warning', color: 'warning', label: 'Build has warnings' },
		{ icon: 'error', color: 'error', label: 'Pipeline failed' },
		{ icon: 'info', color: 'accent', label: 'New version available' }
	] as const;
</script>

<VStack gap={3}>
	{#each statuses as status (status.label)}
		<HStack gap={2} vAlign="center">
			<Icon icon={status.icon} color={status.color} size="sm" />
			<Text type="body">{status.label}</Text>
		</HStack>
	{/each}
</VStack>
