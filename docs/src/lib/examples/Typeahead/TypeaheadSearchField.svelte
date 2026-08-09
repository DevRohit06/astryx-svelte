<!--
	Ported from upstream's `templates/blocks/components/Typeahead/TypeaheadSearchField.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Center, Typeahead } from '@astryx-svelte/core';
	import type { SearchableItem, SearchSource } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `MagnifyingGlassIcon`; the registry's `search` is
	 * the same glyph, so this is a true match rather than a stand-in and nothing
	 * retires with the icon registry.
	 */

	const items: SearchableItem[] = [
		{ id: '1', label: 'Olivia Martin' },
		{ id: '2', label: 'Jackson Lee' },
		{ id: '3', label: 'Isabella Nguyen' },
		{ id: '4', label: 'William Kim' },
		{ id: '5', label: 'Sofia Davis' },
		{ id: '6', label: 'Lucas Brown' },
		{ id: '7', label: 'Mia Wilson' },
		{ id: '8', label: 'Ethan Jones' }
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
		label="Team member"
		placeholder="Search people..."
		{searchSource}
		{value}
		onChange={(item) => (value = item)}
		startIcon="search"
		hasEntriesOnFocus
	/>
</Center>
