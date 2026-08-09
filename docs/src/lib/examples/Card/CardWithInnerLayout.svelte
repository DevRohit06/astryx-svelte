<!--
	Ported from upstream's `templates/blocks/components/Card/CardWithInnerLayout.tsx`.
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
		Text
	} from '@astryx-svelte/core';
</script>

<Card width={380}>
	<Layout>
		{#snippet header()}
			<LayoutHeader hasDivider>
				<Heading level={3}>Edit Profile</Heading>
			</LayoutHeader>
		{/snippet}
		{#snippet content()}
			<LayoutContent>
				<Text type="body" color="secondary">
					Update your display name, bio, and profile photo. Changes are saved immediately.
				</Text>
			</LayoutContent>
		{/snippet}
		{#snippet footer()}
			<LayoutFooter hasDivider>
				<HStack gap={2} hAlign="end">
					<Button label="Cancel" variant="ghost" />
					<Button label="Save changes" variant="primary" />
				</HStack>
			</LayoutFooter>
		{/snippet}
	</Layout>
</Card>
