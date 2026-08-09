<!--
	Ported from upstream's `templates/blocks/components/CheckboxInput/CheckboxInputBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CheckboxInput, Stack } from '@astryx-svelte/core';

	let checked = $state<boolean | 'indeterminate'>(true);
	let unchecked = $state<boolean | 'indeterminate'>(false);
	let disabled = $state<boolean | 'indeterminate'>(false);
	let indeterminate = $state<boolean | 'indeterminate'>('indeterminate');
</script>

<Stack direction="vertical" gap={4}>
	<CheckboxInput
		label="Checked"
		description="This checkbox is currently on."
		value={checked}
		onChange={(next) => (checked = next)}
	/>
	<CheckboxInput
		label="Unchecked"
		description="This checkbox is currently off."
		value={unchecked}
		onChange={(next) => (unchecked = next)}
	/>
	<CheckboxInput
		label="Disabled"
		description="This checkbox cannot be changed."
		value={disabled}
		onChange={(next) => (disabled = next)}
		isDisabled
	/>
	<CheckboxInput
		label="Indeterminate"
		description="This checkbox represents a partial selection."
		value={indeterminate}
		onChange={(next) => (indeterminate = next)}
	/>
</Stack>
