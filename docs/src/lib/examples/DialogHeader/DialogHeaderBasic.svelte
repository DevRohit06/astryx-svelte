<!--
	Ported from upstream's `templates/blocks/components/DialogHeader/DialogHeaderBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Dialog, DialogHeader, Layout, LayoutContent, Text } from '@astryx-svelte/core';
</script>

<Dialog isOpen isInline onOpenChange={() => {}}>
	<Layout>
		{#snippet header()}
			<DialogHeader
				title="Invite teammates"
				subtitle="Send invitations to join your workspace"
				onOpenChange={() => {}}
			/>
		{/snippet}
		{#snippet content()}
			<LayoutContent>
				<Text type="body" color="secondary">Dialog body content goes here.</Text>
			</LayoutContent>
		{/snippet}
	</Layout>
</Dialog>
