<!--
	Ported from upstream's `templates/blocks/components/Layout/LayoutDualPanelLayout.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Card,
		Heading,
		Layout,
		LayoutContent,
		LayoutHeader,
		LayoutPanel,
		List,
		ListItem,
		Text,
		VStack
	} from '@astryx-svelte/core';
</script>

<Card width="100%" style="max-width: 500px">
	<Layout>
		{#snippet header()}
			<LayoutHeader hasDivider>
				<Heading level={4}>File Browser</Heading>
			</LayoutHeader>
		{/snippet}
		{#snippet start()}
			<LayoutPanel width={120} hasDivider>
				<VStack gap={1}>
					<Text type="label" color="secondary">Folders</Text>
					<List>
						<ListItem label="Documents" />
						<ListItem label="Projects" isSelected />
						<ListItem label="Downloads" />
					</List>
				</VStack>
			</LayoutPanel>
		{/snippet}
		{#snippet content()}
			<LayoutContent>
				<VStack gap={2}>
					<Text type="label" color="secondary">Files</Text>
					<Card variant="muted">
						<Text type="body">Select a folder to view its contents</Text>
					</Card>
				</VStack>
			</LayoutContent>
		{/snippet}
		{#snippet end()}
			<LayoutPanel width={120} hasDivider>
				<VStack gap={2}>
					<Text type="label" color="secondary">Details</Text>
					<Text type="body">Select a file to view details</Text>
				</VStack>
			</LayoutPanel>
		{/snippet}
	</Layout>
</Card>
