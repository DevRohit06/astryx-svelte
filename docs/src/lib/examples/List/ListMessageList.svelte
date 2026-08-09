<!--
	Ported from upstream's `templates/blocks/components/List/ListMessageList.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, Badge, List, ListItem } from '@astryx-svelte/core';
</script>

<List hasDividers>
	<ListItem
		label="Alex Johnson"
		description="Hey, are we still on for lunch tomorrow?"
		onclick={() => {}}
	>
		{#snippet startContent()}<Avatar name="Alex Johnson" size={40} />{/snippet}
		{#snippet endContent()}<Badge label="2" />{/snippet}
	</ListItem>
	<ListItem
		label="Sam Rivera"
		description="I pushed the latest changes to the repo"
		onclick={() => {}}
	>
		{#snippet startContent()}<Avatar name="Sam Rivera" size={40} />{/snippet}
	</ListItem>
	<ListItem
		label="Jordan Lee"
		description="Can you review the design spec when you get a chance?"
		onclick={() => {}}
	>
		{#snippet startContent()}<Avatar name="Jordan Lee" size={40} />{/snippet}
		{#snippet endContent()}<Badge label="5" />{/snippet}
	</ListItem>
</List>
