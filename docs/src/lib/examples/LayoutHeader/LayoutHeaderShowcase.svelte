<!--
	Ported from upstream's `templates/blocks/components/LayoutHeader/LayoutHeaderShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Button,
		Card,
		Center,
		Heading,
		HStack,
		Layout,
		LayoutContent,
		LayoutFooter,
		LayoutHeader,
		LayoutPanel
	} from '@astryx-svelte/core';
</script>

<Center width={400}>
	<Layout style="width: 100%" height="fill">
		{#snippet header()}
			<LayoutHeader hasDivider>
				<HStack gap={2} vAlign="center" hAlign="between">
					<Heading level={4}>Dashboard</Heading>
					<HStack gap={2}>
						<Button label="Export" variant="secondary">Export</Button>
						<Button label="New Item" variant="primary">New Item</Button>
					</HStack>
				</HStack>
			</LayoutHeader>
		{/snippet}
		{#snippet start()}
			<LayoutPanel hasDivider width={140}><Card variant="muted" /></LayoutPanel>
		{/snippet}
		{#snippet content()}
			<LayoutContent><Card variant="muted" /></LayoutContent>
		{/snippet}
		{#snippet footer()}
			<LayoutFooter hasDivider><Card variant="muted" /></LayoutFooter>
		{/snippet}
	</Layout>
</Center>
