<!--
	Ported from upstream's `templates/blocks/components/TabList/TabListTabsWithBadge.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, Tab, TabList } from '@astryx-svelte/core';

	let value = $state('inbox');
</script>

{#snippet inboxBadge()}<Badge variant="error" label="5" />{/snippet}
{#snippet draftsBadge()}<Badge variant="neutral" label="2" />{/snippet}

<TabList {value} onChange={(next) => (value = next)}>
	<Tab value="inbox" label="Inbox" endContent={inboxBadge} />
	<Tab value="sent" label="Sent" />
	<Tab value="drafts" label="Drafts" endContent={draftsBadge} />
</TabList>
