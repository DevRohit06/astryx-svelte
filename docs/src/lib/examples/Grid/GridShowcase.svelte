<!--
	Ported from upstream's `templates/blocks/components/Grid/GridShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Grid } from '@astryx-svelte/core';
</script>

<Grid columns={3} gap={2} width={400}>
	{#each Array.from({ length: 12 }, (_, i) => i) as i (i)}
		<Card>Item {i + 1}</Card>
	{/each}
</Grid>
