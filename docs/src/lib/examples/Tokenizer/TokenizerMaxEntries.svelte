<!--
	Ported from upstream's `templates/blocks/components/Tokenizer/TokenizerMaxEntries.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, Text, Tokenizer } from '@astryx-svelte/core';
	import type { SearchableItem, SearchSource } from '@astryx-svelte/core';

	const skills: SearchableItem[] = [
		{ id: '1', label: 'React' },
		{ id: '2', label: 'TypeScript' },
		{ id: '3', label: 'GraphQL' },
		{ id: '4', label: 'Node.js' },
		{ id: '5', label: 'Python' },
		{ id: '6', label: 'Rust' },
		{ id: '7', label: 'Go' },
		{ id: '8', label: 'Swift' }
	];

	const skillSource: SearchSource = {
		search: (query: string) =>
			skills.filter((s) => s.label.toLowerCase().includes(query.toLowerCase())),
		bootstrap: () => skills
	};

	const MAX_SKILLS = 3;

	let value = $state<SearchableItem[]>([skills[0], skills[1]]);
</script>

<Stack direction="vertical" gap={2}>
	<Text type="supporting" color="secondary">
		Limited to {MAX_SKILLS} selections — {MAX_SKILLS - value.length} remaining
	</Text>
	<Tokenizer
		label="Top Skills"
		placeholder="Search skills..."
		description={`Choose up to ${MAX_SKILLS} skills`}
		searchSource={skillSource}
		{value}
		onChange={(items) => (value = items)}
		maxEntries={MAX_SKILLS}
		style="width: 400px"
	/>
</Stack>
