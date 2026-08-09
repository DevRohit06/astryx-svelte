<!--
	Ported from upstream's `templates/blocks/components/Tokenizer/TokenizerEndContent.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Button, Stack, Text, Tokenizer } from '@astryx-svelte/core';
	import type { SearchableItem, SearchSource } from '@astryx-svelte/core';

	const users: SearchableItem[] = [
		{ id: '1', label: 'Alice Johnson' },
		{ id: '2', label: 'Bob Smith' },
		{ id: '3', label: 'Charlie Brown' },
		{ id: '4', label: 'Diana Prince' },
		{ id: '5', label: 'Eve Williams' },
		{ id: '6', label: 'Frank Miller' }
	];

	const userSource: SearchSource = {
		search: (query: string) =>
			users.filter((u) => u.label.toLowerCase().includes(query.toLowerCase())),
		bootstrap: () => users
	};

	let value = $state<SearchableItem[]>([users[0], users[2]]);
</script>

<Stack direction="vertical" gap={2}>
	<Text type="supporting" color="secondary">Action button in the end slot</Text>
	<Tokenizer
		label="Team Members"
		placeholder="Search people..."
		searchSource={userSource}
		{value}
		onChange={(items) => (value = items)}
		style="width: 400px"
	>
		{#snippet endContent()}<Button label="Apply" variant="primary" size="sm" />{/snippet}
	</Tokenizer>
</Stack>
