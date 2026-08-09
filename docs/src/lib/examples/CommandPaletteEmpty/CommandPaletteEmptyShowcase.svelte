<!--
	Ported from upstream's `templates/blocks/components/CommandPaletteEmpty/CommandPaletteEmptyShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CommandPalette, Text, createStaticSource } from '@astryx-svelte/core';

	const emptySource = createStaticSource([]);
</script>

{#snippet emptyBootstrapText()}
	<Text type="supporting" color="secondary">No commands available yet</Text>
{/snippet}

<CommandPalette
	isOpen
	isInline
	onOpenChange={() => {}}
	searchSource={emptySource}
	{emptyBootstrapText}
/>
