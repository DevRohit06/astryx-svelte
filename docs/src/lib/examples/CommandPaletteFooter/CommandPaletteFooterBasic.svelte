<!--
	Ported from upstream's `templates/blocks/components/CommandPaletteFooter/CommandPaletteFooterBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CommandPalette, CommandPaletteFooter, createStaticSource } from '@astryx-svelte/core';

	const source = createStaticSource([
		{ id: 'new-file', label: 'New File' },
		{ id: 'open-recent', label: 'Open Recent' },
		{ id: 'save-all', label: 'Save All' }
	]);
</script>

{#snippet footer()}
	<CommandPaletteFooter />
{/snippet}

<CommandPalette isOpen isInline onOpenChange={() => {}} searchSource={source} {footer} />
