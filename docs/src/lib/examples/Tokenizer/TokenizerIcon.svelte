<!--
	Ported from upstream's `templates/blocks/components/Tokenizer/TokenizerIcon.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, Text, Tokenizer } from '@astryx-svelte/core';
	import type { SearchableItem, SearchSource } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `MagnifyingGlassIcon`; the registry's `search` is
	 * the same glyph, so this is a true match rather than a stand-in and nothing
	 * retires with the icon registry.
	 */

	const users: SearchableItem[] = [
		{ id: '1', label: 'Alice Johnson' },
		{ id: '2', label: 'Bob Smith' },
		{ id: '3', label: 'Charlie Brown' },
		{ id: '4', label: 'Diana Prince' },
		{ id: '5', label: 'Eve Williams' }
	];

	const userSource: SearchSource = {
		search: (query: string) =>
			users.filter((u) => u.label.toLowerCase().includes(query.toLowerCase())),
		bootstrap: () => users
	};

	let value = $state<SearchableItem[]>([users[0], users[2]]);
</script>

<Stack direction="vertical" gap={2}>
	<Text type="supporting" color="secondary">Leading icon reinforces the search affordance</Text>
	<Tokenizer
		label="Team Members"
		placeholder="Search people..."
		searchSource={userSource}
		{value}
		onChange={(items) => (value = items)}
		startIcon="search"
		style="width: 400px"
	/>
</Stack>
