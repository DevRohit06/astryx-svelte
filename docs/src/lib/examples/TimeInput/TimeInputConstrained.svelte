<!--
	Ported from upstream's `templates/blocks/components/TimeInput/TimeInputConstrained.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	One type-level adjustment, and it is upstream's own problem named better:
	`ISOTimeString` is a *branded* string on both sides, so a bare `'17:00'` does
	not satisfy it. Upstream reaches for `as never` on every such literal; this
	casts to `ISOTimeString` instead, which is the same assertion under the type's
	real name. The values are unchanged.
-->
<script lang="ts">
	import { Stack, TimeInput, type ISOTimeString } from '@astryx-svelte/core';

	let evening = $state<ISOTimeString | undefined>(undefined);
</script>

<Stack direction="vertical" gap={3}>
	<TimeInput
		label="Dinner reservation"
		min={'17:00' as ISOTimeString}
		max={'22:00' as ISOTimeString}
		description="Evening seating: 5 PM – 10 PM"
		placeholder="Select reservation time"
		value={evening}
		onChange={(next) => (evening = next)}
		hasClear
	/>
</Stack>
