<!--
	Ported from upstream's `templates/blocks/components/Grid/GridDashboardLayout.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Grid, GridSpan, Text } from '@astryx-svelte/core';

	const metrics = [
		{ label: 'Revenue', value: '$48,290' },
		{ label: 'Active Users', value: '12,841' },
		{ label: 'Conversion', value: '3.2%' },
		{ label: 'Avg Response', value: '245ms' }
	];
</script>

<Grid columns={4} gap={4} width="100%" style="max-width: 500px">
	<GridSpan columns={2} rows={2}>
		<Card>
			<Text type="label" display="block">Weekly Traffic</Text>
			<Text type="supporting" display="block">
				Page views and unique visitors over the last 7 days
			</Text>
		</Card>
	</GridSpan>
	{#each metrics as metric (metric.label)}
		<Card>
			<Text type="supporting" display="block">{metric.label}</Text>
			<Text type="label" display="block">{metric.value}</Text>
		</Card>
	{/each}
	<GridSpan columns="full">
		<Card>
			<Text type="label" display="block">Recent Activity</Text>
			<Text type="supporting" display="block">Latest events across all projects</Text>
		</Card>
	</GridSpan>
</Grid>
