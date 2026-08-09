<!--
	Ported from upstream's `templates/blocks/components/Card/CardElevations.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Grid, Stack, Text, Heading } from '@astryx-svelte/core';

	const LEVELS = [
		{ elevation: 'none', caption: 'Flat — sits on the page (default)' },
		{ elevation: 'low', caption: 'Low — lifts off slightly' },
		{ elevation: 'med', caption: 'Med — clearly raised' },
		{ elevation: 'high', caption: 'High — floats well above' }
	] as const;
</script>

<Grid columns={2} gap={4} width={520}>
	{#each LEVELS as level (level.elevation)}
		<Card elevation={level.elevation}>
			<Stack direction="vertical" gap={1}>
				<Heading level={4}>elevation="{level.elevation}"</Heading>
				<Text type="supporting" color="secondary">{level.caption}</Text>
			</Stack>
		</Card>
	{/each}
</Grid>
