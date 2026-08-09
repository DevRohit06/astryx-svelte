<!--
	Ported from upstream's `templates/blocks/components/Tokenizer/TokenizerCreatable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, Text, Tokenizer } from '@astryx-svelte/core';
	import type { SearchableItem, SearchSource } from '@astryx-svelte/core';

	const emptySource: SearchSource = {
		search: () => [],
		bootstrap: () => []
	};

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

	let tags = $state<SearchableItem[]>([]);
	let members = $state<SearchableItem[]>([]);
</script>

<Stack direction="vertical" gap={4}>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Free-text only</Text>
		<Tokenizer
			label="Tags"
			searchSource={emptySource}
			value={tags}
			onChange={(items) => (tags = items)}
			hasCreate
			placeholder="Type a tag and press Enter..."
			style="width: 400px"
		/>
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Create or search</Text>
		<Tokenizer
			label="Team Members"
			searchSource={userSource}
			value={members}
			onChange={(items) => (members = items)}
			hasCreate
			hasEntriesOnFocus
			placeholder="Search or type a new name..."
			style="width: 400px"
		/>
	</Stack>
</Stack>
