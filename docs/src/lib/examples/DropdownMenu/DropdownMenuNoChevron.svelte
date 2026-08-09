<!--
	Ported from upstream's `templates/blocks/components/DropdownMenu/DropdownMenuNoChevron.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { DropdownMenu, Icon, Text, VStack } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `EllipsisHorizontalIcon`; the registry ships
	 * `moreHorizontal`, so this is a direct swap rather than an approximation.
	 */
	let lastAction = $state<string | null>(null);
</script>

{#snippet moreIcon()}<Icon icon="moreHorizontal" />{/snippet}

<VStack gap={3}>
	<DropdownMenu
		button={{ label: 'More actions', icon: moreIcon, variant: 'ghost', isIconOnly: true }}
		hasChevron={false}
		items={[
			{ label: 'Copy link', onClick: () => (lastAction = 'Copy link') },
			{ label: 'Download', onClick: () => (lastAction = 'Download') },
			{ label: 'Print', onClick: () => (lastAction = 'Print') },
			{ type: 'divider' },
			{ label: 'Report', onClick: () => (lastAction = 'Report') }
		]}
	/>
	{#if lastAction}
		<Text type="supporting" color="secondary">Last action: {lastAction}</Text>
	{/if}
</VStack>
