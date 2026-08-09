<!--
	Ported from upstream's `templates/blocks/components/SegmentedControlItem/SegmentedControlItemBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { SegmentedControl, SegmentedControlItem } from '@astryx-svelte/core';

	let view = $state('board');
</script>

<SegmentedControl value={view} onChange={(next) => (view = next)} label="View mode">
	<SegmentedControlItem value="board" label="Board" />
	<SegmentedControlItem value="list" label="List" />
	<SegmentedControlItem value="timeline" label="Timeline" />
</SegmentedControl>
