<!--
	Ported from upstream's `templates/blocks/components/TypeaheadItem/TypeaheadItemShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Avatar, Center, Typeahead, TypeaheadItem } from '@astryx-svelte/core';
	import type { SearchableItem, SearchSource } from '@astryx-svelte/core';

	interface PersonItem extends SearchableItem {
		auxiliaryData: { role: string };
	}

	const people: PersonItem[] = [
		{ id: '1', label: 'Alice Johnson', auxiliaryData: { role: 'Engineer' } },
		{ id: '2', label: 'Bob Smith', auxiliaryData: { role: 'Designer' } },
		{ id: '3', label: 'Charlie Brown', auxiliaryData: { role: 'Product Manager' } },
		{ id: '4', label: 'Diana Prince', auxiliaryData: { role: 'Data Scientist' } },
		{ id: '5', label: 'Eve Davis', auxiliaryData: { role: 'QA Engineer' } }
	];

	const peopleSource: SearchSource<PersonItem> = {
		search: (query: string) =>
			people.filter((p) => p.label.toLowerCase().includes(query.toLowerCase())),
		bootstrap: () => people.slice(0, 4)
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
			<TypeaheadItem {item} description={item.auxiliaryData.role}>
				{#snippet icon()}<Avatar name={item.label} size="md" />{/snippet}
			</TypeaheadItem>
		{/snippet}
	</Typeahead>
</Center>
