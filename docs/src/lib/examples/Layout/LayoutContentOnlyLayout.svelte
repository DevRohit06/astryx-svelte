<!--
	Ported from upstream's `templates/blocks/components/Layout/LayoutContentOnlyLayout.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Heading, Layout, LayoutContent, Text, VStack } from '@astryx-svelte/core';
</script>

<Card width="100%" style="max-width: 400px">
	<Layout>
		{#snippet content()}
			<LayoutContent>
				<VStack gap={3}>
					<Heading level={4}>Simple Content</Heading>
					<Text type="body">
						A layout can have just content without header or footer. This is useful for simple cards
						or content blocks that don&apos;t need structured sections.
					</Text>
				</VStack>
			</LayoutContent>
		{/snippet}
	</Layout>
</Card>
