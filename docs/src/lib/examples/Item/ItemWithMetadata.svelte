<!--
	Ported from upstream's `templates/blocks/components/Item/ItemWithMetadata.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, Icon, Item, Stack, Text } from '@astryx-svelte/core';
</script>

<Stack gap={0}>
	<Item label="Build passed" description="Production deploy completed">
		{#snippet startContent()}<Icon icon="check" size="sm" color="success" />{/snippet}
		{#snippet endContent()}<Text color="secondary">2m ago</Text>{/snippet}
	</Item>
	<Item
		label="High memory usage"
		description="Worker pool is above the warning threshold"
		isHighlighted
	>
		{#snippet startContent()}<Icon icon="warning" size="sm" color="warning" />{/snippet}
		{#snippet endContent()}<Badge label="Warning" variant="warning" />{/snippet}
	</Item>
	<Item label="Sync failed" description="Retry after checking service credentials" isSelected>
		{#snippet startContent()}<Icon icon="error" size="sm" color="error" />{/snippet}
		{#snippet endContent()}<Badge label="Action" variant="error" />{/snippet}
	</Item>
</Stack>
