<!--
	Ported from upstream's `templates/blocks/components/OverflowList/OverflowListOverflowBadges.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, Card, OverflowList } from '@astryx-svelte/core';
	import type { BadgeProps } from '@astryx-svelte/core';

	/**
	 * Upstream passes the badges as `children`; this port takes `items` plus an
	 * `item` snippet, so each badge's variant travels in the data instead of on a
	 * child element.
	 */
	const tags: Array<{ label: string; variant: BadgeProps['variant'] }> = [
		{ label: 'React', variant: 'info' },
		{ label: 'TypeScript', variant: 'success' },
		{ label: 'StyleX', variant: 'warning' },
		{ label: 'Storybook', variant: 'neutral' },
		{ label: 'Vitest', variant: 'error' }
	];
</script>

<Card padding={2} style="resize: horizontal; overflow: hidden; min-width: 80px; width: 300px">
	<OverflowList items={tags} gap={1}>
		{#snippet item(tag)}
			<Badge variant={tag.variant} label={tag.label} />
		{/snippet}
		{#snippet overflowRenderer(overflowItems)}
			<Badge variant="neutral" label={`+${overflowItems.length}`} />
		{/snippet}
	</OverflowList>
</Card>
