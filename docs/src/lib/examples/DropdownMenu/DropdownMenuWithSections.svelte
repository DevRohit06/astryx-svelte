<!--
	Ported from upstream's `templates/blocks/components/DropdownMenu/DropdownMenuWithSections.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { DropdownMenu, Text, VStack } from '@astryx-svelte/core';

	let lastAction = $state<string | null>(null);
</script>

<VStack gap={3}>
	<DropdownMenu
		button={{ label: 'File', variant: 'ghost' }}
		items={[
			{
				type: 'section',
				title: 'Create',
				items: [
					{ label: 'New document', onClick: () => (lastAction = 'New document') },
					{ label: 'New spreadsheet', onClick: () => (lastAction = 'New spreadsheet') },
					{ label: 'New folder', onClick: () => (lastAction = 'New folder') }
				]
			},
			{
				type: 'section',
				title: 'Manage',
				items: [
					{ label: 'Share', onClick: () => (lastAction = 'Share') },
					{ label: 'Move', onClick: () => (lastAction = 'Move') },
					{ label: 'Archive', onClick: () => (lastAction = 'Archive') }
				]
			}
		]}
	/>
	{#if lastAction}
		<Text type="supporting" color="secondary">Selected: {lastAction}</Text>
	{/if}
</VStack>
