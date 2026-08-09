<!--
	Ported from upstream's `templates/blocks/components/SegmentedControlItem/SegmentedControlItemShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Center, Icon, SegmentedControl, SegmentedControlItem } from '@astryx-svelte/core';

	let view = $state('board');
</script>

<Center>
	<SegmentedControl value={view} onChange={(next) => (view = next)} label="View mode">
		<SegmentedControlItem value="board" label="Board">
			{#snippet icon()}<Icon icon="viewColumns" />{/snippet}
		</SegmentedControlItem>
		<SegmentedControlItem value="list" label="List">
			{#snippet icon()}<Icon icon="menu" />{/snippet}
		</SegmentedControlItem>
		<SegmentedControlItem value="timeline" label="Timeline">
			{#snippet icon()}<Icon icon="calendar" />{/snippet}
		</SegmentedControlItem>
		<SegmentedControlItem value="chart" label="Chart" isDisabled>
			{#snippet icon()}<Icon icon="arrowsUpDown" />{/snippet}
		</SegmentedControlItem>
	</SegmentedControl>
</Center>
