<!--
	Ported from upstream's `templates/blocks/components/Tokenizer/TokenizerOverflow.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, Text, Tokenizer } from '@astryx-svelte/core';
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

	let inlineValue = $state<SearchableItem[]>(users);
	let layerValue = $state<SearchableItem[]>(users);
</script>

<Stack direction="vertical" gap={4}>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Inline overflow — content shifts down on expand</Text>
		<Tokenizer
			label="Inline Overflow"
			placeholder="Add more..."
			searchSource={userSource}
			value={inlineValue}
			onChange={(items) => (inlineValue = items)}
			tokenOverflowBehavior="unfocusedInline"
			style="width: 400px; max-width: 400px"
		/>
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">
			Layer overflow — expands as overlay, no layout shift
		</Text>
		<Tokenizer
			label="Layer Overflow"
			placeholder="Add more..."
			searchSource={userSource}
			value={layerValue}
			onChange={(items) => (layerValue = items)}
			tokenOverflowBehavior="unfocusedLayer"
			style="width: 400px; max-width: 400px"
		/>
	</Stack>
</Stack>
