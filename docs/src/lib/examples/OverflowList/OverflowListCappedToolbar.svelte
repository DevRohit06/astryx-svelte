<!--
	Ported from upstream's `templates/blocks/components/OverflowList/OverflowListCappedToolbar.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Card, Center, DropdownMenu, OverflowList } from '@astryx-svelte/core';

	/**
	 * `maxVisibleItems` caps the list at three even when more would fit, so the
	 * toolbar keeps a fixed shape and the rest always collapse into the menu.
	 *
	 * Upstream passes the buttons as `children`; this port takes `items` plus an
	 * `item` snippet, so `actions` doubles as the data and as the array the
	 * overflow renderer indexes by `OverflowItem.index` — exactly as upstream's does.
	 */
	const actions = ['Save', 'Edit', 'Duplicate', 'Share', 'Archive', 'Delete'];
</script>

<Center width={420}>
	<Card padding={2}>
		<OverflowList items={actions} gap={2} maxVisibleItems={3}>
			{#snippet item(action)}
				<Button label={action} size="sm" />
			{/snippet}
			{#snippet overflowRenderer(overflowItems)}
				<DropdownMenu
					button={{ label: `+${overflowItems.length}`, variant: 'ghost', size: 'sm' }}
					items={overflowItems.map(({ index }) => ({ label: actions[index] }))}
				/>
			{/snippet}
		</OverflowList>
	</Card>
</Center>
