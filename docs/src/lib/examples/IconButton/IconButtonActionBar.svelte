<!--
	Ported from upstream's `templates/blocks/components/IconButton/IconButtonActionBar.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, Icon, IconButton } from '@astryx-svelte/core';
	import type { IconName } from '@astryx-svelte/core';

	const actions: { label: string; icon: IconName }[] = [
		{ label: 'Search', icon: 'search' },
		{ label: 'Copy', icon: 'copy' },
		{ label: 'Info', icon: 'info' },
		{ label: 'Menu', icon: 'menu' },
		{ label: 'Close', icon: 'close' }
	];
</script>

<HStack gap={1}>
	{#each actions as action (action.label)}
		<IconButton label={action.label} variant="ghost">
			{#snippet icon()}<Icon icon={action.icon} color="inherit" />{/snippet}
		</IconButton>
	{/each}
</HStack>
