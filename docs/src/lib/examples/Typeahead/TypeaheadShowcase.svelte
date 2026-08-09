<!--
	Ported from upstream's `templates/blocks/components/Typeahead/TypeaheadShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Typeahead } from '@astryx-svelte/core';
	import type { SearchableItem, SearchSource } from '@astryx-svelte/core';

	const fruits: SearchableItem[] = [
		{ id: '1', label: 'Apple' },
		{ id: '2', label: 'Banana' },
		{ id: '3', label: 'Cherry' },
		{ id: '4', label: 'Date' },
		{ id: '5', label: 'Elderberry' },
		{ id: '6', label: 'Fig' },
		{ id: '7', label: 'Grape' },
		{ id: '8', label: 'Honeydew' }
	];

	const fruitSource: SearchSource = {
		search: (query: string) =>
			fruits.filter((f) => f.label.toLowerCase().includes(query.toLowerCase())),
		bootstrap: () => fruits.slice(0, 5)
	};

	let value = $state<SearchableItem | null>(null);
</script>

<div style="width: 320px">
	<Typeahead
		label="Fruit"
		placeholder="Search fruits..."
		searchSource={fruitSource}
		{value}
		onChange={(item) => (value = item)}
	/>
</div>
