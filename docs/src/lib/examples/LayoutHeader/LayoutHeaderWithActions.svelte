<!--
	Ported from upstream's `templates/blocks/components/LayoutHeader/LayoutHeaderWithActions.tsx`.
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
		LayoutHeader
	} from '@astryx-svelte/core';
</script>

<Center width={400}>
	<Layout style="width: 100%" height="fill">
		{#snippet header()}
			<LayoutHeader hasDivider>
				<HStack gap={2} vAlign="center" hAlign="between">
					<Heading level={4}>Dashboard</Heading>
					<Button label="New Item" variant="primary">New Item</Button>
				</HStack>
			</LayoutHeader>
		{/snippet}
		{#snippet content()}
			<LayoutContent>
				<Card variant="muted" />
			</LayoutContent>
		{/snippet}
	</Layout>
</Center>
