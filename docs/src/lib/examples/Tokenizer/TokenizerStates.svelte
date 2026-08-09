<!--
	Ported from upstream's `templates/blocks/components/Tokenizer/TokenizerStates.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, Tokenizer } from '@astryx-svelte/core';
	import type { SearchableItem, SearchSource } from '@astryx-svelte/core';

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

	let errorValue = $state<SearchableItem[]>([]);
	let warningValue = $state<SearchableItem[]>([users[0]]);
	let successValue = $state<SearchableItem[]>([users[1], users[3]]);
</script>

<Stack direction="vertical" gap={4}>
	<Tokenizer
		label="Disabled field"
		searchSource={userSource}
		value={[users[0], users[2]]}
		onChange={() => {}}
		isDisabled
		style="width: 400px"
	/>
	<Tokenizer
		label="Error message"
		placeholder="Search people..."
		searchSource={userSource}
		value={errorValue}
		onChange={(items) => (errorValue = items)}
		isRequired
		status={{ type: 'error', message: 'At least one reviewer is required' }}
		style="width: 400px"
	/>
	<Tokenizer
		label="Warning message"
		placeholder="Search people..."
		searchSource={userSource}
		value={warningValue}
		onChange={(items) => (warningValue = items)}
		status={{ type: 'warning', message: 'Consider adding at least 2 approvers' }}
		style="width: 400px"
	/>
	<Tokenizer
		label="Success message"
		placeholder="Search people..."
		searchSource={userSource}
		value={successValue}
		onChange={(items) => (successValue = items)}
		status={{ type: 'success', message: 'All required reviewers added' }}
		style="width: 400px"
	/>
</Stack>
