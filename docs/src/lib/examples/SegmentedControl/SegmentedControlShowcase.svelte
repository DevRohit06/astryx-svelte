<!--
	Ported from upstream's `templates/blocks/components/SegmentedControl/SegmentedControlShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { SegmentedControl, SegmentedControlItem } from '@astryx-svelte/core';

	let value = $state('grid');
</script>

<SegmentedControl {value} onChange={(next) => (value = next)} label="View mode">
	<SegmentedControlItem value="grid" label="Grid" />
	<SegmentedControlItem value="list" label="List" />
	<SegmentedControlItem value="table" label="Table" />
</SegmentedControl>
