<!--
	Ported from upstream's `templates/blocks/components/Typeahead/TypeaheadWithHelperText.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Center, Typeahead } from '@astryx-svelte/core';
	import type { SearchableItem, SearchSource } from '@astryx-svelte/core';

	const items: SearchableItem[] = [
		{ id: '1', label: 'Engineering' },
		{ id: '2', label: 'Design' },
		{ id: '3', label: 'Marketing' },
		{ id: '4', label: 'Sales' },
		{ id: '5', label: 'Product' },
		{ id: '6', label: 'Finance' },
		{ id: '7', label: 'Legal' },
		{ id: '8', label: 'Operations' }
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
		label="Department"
		placeholder="Search departments..."
		{searchSource}
		{value}
		onChange={(item) => (value = item)}
		description="Select the department this request should be routed to"
	/>
</Center>
