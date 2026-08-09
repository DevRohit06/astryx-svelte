<!--
	Ported from upstream's `templates/blocks/components/SegmentedControl/SegmentedControlFillLayout.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { SegmentedControl, SegmentedControlItem } from '@astryx-svelte/core';

	let value = $state('weekly');
</script>

<div style="width: 400px">
	<SegmentedControl {value} onChange={(next) => (value = next)} label="Time range" layout="fill">
		<SegmentedControlItem value="daily" label="Daily" />
		<SegmentedControlItem value="weekly" label="Weekly" />
		<SegmentedControlItem value="monthly" label="Monthly" />
	</SegmentedControl>
</div>
