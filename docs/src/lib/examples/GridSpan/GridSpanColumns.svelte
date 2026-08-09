<!--
	Ported from upstream's `templates/blocks/components/GridSpan/GridSpanColumns.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Grid, GridSpan, Text } from '@astryx-svelte/core';
</script>

<Grid columns={3} gap={3} width={400}>
	<GridSpan columns={2}>
		<Card height={80}>
			<Text type="body" color="secondary">Spans 2 columns</Text>
		</Card>
	</GridSpan>
	<Card height={80}>
		<Text type="body" color="secondary">1 col</Text>
	</Card>
	<Card height={80}>
		<Text type="body" color="secondary">1 col</Text>
	</Card>
	<GridSpan columns={2}>
		<Card height={80}>
			<Text type="body" color="secondary">Spans 2 columns</Text>
		</Card>
	</GridSpan>
</Grid>
