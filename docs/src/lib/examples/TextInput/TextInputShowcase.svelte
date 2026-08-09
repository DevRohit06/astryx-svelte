<!--
	Ported from upstream's `templates/blocks/components/TextInput/TextInputShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { TextInput } from '@astryx-svelte/core';

	let value = $state('');
</script>

<div style="width: 300px">
	<TextInput
		label="Name"
		{value}
		onChange={(next) => (value = next)}
		placeholder="Enter your name"
	/>
</div>
