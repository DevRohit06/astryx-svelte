<!--
	Ported from upstream's `templates/blocks/components/CommandPalette/CommandPalettePickerMode.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
	`input`/`footer`/`emptyBootstrapText` are ReactNode slots upstream and snippets
	here, so each is declared above the component rather than inline.
-->
<script lang="ts">
	import { CommandPalette, Icon, Text, createStaticSource } from '@astryx-svelte/core';
	import type { SearchableItem } from '@astryx-svelte/core';

	let theme = $state('light');

	const source = createStaticSource([
		{ id: 'light', label: 'Light' },
		{ id: 'dark', label: 'Dark' },
		{ id: 'system', label: 'System' }
	]);
</script>

{#snippet renderItem(item: SearchableItem, isSelected: boolean)}
	<Text type="body" style="flex: 1;">{item.label}</Text>
	{#if isSelected}<Icon icon="check" size="sm" />{/if}
{/snippet}

<CommandPalette
	isOpen
	isInline
	onOpenChange={() => {}}
	searchSource={source}
	value={theme}
	onValueChange={(v) => (theme = v)}
	{renderItem}
/>
