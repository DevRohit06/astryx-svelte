<!--
	Ported from upstream's `templates/blocks/components/ChatComposerInput/ChatComposerInputSlashCommands.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`renderItem` is a `Snippet<[SearchableItem]>` where upstream takes a render
	function, so it is declared in the template and the trigger is assembled
	there.
-->
<script lang="ts">
	import type { ChatComposerTrigger, SearchableItem } from '@astryx-svelte/core';
	import {
		ChatComposer,
		ChatComposerInput,
		Stack,
		TypeaheadItem,
		createStaticSource
	} from '@astryx-svelte/core';

	const COMMANDS: SearchableItem<{ description: string }>[] = [
		{
			id: 'summarize',
			label: 'summarize',
			auxiliaryData: { description: 'Summarize the conversation' }
		},
		{
			id: 'translate',
			label: 'translate',
			auxiliaryData: { description: 'Translate text to another language' }
		},
		{
			id: 'search',
			label: 'search',
			auxiliaryData: { description: 'Search the web or documents' }
		},
		{ id: 'code', label: 'code', auxiliaryData: { description: 'Generate or explain code' } },
		{ id: 'help', label: 'help', auxiliaryData: { description: 'Show available commands' } }
	];

	const commandSource = createStaticSource(COMMANDS);

	const baseTrigger = {
		character: '/',
		searchSource: commandSource,
		onSelect: (item: SearchableItem) => ({
			value: `/${item.label}`,
			label: `/${item.label}`,
			variant: 'yellow' as const
		})
	};
</script>

{#snippet commandItem(item: SearchableItem)}
	<TypeaheadItem
		{item}
		description={(item.auxiliaryData as { description: string } | undefined)?.description}
	/>
{/snippet}

{#snippet input()}
	{@const commandTrigger = {
		...baseTrigger,
		renderItem: commandItem
	} satisfies ChatComposerTrigger}
	<ChatComposerInput triggers={[commandTrigger]} placeholder="Type / for commands..." />
{/snippet}

<Stack direction="vertical" style="width: 450px; max-width: 100%">
	<ChatComposer onSubmit={() => {}} {input} />
</Stack>
