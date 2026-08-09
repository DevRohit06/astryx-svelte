<!--
	Ported from upstream's `templates/blocks/components/LayoutContent/LayoutContentBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Card,
		Center,
		Heading,
		Layout,
		LayoutContent,
		LayoutHeader,
		Text,
		VStack
	} from '@astryx-svelte/core';
</script>

<Center width={400}>
	<Layout style="width: 100%" height="fill">
		{#snippet header()}
			<LayoutHeader hasDivider>
				<Card variant="muted" />
			</LayoutHeader>
		{/snippet}
		{#snippet content()}
			<LayoutContent role="main">
				<VStack gap={3}>
					<Heading level={5}>Main Content</Heading>
					<Text type="body" color="secondary">
						LayoutContent fills the remaining space and scrolls when its content overflows, while
						the header stays fixed.
					</Text>
				</VStack>
			</LayoutContent>
		{/snippet}
	</Layout>
</Center>
