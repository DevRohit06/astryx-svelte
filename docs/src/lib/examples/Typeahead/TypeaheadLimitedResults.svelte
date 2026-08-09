<!--
	Ported from upstream's `templates/blocks/components/Typeahead/TypeaheadLimitedResults.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Center, Typeahead } from '@astryx-svelte/core';
	import type { SearchableItem, SearchSource } from '@astryx-svelte/core';

	const items: SearchableItem[] = [
		{ id: '1', label: 'United States' },
		{ id: '2', label: 'United Kingdom' },
		{ id: '3', label: 'Canada' },
		{ id: '4', label: 'Australia' },
		{ id: '5', label: 'Germany' },
		{ id: '6', label: 'France' },
		{ id: '7', label: 'Japan' },
		{ id: '8', label: 'Brazil' }
	];

	const searchSource: SearchSource = {
		search: (query: string) =>
			items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase())),
		bootstrap: () => items.slice(0, 5)
	};

	let value = $state<SearchableItem | null>(null);
</script>

<Center width={320}>
	<Typeahead
		label="Country"
		placeholder="Search countries..."
		{searchSource}
		{value}
		onChange={(item) => (value = item)}
		hasEntriesOnFocus
		maxMenuItems={3}
	/>
</Center>
