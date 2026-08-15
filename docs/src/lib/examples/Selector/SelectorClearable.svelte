<!--
	Ported from upstream's `templates/blocks/components/Selector/SelectorClearable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Selector } from '@astryx-svelte/core';

	/**
	 * `hasClear` is the arm of `SelectorProps` where `value` and `onChange` widen
	 * to include `null`, so the parameter is annotated — TS will not contextually
	 * type an inline arrow against a discriminated union in a Svelte props object
	 * (the limitation recorded in port/todo.md).
	 */

	let value = $state<string | null>('engineering');
</script>

<Selector
	style="width: 300px"
	label="Department"
	options={[
		{ value: 'engineering', label: 'Engineering' },
		{ value: 'design', label: 'Design' },
		{ value: 'marketing', label: 'Marketing' },
		{ value: 'sales', label: 'Sales' }
	]}
	{value}
	onChange={(next: string | null) => (value = next)}
	placeholder="Choose a department..."
	hasClear
/>
