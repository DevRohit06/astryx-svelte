<!--
	Ported from upstream's `templates/blocks/components/CommandPaletteItem/CommandPaletteItemShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CommandPalette, Kbd, Text, createStaticSource } from '@astryx-svelte/core';
	import type { SearchableItem } from '@astryx-svelte/core';

	type CommandItem = SearchableItem<{ shortcut?: string }>;

	const commands: CommandItem[] = [
		{ id: 'save', label: 'Save File', auxiliaryData: { shortcut: 'mod+s' } },
		{ id: 'find', label: 'Find in Files', auxiliaryData: { shortcut: 'mod+shift+f' } },
		{ id: 'palette', label: 'Command Palette', auxiliaryData: { shortcut: 'mod+shift+p' } },
		{ id: 'terminal', label: 'Toggle Terminal', auxiliaryData: { shortcut: 'ctrl+`' } },
		{ id: 'sidebar', label: 'Toggle Sidebar', auxiliaryData: { shortcut: 'mod+b' } }
	];

	const source = createStaticSource(commands);
</script>

{#snippet renderItem(item: CommandItem)}
	<Text type="body" style="flex-grow: 1;">{item.label}</Text>
	{#if item.auxiliaryData?.shortcut}
		<Kbd keys={item.auxiliaryData.shortcut} />
	{/if}
{/snippet}

<CommandPalette isOpen isInline onOpenChange={() => {}} searchSource={source} {renderItem} />
