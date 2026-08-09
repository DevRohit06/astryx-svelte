<!--
	Ported from upstream's `templates/blocks/components/OverflowList/OverflowListCollapseFromStartList.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Card, Center, OverflowList } from '@astryx-svelte/core';

	/**
	 * Upstream passes the buttons as `children`; this port takes `items` plus an
	 * `item` snippet, so the same five steps render through the snippet.
	 */
	const steps = ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5'];
</script>

<Center width={300}>
	<Card padding={2}>
		<OverflowList items={steps} gap={2} collapseFrom="start">
			{#snippet item(label)}
				<Button {label} size="sm" />
			{/snippet}
			{#snippet overflowRenderer(overflowItems)}
				<Button label={`+${overflowItems.length} more`} variant="ghost" size="sm" />
			{/snippet}
		</OverflowList>
	</Card>
</Center>
