<!--
	Ported from upstream's `templates/blocks/components/CommandPalette/CommandPaletteAutoGrouped.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CommandPalette, createStaticSource } from '@astryx-svelte/core';

	const source = createStaticSource([
		{ id: 'home', label: 'Home', auxiliaryData: { group: 'Navigation' } },
		{ id: 'settings', label: 'Settings', auxiliaryData: { group: 'Navigation' } },
		{ id: 'new-file', label: 'New File', auxiliaryData: { group: 'Actions' } },
		{ id: 'save', label: 'Save', auxiliaryData: { group: 'Actions' } }
	]);
</script>

<CommandPalette isOpen isInline onOpenChange={() => {}} searchSource={source} />
