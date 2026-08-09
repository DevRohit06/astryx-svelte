<!--
	Ported from upstream's `templates/blocks/components/Tokenizer/TokenizerShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Tokenizer } from '@astryx-svelte/core';
	import type { SearchableItem, SearchSource } from '@astryx-svelte/core';

	const source: SearchSource = {
		search: () => [],
		bootstrap: () => []
	};

	let value = $state<SearchableItem[]>([
		{ id: '1', label: 'Design' },
		{ id: '2', label: 'Engineering' }
	]);
</script>

<Tokenizer
	label="Tags"
	placeholder="Search..."
	searchSource={source}
	{value}
	onChange={(items) => (value = items)}
	style="width: 400px"
/>
