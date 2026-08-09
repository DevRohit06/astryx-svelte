<!--
	Ported from upstream's `templates/blocks/components/GridSpan/GridSpanShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Grid, GridSpan, Text } from '@astryx-svelte/core';
</script>

<Grid columns={4} gap={3} width={400}>
	<GridSpan columns={3}>
		<Card height={80}>
			<Text type="body" color="secondary">Spans 3 columns</Text>
		</Card>
	</GridSpan>
	<Card height={80}>
		<Text type="body" color="secondary">1 col</Text>
	</Card>
	<GridSpan rows={2}>
		<Card>
			<Text type="body" color="secondary">1 col</Text>
		</Card>
	</GridSpan>
	<GridSpan columns={3}>
		<Card height={80}>
			<Text type="body" color="secondary">Full-width row</Text>
		</Card>
	</GridSpan>
	<Card height={80}>
		<Text type="body" color="secondary">1 col</Text>
	</Card>
	<GridSpan columns={2}>
		<Card height={80}>
			<Text type="body" color="secondary">Spans 2 columns</Text>
		</Card>
	</GridSpan>
</Grid>
