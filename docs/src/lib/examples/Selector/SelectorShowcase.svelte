<!--
	Ported from upstream's `templates/blocks/components/Selector/SelectorShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Selector } from '@astryx-svelte/core';

	let value = $state<string | undefined>(undefined);
</script>

<Selector
	style="width: 300px"
	label="Fruit"
	options={['Apple', 'Banana', 'Orange', 'Mango', 'Pineapple']}
	placeholder="Select a fruit..."
	{value}
	onChange={(next: string) => (value = next)}
/>
