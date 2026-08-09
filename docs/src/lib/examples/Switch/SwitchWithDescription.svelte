<!--
	Ported from upstream's `templates/blocks/components/Switch/SwitchWithDescription.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Switch } from '@astryx-svelte/core';

	let value = $state(false);
</script>

<Switch
	label="Dark mode"
	description="Switch to a darker color scheme."
	{value}
	onChange={(next) => (value = next)}
/>
