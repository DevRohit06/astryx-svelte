<!--
	Ported from upstream's `templates/blocks/components/CommandPaletteGroup/CommandPaletteGroupShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CommandPalette, createStaticSource } from '@astryx-svelte/core';

	const source = createStaticSource([
		{ id: 'index', label: 'index.tsx', auxiliaryData: { group: 'Recent Files' } },
		{ id: 'app', label: 'App.tsx', auxiliaryData: { group: 'Recent Files' } },
		{ id: 'settings', label: 'Open Settings', auxiliaryData: { group: 'Commands' } },
		{ id: 'terminal', label: 'Toggle Terminal', auxiliaryData: { group: 'Commands' } },
		{ id: 'theme', label: 'Color Theme', auxiliaryData: { group: 'Preferences' } },
		{ id: 'font', label: 'Font Size', auxiliaryData: { group: 'Preferences' } }
	]);
</script>

<CommandPalette isOpen isInline onOpenChange={() => {}} searchSource={source} />
