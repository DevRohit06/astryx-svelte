<!--
	Ported from upstream's `templates/blocks/components/Layout/LayoutFullBleedContent.tsx`.
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
		Section,
		Text
	} from '@astryx-svelte/core';
</script>

<Card width="100%" style="max-width: 400px">
	<Layout>
		{#snippet header()}
			<LayoutHeader hasDivider>
				<Heading level={4}>Full Bleed Example</Heading>
			</LayoutHeader>
		{/snippet}
		{#snippet content()}
			<LayoutContent padding={0}>
				<Section variant="muted">
					<Text type="body">
						Section automatically escapes the parent container padding to fill edge-to-edge. Useful
						for wash backgrounds, tables, or images that need to span the full width.
					</Text>
				</Section>
			</LayoutContent>
		{/snippet}
		{#snippet footer()}
			<LayoutFooter hasDivider>
				<HStack gap={2} hAlign="end">
					<Button label="Close" variant="secondary">Close</Button>
				</HStack>
			</LayoutFooter>
		{/snippet}
	</Layout>
</Card>
