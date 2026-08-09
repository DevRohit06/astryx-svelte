<!--
	Ported from upstream's `templates/blocks/components/LayoutPanel/LayoutPanelNavigation.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Card,
		Center,
		Layout,
		LayoutContent,
		LayoutPanel,
		List,
		ListItem
	} from '@astryx-svelte/core';
</script>

<Center width={400}>
	<Layout style="width: 100%" height="fill">
		{#snippet start()}
			<LayoutPanel hasDivider width={140} role="navigation">
				<List>
					<ListItem label="Overview" isSelected />
					<ListItem label="Analytics" />
					<ListItem label="Settings" />
				</List>
			</LayoutPanel>
		{/snippet}
		{#snippet content()}
			<LayoutContent>
				<Card variant="muted" />
			</LayoutContent>
		{/snippet}
	</Layout>
</Center>
