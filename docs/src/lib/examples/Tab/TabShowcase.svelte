<!--
	Ported from upstream's `templates/blocks/components/Tab/TabShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, Tab, TabList } from '@astryx-svelte/core';

	let value = $state('inbox');
</script>

<TabList {value} onChange={(next) => (value = next)}>
	<Tab value="inbox" label="Inbox">
		{#snippet endContent()}<Badge label="3" variant="info" />{/snippet}
	</Tab>
</TabList>
