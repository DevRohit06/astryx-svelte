<!--
	Ported from upstream's `templates/blocks/components/LayoutPanel/LayoutPanelShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Card,
		Center,
		Layout,
		LayoutContent,
		LayoutFooter,
		LayoutHeader,
		LayoutPanel,
		List,
		ListItem
	} from '@astryx-svelte/core';
</script>

<Center width={400}>
	<Layout style="width: 100%" height="fill">
		{#snippet header()}
			<LayoutHeader hasDivider><Card variant="muted" /></LayoutHeader>
		{/snippet}
		{#snippet start()}
			<LayoutPanel hasDivider width={140} role="navigation">
				<List>
					<ListItem label="Overview" isSelected />
					<ListItem label="Analytics" />
					<ListItem label="Reports" />
					<ListItem label="Settings" />
				</List>
			</LayoutPanel>
		{/snippet}
		{#snippet content()}
			<LayoutContent><Card variant="muted" /></LayoutContent>
		{/snippet}
		{#snippet footer()}
			<LayoutFooter hasDivider><Card variant="muted" /></LayoutFooter>
		{/snippet}
	</Layout>
</Center>
