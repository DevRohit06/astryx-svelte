<!--
	Ported from upstream's `templates/blocks/components/TypeaheadItem/TypeaheadItemBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Center, Typeahead, TypeaheadItem } from '@astryx-svelte/core';
	import type { SearchableItem, SearchSource } from '@astryx-svelte/core';

	interface PersonItem extends SearchableItem {
		auxiliaryData: { role: string };
	}

	const people: PersonItem[] = [
		{ id: '1', label: 'Alice Johnson', auxiliaryData: { role: 'Engineer' } },
		{ id: '2', label: 'Bob Smith', auxiliaryData: { role: 'Designer' } },
		{ id: '3', label: 'Charlie Brown', auxiliaryData: { role: 'Product Manager' } }
	];

	const peopleSource: SearchSource<PersonItem> = {
		search: (query: string) =>
			people.filter((p) => p.label.toLowerCase().includes(query.toLowerCase())),
		bootstrap: () => people
	};

	let value = $state<PersonItem | null>(null);
</script>

<Center width={320}>
	<Typeahead
		label="Assignee"
		placeholder="Search people..."
		searchSource={peopleSource}
		{value}
		onChange={(item) => (value = item)}
	>
		{#snippet renderItem(item)}
			<TypeaheadItem {item} description={item.auxiliaryData.role} />
		{/snippet}
	</Typeahead>
</Center>
