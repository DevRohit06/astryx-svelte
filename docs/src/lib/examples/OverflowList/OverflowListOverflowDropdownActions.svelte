<!--
	Ported from upstream's `templates/blocks/components/OverflowList/OverflowListOverflowDropdownActions.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Card, DropdownMenu, OverflowList } from '@astryx-svelte/core';
	import type { ButtonProps } from '@astryx-svelte/core';

	/**
	 * Upstream passes the buttons as `children`; this port takes `items` plus an
	 * `item` snippet, so each button's variant travels in the data. `actions` stays
	 * a separate array because the overflow renderer indexes it by
	 * `OverflowItem.index`, exactly as upstream's does.
	 */
	const actions = ['Save', 'Edit', 'Duplicate', 'Share', 'Archive', 'Delete'];

	const buttons: Array<{ label: string; variant?: ButtonProps['variant'] }> = [
		{ label: 'Save', variant: 'primary' },
		{ label: 'Edit' },
		{ label: 'Duplicate' },
		{ label: 'Share' },
		{ label: 'Archive' },
		{ label: 'Delete', variant: 'destructive' }
	];
</script>

<Card
	padding={2}
	style="resize: horizontal; overflow: hidden; min-width: 100px; width: 350px; max-width: 100%"
>
	<OverflowList items={buttons} gap={2}>
		{#snippet item(action)}
			<Button label={action.label} size="sm" variant={action.variant} />
		{/snippet}
		{#snippet overflowRenderer(overflowItems)}
			<DropdownMenu
				button={{ label: `+${overflowItems.length}`, variant: 'ghost', size: 'sm' }}
				items={overflowItems.map(({ index }) => ({
					label: actions[index],
					onClick: () => {}
				}))}
			/>
		{/snippet}
	</OverflowList>
</Card>
