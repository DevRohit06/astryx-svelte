<!--
	Ported from upstream's `templates/blocks/components/TextArea/TextAreaShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { TextArea } from '@astryx-svelte/core';

	let value = $state('');
</script>

<div style="width: 400px">
	<TextArea
		label="Description"
		{value}
		onChange={(next) => (value = next)}
		placeholder="Enter a description..."
	/>
</div>
