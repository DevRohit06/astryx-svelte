<!--
	Ported from upstream's `templates/blocks/components/Grid/GridGalleryExample.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Grid, Text, VStack } from '@astryx-svelte/core';

	const cards = [
		{ title: 'Getting Started', description: 'Learn the basics of the platform.' },
		{ title: 'Components', description: 'Browse the full component library.' },
		{ title: 'Design Tokens', description: 'Colors, spacing, and typography.' },
		{ title: 'Theming', description: 'Customize the look and feel.' },
		{ title: 'Accessibility', description: 'Build inclusive experiences.' },
		{ title: 'Patterns', description: 'Common UI composition patterns.' }
	];
</script>

<Grid columns={{ minWidth: 180 }} gap={5} width="100%" style="max-width: 400px">
	{#each cards as card (card.title)}
		<Card>
			<VStack gap={1}>
				<Text type="label" display="block">{card.title}</Text>
				<Text type="supporting" display="block">{card.description}</Text>
			</VStack>
		</Card>
	{/each}
</Grid>
