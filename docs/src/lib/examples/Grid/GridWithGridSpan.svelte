<!--
	Ported from upstream's `templates/blocks/components/Grid/GridWithGridSpan.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Grid, GridSpan, Text, VStack } from '@astryx-svelte/core';

	const tiles = [
		{ label: 'Components', note: '54 available' },
		{ label: 'Templates', note: '28 available' },
		{ label: 'Tokens', note: '120 defined' },
		{ label: 'Themes', note: '6 published' },
		{ label: 'Icons', note: '312 available' },
		{ label: 'Patterns', note: '18 documented' },
		{ label: 'Contributors', note: '42 active' }
	];
</script>

<Grid columns={3} gap={4} width="100%" style="max-width: 500px">
	<GridSpan rows={2}>
		<Card variant="cyan">
			<VStack gap={1}>
				<Text type="label" display="block">Featured Release</Text>
				<Text type="supporting" display="block">
					Astryx 4.0 is now available with new layout primitives, refreshed tokens, and improved
					theming support across the system.
				</Text>
			</VStack>
		</Card>
	</GridSpan>
	{#each tiles as tile (tile.label)}
		<Card>
			<Text type="label" display="block">{tile.label}</Text>
			<Text type="supporting" display="block">{tile.note}</Text>
		</Card>
	{/each}
	<GridSpan columns="full">
		<Card variant="cyan">
			<VStack gap={1}>
				<Text type="label" display="block">Community Showcase</Text>
				<Text type="supporting" display="block">
					See how teams are building with Astryx across the organization
				</Text>
			</VStack>
		</Card>
	</GridSpan>
</Grid>
