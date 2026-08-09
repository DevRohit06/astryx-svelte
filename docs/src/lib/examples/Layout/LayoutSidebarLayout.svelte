<!--
	Ported from upstream's `templates/blocks/components/Layout/LayoutSidebarLayout.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Button,
		Card,
		Heading,
		HStack,
		Layout,
		LayoutContent,
		LayoutFooter,
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
				<Heading level={4}>Settings</Heading>
			</LayoutHeader>
		{/snippet}
		{#snippet start()}
			<LayoutPanel hasDivider role="navigation" width={150}>
				<List>
					<ListItem label="General" isSelected />
					<ListItem label="Account" />
					<ListItem label="Privacy" />
					<ListItem label="Notifications" />
					<ListItem label="Security" />
				</List>
			</LayoutPanel>
		{/snippet}
		{#snippet content()}
			<LayoutContent>
				<VStack gap={3}>
					<Heading level={5}>General Settings</Heading>
					<Text type="body">
						Configure your general preferences here. The sidebar navigation allows you to switch
						between different settings sections.
					</Text>
				</VStack>
			</LayoutContent>
		{/snippet}
		{#snippet footer()}
			<LayoutFooter hasDivider>
				<HStack gap={2} hAlign="end">
					<Button label="Reset" variant="secondary">Reset</Button>
					<Button label="Save Changes" variant="primary">Save Changes</Button>
				</HStack>
			</LayoutFooter>
		{/snippet}
	</Layout>
</Card>
