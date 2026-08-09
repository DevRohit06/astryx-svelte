<!--
	Ported from upstream's `templates/blocks/components/ChatComposerInput/ChatComposerInputMultipleTriggers.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Neither trigger uses `renderItem`, so both are plain objects in the script —
	unlike the mention and slash-command blocks, which have to assemble theirs in
	the template.
-->
<script lang="ts">
	import type { ChatComposerTrigger, SearchableItem } from '@astryx-svelte/core';
	import {
		ChatComposer,
		ChatComposerInput,
		Stack,
		Text,
		createStaticSource
	} from '@astryx-svelte/core';

	const USERS: SearchableItem[] = [
		{ id: 'cindy', label: 'Cindy Zhang' },
		{ id: 'alex', label: 'Alex Johnson' },
		{ id: 'sam', label: 'Sam Rivera' },
		{ id: 'jordan', label: 'Jordan Lee' }
	];

	const COMMANDS: SearchableItem[] = [
		{ id: 'summarize', label: 'summarize' },
		{ id: 'translate', label: 'translate' },
		{ id: 'search', label: 'search' },
		{ id: 'code', label: 'code' }
	];

	const userSource = createStaticSource(USERS);
	const commandSource = createStaticSource(COMMANDS);

	let value = $state('');

	const mentionTrigger: ChatComposerTrigger = {
		character: '@',
		searchSource: userSource,
		onSelect: (item) => ({
			value: `@${item.id}`,
			label: item.label,
			variant: 'blue' as const
		})
	};

	const commandTrigger: ChatComposerTrigger = {
		character: '/',
		searchSource: commandSource,
		onSelect: (item) => ({
			value: `/${item.label}`,
			label: `/${item.label}`,
			variant: 'yellow' as const
		})
	};
</script>

{#snippet input()}
	<ChatComposerInput
		{value}
		onChange={(next) => (value = next)}
		triggers={[mentionTrigger, commandTrigger]}
		placeholder="Type @ or / ..."
	/>
{/snippet}

<Stack direction="vertical" gap={3} style="width: 450px; max-width: 100%">
	<Text type="supporting" color="secondary">
		Type @ for mentions (blue) or / for commands (yellow)
	</Text>
	<ChatComposer onSubmit={() => (value = '')} {input} />
	<Text type="supporting" color="secondary">Value: {JSON.stringify(value)}</Text>
</Stack>
