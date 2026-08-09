<!--
	Ported from upstream's `templates/blocks/components/DateInput/DateInputShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Two type-level adjustments, both mechanical. Upstream re-declares a local
	`DateString` template-literal type in each DateInput block; this port exports
	that exact type as `ISODateString`, so the blocks import it instead of
	restating it. And React's `style={{maxWidth: 400}}` object becomes a CSS
	string, since Svelte's `style` attribute takes one.
-->
<script lang="ts">
	import { DateInput, Stack, type ISODateString } from '@astryx-svelte/core';

	let date = $state<ISODateString | undefined>(undefined);
</script>

<Stack direction="vertical" width="100%" style="max-width: 400px">
	<DateInput
		label="Start date"
		placeholder="Select a date"
		value={date}
		onChange={(next) => (date = next)}
		hasClear
	/>
</Stack>
