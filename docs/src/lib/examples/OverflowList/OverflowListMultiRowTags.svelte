<!--
	Ported from upstream's `templates/blocks/components/OverflowList/OverflowListMultiRowTags.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, Card, OverflowList } from '@astryx-svelte/core';

	/**
	 * `maxRows={2}` wraps the tags across two rows before collapsing the rest —
	 * a number, not a boolean, because unbounded wrapping is a plain flex-wrap
	 * layout rather than overflow collapse. Drag the card's corner to resize.
	 *
	 * Upstream passes the badges as `children`; this port takes `items` plus an
	 * `item` snippet.
	 */
	const tags = [
		'React',
		'TypeScript',
		'StyleX',
		'Storybook',
		'Vitest',
		'Playwright',
		'ESLint',
		'Prettier',
		'Vite',
		'pnpm'
	];
</script>

<Card padding={2} style="resize: horizontal; overflow: hidden; min-width: 120px; width: 260px">
	<OverflowList items={tags} gap={1} maxRows={2}>
		{#snippet item(tag)}
			<Badge variant="info" label={tag} />
		{/snippet}
		{#snippet overflowRenderer(overflowItems)}
			<Badge variant="neutral" label={`+${overflowItems.length}`} />
		{/snippet}
	</OverflowList>
</Card>
