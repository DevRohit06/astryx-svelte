<!--
	Ported from upstream's `templates/blocks/components/DropdownMenu/DropdownMenuWithDisabledItems.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { DropdownMenu, Text, VStack } from '@astryx-svelte/core';

	let lastAction = $state<string | null>(null);
</script>

<VStack gap={3}>
	<DropdownMenu
		button={{ label: 'Manage team' }}
		items={[
			{ label: 'Invite member', onClick: () => (lastAction = 'Invite') },
			{ label: 'Edit roles', onClick: () => (lastAction = 'Edit roles') },
			{ type: 'divider' },
			{ label: 'Transfer ownership', isDisabled: true },
			{ label: 'Delete team', isDisabled: true }
		]}
	/>
	{#if lastAction}
		<Text type="supporting" color="secondary">Last action: {lastAction}</Text>
	{/if}
	<Text type="supporting" color="secondary">
		Destructive actions are disabled for non-admin users
	</Text>
</VStack>
