<!--
	Ported from upstream's `templates/blocks/components/CommandPaletteFooter/CommandPaletteFooterShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		CommandPalette,
		CommandPaletteFooter,
		Text,
		createStaticSource
	} from '@astryx-svelte/core';

	const source = createStaticSource([
		{ id: 'new-file', label: 'New File' },
		{ id: 'open-recent', label: 'Open Recent' },
		{ id: 'save-all', label: 'Save All' }
	]);
</script>

{#snippet tip()}
	<Text type="supporting" color="secondary">
		Tip: Press ⌘K anywhere to open the command palette
	</Text>
{/snippet}

{#snippet footer()}
	<CommandPaletteFooter children={tip} />
{/snippet}

<CommandPalette isOpen isInline onOpenChange={() => {}} searchSource={source} {footer} />
