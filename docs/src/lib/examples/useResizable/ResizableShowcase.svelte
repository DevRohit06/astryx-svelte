<!--
	Ported from upstream's `templates/blocks/components/Resizable/ResizableShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Card,
		Heading,
		Layout,
		LayoutContent,
		LayoutPanel,
		ResizeHandle,
		Text,
		useResizable,
		VStack
	} from '@astryx-svelte/core';

	/** `useResizable` takes its config as a getter here, against upstream's object. */
	const sidebar = useResizable(() => ({
		defaultSize: 200,
		minSizePx: 120,
		maxSizePx: 400
	}));
</script>

<Card variant="muted" height={280} width={600}>
	<Layout height="fill">
		{#snippet start()}
			<LayoutPanel width={sidebar.size} hasDivider={false}>
				<VStack gap={2}>
					<Heading level={4}>Sidebar</Heading>
					<Text color="secondary">{Math.round(sidebar.size)}px wide</Text>
				</VStack>
			</LayoutPanel>
			<ResizeHandle
				direction="horizontal"
				hasDivider
				resizable={sidebar.props}
				label="Resize sidebar"
			/>
		{/snippet}
		{#snippet content()}
			<LayoutContent>
				<VStack gap={2}>
					<Heading level={4}>Content</Heading>
					<Text color="secondary">Drag the handle to resize the sidebar.</Text>
				</VStack>
			</LayoutContent>
		{/snippet}
	</Layout>
</Card>
