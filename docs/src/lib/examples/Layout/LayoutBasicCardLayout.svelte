<!--
	Ported from upstream's `templates/blocks/components/Layout/LayoutBasicCardLayout.tsx`.
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
		Text,
		VStack
	} from '@astryx-svelte/core';
</script>

<Card height={300} width="100%" style="max-width: 400px">
	<Layout>
		{#snippet header()}
			<LayoutHeader hasDivider>
				<Heading level={4}>Card Title</Heading>
			</LayoutHeader>
		{/snippet}
		{#snippet content()}
			<LayoutContent>
				<VStack gap={3}>
					<Text type="body">
						This is a basic card layout with a header, scrollable content area, and footer. The
						layout automatically handles padding and spacing between sections.
					</Text>
					<Text type="body">
						When content exceeds the available height, the content area scrolls independently while
						the header and footer stay fixed in place.
					</Text>
					<Text type="body">
						This pattern works well for modal dialogs, detail panels, and any card where the amount
						of content is unpredictable.
					</Text>
					<Text type="body">
						The dividers between header, content, and footer provide clear visual boundaries between
						the fixed and scrollable regions.
					</Text>
				</VStack>
			</LayoutContent>
		{/snippet}
		{#snippet footer()}
			<LayoutFooter hasDivider>
				<HStack gap={2} hAlign="end">
					<Button label="Cancel" variant="secondary">Cancel</Button>
					<Button label="Save" variant="primary">Save</Button>
				</HStack>
			</LayoutFooter>
		{/snippet}
	</Layout>
</Card>
