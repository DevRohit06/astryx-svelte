<!--
	Ported from upstream's `templates/blocks/components/OverflowList/OverflowListShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, OverflowList } from '@astryx-svelte/core';

	/**
	 * Upstream passes the buttons as `children`; this port takes `items` plus an
	 * `item` snippet, so the same five actions render through the snippet.
	 */
	const actions = ['Edit', 'Duplicate', 'Share', 'Archive', 'Delete'];
</script>

<div style="max-width: 400px; border: 1px dashed #ccc; padding: 8px">
	<OverflowList items={actions} gap={2}>
		{#snippet item(label)}
			<Button {label} size="sm" />
		{/snippet}
		{#snippet overflowRenderer(overflowItems)}
			<Button label={`+${overflowItems.length} more`} variant="ghost" size="sm" />
		{/snippet}
	</OverflowList>
</div>
