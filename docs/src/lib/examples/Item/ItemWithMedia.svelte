<!--
	Ported from upstream's `templates/blocks/components/Item/ItemWithMedia.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, Badge, Icon, Item, Stack, Text } from '@astryx-svelte/core';
</script>

<Stack gap={0}>
	<Item label="Ada Lovelace" description="Design systems engineer" onclick={() => {}}>
		{#snippet startContent()}<Avatar name="Ada Lovelace" size="sm" />{/snippet}
		{#snippet endContent()}<Badge label="Owner" variant="purple" />{/snippet}
	</Item>
	<Item label="Grace Hopper" description="Compiler platform" onclick={() => {}}>
		{#snippet startContent()}<Avatar name="Grace Hopper" size="sm" />{/snippet}
		{#snippet endContent()}<Text color="secondary">Online</Text>{/snippet}
	</Item>
	<Item
		label="Review handoff notes"
		description="Updated guidance is ready for the team"
		onclick={() => {}}
	>
		{#snippet startContent()}<Icon icon="info" size="sm" color="secondary" />{/snippet}
		{#snippet endContent()}<Badge label="New" variant="blue" />{/snippet}
	</Item>
</Stack>
