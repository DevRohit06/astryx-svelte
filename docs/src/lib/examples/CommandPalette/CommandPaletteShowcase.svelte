<!--
	Ported from upstream's `templates/blocks/components/CommandPalette/CommandPaletteShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CommandPalette, createStaticSource } from '@astryx-svelte/core';

	// Remove isInline for production — command palettes should be modal.
	const source = createStaticSource([
		{ id: 'home', label: 'Home' },
		{ id: 'settings', label: 'Settings' },
		{ id: 'profile', label: 'Profile' },
		{ id: 'dashboard', label: 'Dashboard' },
		{ id: 'help', label: 'Help' }
	]);
</script>

<CommandPalette isOpen isInline onOpenChange={() => {}} searchSource={source} />
