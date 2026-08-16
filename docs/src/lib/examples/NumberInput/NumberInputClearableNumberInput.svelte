<!--
	Ported from upstream's `templates/blocks/components/NumberInput/NumberInputClearableNumberInput.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { NumberInput } from '@astryx-svelte/core';

	/**
	 * `hasClear` widens `onChange` to accept `null`, so the parameter is annotated
	 * on that arm. `NumberInputProps` is a discriminated union and TS will not
	 * contextually type an inline arrow against a Svelte props object — the
	 * limitation recorded in port/todo.md.
	 */

	let value = $state<number | null>(75);
</script>

<div style="width: 300px">
	<NumberInput
		label="Progress"
		units="%"
		min={0}
		max={100}
		{value}
		onChange={(next: number | null) => (value = next)}
		hasClear
	/>
</div>
