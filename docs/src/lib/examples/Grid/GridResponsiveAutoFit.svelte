<!--
	Ported from upstream's `templates/blocks/components/Grid/GridResponsiveAutoFit.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		Card,
		Grid,
		Layout,
		LayoutContent,
		LayoutPanel,
		ResizeHandle,
		Text,
		useResizable,
		VStack
	} from '@astryx-svelte/core';

	const teams = [
		{ name: 'Design Systems', members: 8 },
		{ name: 'Frontend Platform', members: 12 },
		{ name: 'Developer Experience', members: 6 },
		{ name: 'Accessibility', members: 4 },
		{ name: 'Performance', members: 7 },
		{ name: 'Mobile Infrastructure', members: 9 }
	];

	/** `useResizable` takes its config as a getter here, against upstream's object. */
	const gridPanel = useResizable(() => ({
		defaultSize: 480,
		minSizePx: 100,
		maxSizePx: 480
	}));
</script>

<Card variant="muted" padding={0} height={400} width="100%" style="max-width: 500px">
	<Layout height="fill">
		{#snippet start()}
			<LayoutPanel width={gridPanel.size} hasDivider={false} style="padding: var(--spacing-4)">
				<Grid columns={{ minWidth: 180, repeat: 'fit' }} gap={4} width="100%">
					{#each teams as team (team.name)}
						<Card>
							<VStack gap={1}>
								<Text type="label" display="block">{team.name}</Text>
								<Text type="supporting" display="block">{team.members} members</Text>
							</VStack>
						</Card>
					{/each}
				</Grid>
			</LayoutPanel>
			<ResizeHandle
				direction="horizontal"
				hasDivider
				isAlwaysVisible
				resizable={gridPanel.props}
				label="Resize grid"
			/>
		{/snippet}
		{#snippet content()}
			<LayoutContent />
		{/snippet}
	</Layout>
</Card>
