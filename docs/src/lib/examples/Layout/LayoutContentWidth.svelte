<!--
	Ported from upstream's `templates/blocks/components/Layout/LayoutContentWidth.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Button,
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

<Layout height="fill" contentWidth={360}>
	{#snippet header()}
		<LayoutHeader hasDivider>
			<Heading level={4}>Centered Form</Heading>
		</LayoutHeader>
	{/snippet}
	{#snippet content()}
		<LayoutContent>
			<VStack gap={3}>
				<Text type="body">
					The contentWidth prop constrains content to a maximum width and centers it within the
					layout. Dividers remain full-bleed while content stays narrow and readable.
				</Text>
				<Text type="body" color="secondary">
					Common widths: 640 for forms, 960 for content pages.
				</Text>
			</VStack>
		</LayoutContent>
	{/snippet}
	{#snippet footer()}
		<LayoutFooter hasDivider>
			<HStack gap={2} hAlign="end">
				<Button label="Cancel" variant="secondary">Cancel</Button>
				<Button label="Submit" variant="primary">Submit</Button>
			</HStack>
		</LayoutFooter>
	{/snippet}
</Layout>
