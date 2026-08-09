<!--
	Ported from upstream's `templates/blocks/components/NavIcon/NavIconShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { HStack, Icon, NavIcon } from '@astryx-svelte/core';
</script>

<HStack gap={4} vAlign="center">
	<NavIcon>
		{#snippet icon()}<Icon icon="search" />{/snippet}
	</NavIcon>
	<NavIcon>
		{#snippet icon()}<Icon icon="calendar" />{/snippet}
	</NavIcon>
	<NavIcon>
		{#snippet icon()}<Icon icon="wrench" />{/snippet}
	</NavIcon>
</HStack>
