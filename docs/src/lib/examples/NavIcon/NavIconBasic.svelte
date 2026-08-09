<!--
	Ported from upstream's `templates/blocks/components/NavIcon/NavIconBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream passes registry icons here, not Heroicons, so both transcribe as-is.
-->
<script lang="ts">
	import { HStack, Icon, NavIcon } from '@astryx-svelte/core';
</script>

{#snippet searchIcon()}<Icon icon="search" />{/snippet}
{#snippet calendarIcon()}<Icon icon="calendar" />{/snippet}

<HStack gap={4} vAlign="center">
	<NavIcon icon={searchIcon} />
	<NavIcon icon={calendarIcon} />
</HStack>
