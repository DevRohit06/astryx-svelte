<!--
	Ported from upstream's `templates/blocks/components/Carousel/CarouselCards.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Carousel, Stack, Text } from '@astryx-svelte/core';

	const FEATURES = [
		{ title: 'Design System', desc: 'Tokens, components, and patterns' },
		{ title: 'Documentation', desc: 'API reference and usage guides' },
		{ title: 'Sandbox', desc: 'Visual testing and previews' },
		{ title: 'Library', desc: 'Component and hook information' },
		{ title: 'Contributing', desc: 'Open source development' }
	];
</script>

<!--
	Upstream maps the items into `children`; this port takes `items` plus an
	`item` snippet, so the same list renders through the snippet instead.
-->
<Stack direction="vertical" gap={3} style="max-width: 520px; padding: 8px">
	<Text type="body" weight="bold">Browse features</Text>
	<Carousel items={FEATURES} gap={2} hasSnap aria-label="Feature cards">
		{#snippet item(entry)}
			<Card width={200} minHeight={100}>
				<Stack direction="vertical" gap={1}>
					<Text type="body" weight="bold">{entry.title}</Text>
					<Text type="supporting" color="secondary">{entry.desc}</Text>
				</Stack>
			</Card>
		{/snippet}
	</Carousel>
</Stack>
