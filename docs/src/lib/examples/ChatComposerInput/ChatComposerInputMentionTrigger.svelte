<!--
	Ported from upstream's `templates/blocks/components/ChatComposerInput/ChatComposerInputMentionTrigger.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`renderItem` is a `Snippet<[SearchableItem]>` where upstream takes a render
	function, so it is declared in the template and referenced from the trigger —
	which is why the trigger object is built there rather than in the script.
-->
<script lang="ts">
	import type { ChatComposerTrigger, SearchableItem } from '@astryx-svelte/core';
	import {
		ChatComposer,
		ChatComposerInput,
		Stack,
		Text,
		TypeaheadItem,
		createStaticSource
	} from '@astryx-svelte/core';

	const USERS: SearchableItem<{ role: string }>[] = [
		{ id: 'cindy', label: 'Cindy Zhang', auxiliaryData: { role: 'Design Systems' } },
		{ id: 'alex', label: 'Alex Johnson', auxiliaryData: { role: 'Frontend' } },
		{ id: 'sam', label: 'Sam Rivera', auxiliaryData: { role: 'Backend' } },
		{ id: 'jordan', label: 'Jordan Lee', auxiliaryData: { role: 'Product' } }
	];

	const userSource = createStaticSource(USERS);

	let value = $state('');

	const baseTrigger = {
		character: '@',
		searchSource: userSource,
		onSelect: (item: SearchableItem) => ({
			value: `@${item.id}`,
			label: item.label,
			variant: 'blue' as const
		})
	};
</script>

{#snippet userItem(item: SearchableItem)}
	<TypeaheadItem {item} description={(item.auxiliaryData as { role: string } | undefined)?.role} />
{/snippet}

{#snippet input()}
	{@const mentionTrigger = { ...baseTrigger, renderItem: userItem } satisfies ChatComposerTrigger}
	<ChatComposerInput
		{value}
		onChange={(next) => (value = next)}
		triggers={[mentionTrigger]}
		placeholder="Type @ to mention someone..."
	/>
{/snippet}

<Stack direction="vertical" gap={3} style="width: 450px; max-width: 100%">
	<ChatComposer onSubmit={() => (value = '')} {input} />
	<Text type="supporting" color="secondary">Value: {JSON.stringify(value)}</Text>
</Stack>
