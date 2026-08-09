<!--
	Ported from upstream's `templates/blocks/components/LayoutContent/LayoutContentShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Card,
		Center,
		Heading,
		Layout,
		LayoutContent,
		LayoutFooter,
		LayoutHeader,
		LayoutPanel,
		Text,
		VStack
	} from '@astryx-svelte/core';
</script>

<Center width={500}>
	<Layout style="width: 100%" height="fill">
		{#snippet header()}
			<LayoutHeader hasDivider><Card variant="muted" /></LayoutHeader>
		{/snippet}
		{#snippet start()}
			<LayoutPanel hasDivider width={140}><Card variant="muted" /></LayoutPanel>
		{/snippet}
		{#snippet content()}
			<LayoutContent role="main">
				<VStack gap={3}>
					<Heading level={5}>Main Content Area</Heading>
					<Text type="body" color="secondary">
						LayoutContent provides automatic padding and scroll containment. It fills the remaining
						space between the header and footer.
					</Text>
					<Text type="body" color="secondary">
						Content that overflows will scroll within this area while the header and footer remain
						fixed.
					</Text>
				</VStack>
			</LayoutContent>
		{/snippet}
		{#snippet footer()}
			<LayoutFooter hasDivider><Card variant="muted" /></LayoutFooter>
		{/snippet}
	</Layout>
</Center>
