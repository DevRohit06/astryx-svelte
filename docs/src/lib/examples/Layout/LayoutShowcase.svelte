<!--
	Ported from upstream's `templates/blocks/components/Layout/LayoutShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Badge,
		Button,
		Heading,
		HStack,
		Layout,
		LayoutContent,
		LayoutFooter,
		LayoutHeader,
		LayoutPanel,
		List,
		ListItem,
		Section,
		Text,
		VStack
	} from '@astryx-svelte/core';
</script>

<Section padding={4}>
	<Layout height="fill">
		{#snippet header()}
			<LayoutHeader hasDivider>
				<HStack gap={2} vAlign="center">
					<Heading level={4}>Projects</Heading>
					<Badge variant="info" label="3 active" />
				</HStack>
			</LayoutHeader>
		{/snippet}
		{#snippet start()}
			<LayoutPanel hasDivider width={140}>
				<List>
					<ListItem label="Dashboard" isSelected />
					<ListItem label="Analytics" />
					<ListItem label="Settings" />
				</List>
			</LayoutPanel>
		{/snippet}
		{#snippet content()}
			<LayoutContent>
				<VStack gap={2}>
					<Heading level={5}>Welcome back</Heading>
					<Text type="body" color="secondary">
						You have 3 active projects and 2 pending reviews.
					</Text>
				</VStack>
			</LayoutContent>
		{/snippet}
		{#snippet footer()}
			<LayoutFooter hasDivider>
				<HStack gap={2} hAlign="end">
					<Button label="New Project" variant="primary">New Project</Button>
				</HStack>
			</LayoutFooter>
		{/snippet}
	</Layout>
</Section>
