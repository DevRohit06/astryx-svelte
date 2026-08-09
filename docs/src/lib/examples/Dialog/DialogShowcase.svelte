<!--
	Ported from upstream's `templates/blocks/components/Dialog/DialogShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Dialog, DialogHeader, Layout, LayoutContent, Text } from '@astryx-svelte/core';
</script>

<!-- Remove isInline for production — dialogs should be modal. -->
<Dialog isOpen isInline onOpenChange={() => {}}>
	<Layout>
		{#snippet header()}
			<DialogHeader title="Modal Title" onOpenChange={() => {}} />
		{/snippet}
		{#snippet content()}
			<LayoutContent>
				<Text type="body">Dialog content goes here.</Text>
			</LayoutContent>
		{/snippet}
	</Layout>
</Dialog>
