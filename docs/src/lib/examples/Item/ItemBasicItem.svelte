<!--
	Ported from upstream's `templates/blocks/components/Item/ItemBasicItem.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Item, Stack, Text } from '@astryx-svelte/core';
</script>

<Stack gap={0}>
	<Item label="Quarterly planning" description="Agenda, notes, and action items">
		{#snippet endContent()}<Text color="secondary">Today</Text>{/snippet}
	</Item>
	<Item label="Customer research" description="Interview notes from the latest study">
		{#snippet endContent()}<Text color="secondary">Yesterday</Text>{/snippet}
	</Item>
	<Item label="Launch checklist" description="Remaining tasks before release">
		{#snippet endContent()}<Text color="secondary">Fri</Text>{/snippet}
	</Item>
</Stack>
