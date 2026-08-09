<!--
	Ported from upstream's `templates/blocks/components/CommandPalette/CommandPaletteRichItems.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
	`input`/`footer`/`emptyBootstrapText` are ReactNode slots upstream and snippets
	here, so each is declared above the component rather than inline.
-->
<script lang="ts">
	import { CommandPalette, Kbd, Text, createStaticSource } from '@astryx-svelte/core';
	import type { SearchableItem } from '@astryx-svelte/core';

	type RichCommand = SearchableItem<{
		group?: string;
		shortcut?: string;
	}>;

	const commands: RichCommand[] = [
		{
			id: 'settings',
			label: 'Open Settings',
			auxiliaryData: { group: 'Navigation', shortcut: 'mod+,' }
		},
		{ id: 'profile', label: 'View Profile', auxiliaryData: { group: 'Navigation' } },
		{
			id: 'new-file',
			label: 'Create New File',
			auxiliaryData: { group: 'Actions', shortcut: 'mod+n' }
		},
		{ id: 'search', label: 'Search Files', auxiliaryData: { group: 'Actions', shortcut: 'mod+p' } }
	];

	const source = createStaticSource(commands);
</script>

{#snippet renderItem(item: RichCommand)}
	<Text type="body" style="flex: 1;">{item.label}</Text>
	{#if item.auxiliaryData?.shortcut}
		<Kbd keys={item.auxiliaryData.shortcut} />
	{/if}
{/snippet}

<CommandPalette isOpen isInline onOpenChange={() => {}} searchSource={source} {renderItem} />
