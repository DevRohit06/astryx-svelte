<!--
	Ported from upstream's `templates/blocks/components/Carousel/CarouselShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Card, Carousel, Heading, Stack, Text } from '@astryx-svelte/core';

	const ITEMS = [
		{ title: 'Design', body: 'Create wireframes and prototypes.' },
		{ title: 'Develop', body: 'Build components and pages.' },
		{ title: 'Test', body: 'Write tests and fix bugs.' },
		{ title: 'Deploy', body: 'Ship to production.' },
		{ title: 'Monitor', body: 'Track performance and errors.' }
	];
</script>

<!--
	Upstream maps the items into `children`; this port takes `items` plus an
	`item` snippet, so the same list renders through the snippet instead.
-->
<Carousel
	items={ITEMS}
	gap={2}
	hasSnap
	hasButtons={false}
	aria-label="Workflow steps"
	style="max-width: 500px"
>
	{#snippet item(entry)}
		<Card padding={3} style="min-width: 200px">
			<Stack direction="vertical" gap={1}>
				<Heading level={5}>{entry.title}</Heading>
				<Text type="supporting" color="secondary">{entry.body}</Text>
			</Stack>
		</Card>
	{/snippet}
</Carousel>
