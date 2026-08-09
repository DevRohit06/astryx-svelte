<!--
	Ported from upstream's `templates/blocks/components/Switch/SwitchDisabled.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Switch } from '@astryx-svelte/core';

	let value = $state(false);
</script>

<Switch
	label="Premium feature"
	description="Upgrade to enable this option"
	{value}
	onChange={(next) => (value = next)}
	isDisabled
/>
