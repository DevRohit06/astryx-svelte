<!--
	Ported from upstream's `templates/blocks/components/IconButton/IconButtonLoadingToggle.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, Icon, IconButton } from '@astryx-svelte/core';

	let loadingId = $state<string | null>(null);

	function handleClick(id: string) {
		loadingId = id;
		setTimeout(() => (loadingId = null), 1500);
	}
</script>

<HStack gap={2}>
	<IconButton
		label="Copy"
		variant="primary"
		isLoading={loadingId === 'copy'}
		onclick={() => handleClick('copy')}
	>
		{#snippet icon()}<Icon icon="copy" color="inherit" />{/snippet}
	</IconButton>
	<IconButton
		label="Search"
		isLoading={loadingId === 'search'}
		onclick={() => handleClick('search')}
	>
		{#snippet icon()}<Icon icon="search" color="inherit" />{/snippet}
	</IconButton>
	<IconButton
		label="Close"
		variant="ghost"
		isLoading={loadingId === 'close'}
		onclick={() => handleClick('close')}
	>
		{#snippet icon()}<Icon icon="close" color="inherit" />{/snippet}
	</IconButton>
</HStack>
