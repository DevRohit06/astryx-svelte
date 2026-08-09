<!--
	Ported from upstream's `templates/blocks/components/CheckboxInput/CheckboxInputShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CheckboxInput, Stack } from '@astryx-svelte/core';

	let notifications = $state(true);
	let marketing = $state(false);
</script>

<Stack direction="vertical" gap={2}>
	<CheckboxInput
		label="Checked"
		value={notifications}
		onChange={(checked) => (notifications = checked)}
	/>
	<CheckboxInput
		label="Unchecked"
		value={marketing}
		onChange={(checked) => (marketing = checked)}
	/>
</Stack>
