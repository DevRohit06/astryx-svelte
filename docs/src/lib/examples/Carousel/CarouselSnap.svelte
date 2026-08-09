<!--
	Ported from upstream's `templates/blocks/components/Carousel/CarouselSnap.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, Badge, Card, Carousel, Stack, Text } from '@astryx-svelte/core';

	const TEAM = [
		{ name: 'Alice Chen', role: 'Engineering Lead', color: 'blue' as const },
		{ name: 'Bob Smith', role: 'Product Designer', color: 'purple' as const },
		{ name: 'Carol Davis', role: 'Product Manager', color: 'green' as const },
		{ name: 'Andrew Thomas', role: 'Design Manager', color: 'red' as const },
		{ name: 'Gina Wilson', role: 'Software Engineer', color: 'orange' as const }
	];
</script>

<!--
	Upstream maps the items into `children`; this port takes `items` plus an
	`item` snippet, so the same list renders through the snippet instead.
-->
<Stack direction="vertical" gap={3} style="max-width: 520px; padding: 8px">
	<Text type="body" weight="bold">Team members</Text>
	<Carousel items={TEAM} gap={2} hasSnap hasButtons aria-label="Team members">
		{#snippet item(person)}
			<Card width={180} minHeight={140}>
				<Stack direction="vertical" gap={3} hAlign="center">
					<Avatar name={person.name} size="lg" />
					<Stack direction="vertical" gap={1} hAlign="center">
						<Text type="body" weight="bold">{person.name}</Text>
						<Badge variant={person.color} label={person.role} />
					</Stack>
				</Stack>
			</Card>
		{/snippet}
	</Carousel>
</Stack>
