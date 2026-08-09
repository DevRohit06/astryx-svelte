<!--
	Ported from upstream's `templates/blocks/components/RadioList/RadioListHorizontalLayout.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { RadioList, RadioListItem } from '@astryx-svelte/core';

	let value = $state('md');
</script>

<RadioList label="Size" orientation="horizontal" {value} onChange={(next) => (value = next)}>
	<RadioListItem label="Small" value="sm" />
	<RadioListItem label="Medium" value="md" />
	<RadioListItem label="Large" value="lg" />
</RadioList>
