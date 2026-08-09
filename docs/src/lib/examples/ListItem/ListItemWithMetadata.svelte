<!--
	Ported from upstream's `templates/blocks/components/ListItem/ListItemWithMetadata.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, Icon, List, ListItem, Text } from '@astryx-svelte/core';
</script>

<List header="Inbox" density="compact" hasDividers>
	<ListItem
		label="Launch checklist"
		description="3 tasks still need an owner"
		isSelected
		onclick={() => {}}
	>
		{#snippet startContent()}<Icon icon="check" size="sm" color="success" />{/snippet}
		{#snippet endContent()}<Badge label="3" variant="blue" />{/snippet}
	</ListItem>
	<ListItem label="Security review" description="Waiting on approval" onclick={() => {}}>
		{#snippet startContent()}<Icon icon="warning" size="sm" color="warning" />{/snippet}
		{#snippet endContent()}<Text color="secondary">Yesterday</Text>{/snippet}
	</ListItem>
	<ListItem label="Old incident report" description="Archived and read-only" isDisabled>
		{#snippet startContent()}<Icon icon="copy" size="sm" color="secondary" />{/snippet}
		{#snippet endContent()}<Text color="secondary">Apr 12</Text>{/snippet}
	</ListItem>
</List>
