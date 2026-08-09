<!--
	Ported from upstream's `templates/blocks/components/DialogHeader/DialogHeaderShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Dialog, DialogHeader, Layout, LayoutContent, Text } from '@astryx-svelte/core';
</script>

<Dialog isOpen isInline onOpenChange={() => {}}>
	<Layout>
		{#snippet header()}
			<DialogHeader
				title="Edit Profile"
				subtitle="Update your personal information"
				onOpenChange={() => {}}
			/>
		{/snippet}
		{#snippet content()}
			<LayoutContent>
				<Card variant="muted">
					<Text type="body" color="secondary">Dialog body content goes here.</Text>
				</Card>
			</LayoutContent>
		{/snippet}
	</Layout>
</Dialog>
