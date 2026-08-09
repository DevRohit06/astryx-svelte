<!--
	Ported from upstream's `templates/blocks/components/ListItem/ListItemWithMedia.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, Badge, Icon, List, ListItem } from '@astryx-svelte/core';
</script>

<List header="Team" hasDividers>
	<ListItem label="Ada Lovelace" description="Design systems engineer" onclick={() => {}}>
		{#snippet startContent()}<Avatar name="Ada Lovelace" size="sm" />{/snippet}
		{#snippet endContent()}<Badge label="Owner" variant="purple" />{/snippet}
	</ListItem>
	<ListItem label="Grace Hopper" description="Platform infrastructure" onclick={() => {}}>
		{#snippet startContent()}<Avatar name="Grace Hopper" size="sm" />{/snippet}
		{#snippet endContent()}<Badge label="On call" variant="blue" />{/snippet}
	</ListItem>
	<ListItem
		label="Invite teammate"
		description="Send an invitation to collaborate"
		onclick={() => {}}
	>
		{#snippet startContent()}<Icon icon="info" size="sm" color="secondary" />{/snippet}
	</ListItem>
</List>
