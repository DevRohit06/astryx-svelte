<!--
	Ported from upstream's `templates/blocks/components/LayoutFooter/LayoutFooterShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Button,
		Card,
		Center,
		HStack,
		Layout,
		LayoutContent,
		LayoutFooter,
		LayoutHeader,
		LayoutPanel
	} from '@astryx-svelte/core';
</script>

<Center width={400}>
	<Layout style="width: 100%" height="fill">
		{#snippet header()}
			<LayoutHeader hasDivider><Card variant="muted" /></LayoutHeader>
		{/snippet}
		{#snippet start()}
			<LayoutPanel hasDivider width={140}><Card variant="muted" /></LayoutPanel>
		{/snippet}
		{#snippet content()}
			<LayoutContent><Card variant="muted" /></LayoutContent>
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
</Center>
