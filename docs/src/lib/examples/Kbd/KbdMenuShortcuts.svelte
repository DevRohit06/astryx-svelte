<!--
	Ported from upstream's `templates/blocks/components/Kbd/KbdMenuShortcuts.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Kbd, List, ListItem } from '@astryx-svelte/core';

	const menuItems = [
		{ label: 'Cut', keys: 'mod+x' },
		{ label: 'Copy', keys: 'mod+c' },
		{ label: 'Paste', keys: 'mod+v' },
		{ label: 'Undo', keys: 'mod+z' },
		{ label: 'Redo', keys: 'mod+shift+z' }
	] as const;
</script>

<Card padding={0}>
	<List density="compact">
		{#each menuItems as item (item.label)}
			<ListItem label={item.label}>
				{#snippet endContent()}<Kbd keys={item.keys} />{/snippet}
			</ListItem>
		{/each}
	</List>
</Card>
