<!--
	Ported from upstream's `templates/blocks/components/SegmentedControl/SegmentedControlDisabledItem.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { SegmentedControl, SegmentedControlItem } from '@astryx-svelte/core';

	let value = $state('hourly');
</script>

<SegmentedControl {value} onChange={(next) => (value = next)} label="Data granularity">
	<SegmentedControlItem value="hourly" label="Hourly" />
	<SegmentedControlItem value="daily" label="Daily" />
	<SegmentedControlItem value="weekly" label="Weekly" isDisabled />
</SegmentedControl>
