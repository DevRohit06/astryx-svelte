<!--
	Ported from upstream's `templates/blocks/components/IconButton/IconButtonTooltipIconButton.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, Icon, IconButton } from '@astryx-svelte/core';
</script>

<HStack gap={2}>
	<IconButton label="Search" variant="ghost" tooltip="Search items">
		{#snippet icon()}<Icon icon="search" color="inherit" />{/snippet}
	</IconButton>
	<IconButton label="Copy link" variant="ghost" tooltip="Copy to clipboard">
		{#snippet icon()}<Icon icon="copy" color="inherit" />{/snippet}
	</IconButton>
	<IconButton label="More options" variant="ghost" tooltip="More options">
		{#snippet icon()}<Icon icon="moreHorizontal" color="inherit" />{/snippet}
	</IconButton>
</HStack>
