<!--
	Ported from upstream's `templates/blocks/components/Pagination/PaginationDotsCarousel.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, Card, Icon, Pagination, Stack, Text } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' solid `StarIcon`; the registry ships no star, so
	 * this substitutes a built-in and keeps upstream's `color="warning"`, which is
	 * what carries the rating read. Retires with the icon registry (port/todo.md).
	 */

	const REVIEWS = [
		{
			name: 'Jeannie Grant',
			date: 'June 01, 2025',
			stars: 5,
			quote:
				'A thorough report was done on our financial situation. Better deals were found and processed on our behalf, which took a lot of stress away.'
		},
		{
			name: 'Derval Russell',
			date: 'November 09, 2025',
			stars: 5,
			quote:
				'I have been a client for 8 years now and have always found the advice provided excellent. They take the time to explain things clearly.'
		},
		{
			name: 'Claire Dawson',
			date: 'October 15, 2025',
			stars: 5,
			quote:
				'Constantly professional and concise. Our mortgage process was smooth from start to finish thanks to their dedicated team.'
		},
		{
			name: 'Marcus Webb',
			date: 'September 22, 2025',
			stars: 4,
			quote:
				'Great service overall. The team was responsive and knowledgeable. Would definitely recommend to anyone looking for solid financial advice.'
		}
	];

	let page = $state(1);
	const review = $derived(REVIEWS[page - 1]);
</script>

<!-- Upstream's `Stars` helper component; a parameterised snippet is the counterpart. -->
{#snippet stars(count: number)}
	<Stack direction="horizontal" gap={0}>
		{#each Array.from({ length: count }, (_, i) => i) as i (i)}
			<Icon icon="success" size="sm" color="warning" />
		{/each}
	</Stack>
{/snippet}

<Stack direction="vertical" gap={3} style="max-width: 480px; width: 100%">
	<Card padding={5}>
		<Stack direction="vertical" gap={3}>
			{@render stars(review.stars)}
			<Text type="body">{review.quote}</Text>
			<Stack direction="horizontal" gap={3} vAlign="center" hAlign="start">
				<Avatar name={review.name} size="md" />
				<Stack direction="vertical" gap={0}>
					<Text type="supporting" weight="bold">{review.name}</Text>
					<Text type="supporting" color="secondary">{review.date}</Text>
				</Stack>
			</Stack>
		</Stack>
	</Card>
	<Pagination
		{page}
		onChange={(next) => (page = next)}
		totalPages={REVIEWS.length}
		variant="dots"
		style="justify-content: center; padding-top: 4px"
	/>
</Stack>
