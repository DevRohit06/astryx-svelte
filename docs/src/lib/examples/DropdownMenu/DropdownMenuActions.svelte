<!--
	Ported from upstream's `templates/blocks/components/DropdownMenu/DropdownMenuActions.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { DropdownMenu, Text, VStack } from '@astryx-svelte/core';

	let lastAction = $state<string | null>(null);
</script>

<VStack gap={3}>
	<DropdownMenu
		button={{ label: 'Actions' }}
		items={[
			{ label: 'Edit', onClick: () => (lastAction = 'Edit') },
			{ label: 'Duplicate', onClick: () => (lastAction = 'Duplicate') },
			{ label: 'Move to folder', onClick: () => (lastAction = 'Move') },
			{ type: 'divider' },
			{ label: 'Archive', onClick: () => (lastAction = 'Archive') },
			{ label: 'Delete', onClick: () => (lastAction = 'Delete') }
		]}
	/>
	{#if lastAction}
		<Text type="supporting" color="secondary">Last action: {lastAction}</Text>
	{/if}
</VStack>
