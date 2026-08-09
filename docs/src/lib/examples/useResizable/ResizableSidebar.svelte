<!--
	Ported from upstream's `templates/blocks/components/Resizable/ResizableSidebar.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Button,
		Card,
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
		defaultSize: 240,
		minSizePx: 160,
		maxSizePx: 360,
		collapsible: true,
		snaps: [200, 280]
	}));
</script>

<Card variant="muted" height={240} width={500}>
	<Layout height="fill">
		{#snippet start()}
			<LayoutPanel width={sidebar.size} hasDivider={false}>
				<Text color="secondary">
					{sidebar.isCollapsed ? '' : `${Math.round(sidebar.size)}px wide`}
				</Text>
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
					<Text color="secondary">
						Drag the handle — it snaps at 200px and 280px. Drag all the way left to collapse the
						sidebar.
					</Text>
					{#if sidebar.isCollapsed}
						<Button
							label="Expand sidebar"
							variant="secondary"
							size="sm"
							onclick={() => sidebar.expand()}
						/>
					{/if}
				</VStack>
			</LayoutContent>
		{/snippet}
	</Layout>
</Card>
