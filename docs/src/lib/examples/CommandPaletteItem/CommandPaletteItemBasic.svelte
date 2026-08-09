<!--
	Ported from upstream's `templates/blocks/components/CommandPaletteItem/CommandPaletteItemBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CommandPaletteItem, CommandPaletteList } from '@astryx-svelte/core';
</script>

<CommandPaletteList>
	<CommandPaletteItem value="new-file" onSelect={() => {}}>New File</CommandPaletteItem>
	<CommandPaletteItem value="open-recent" isHighlighted onSelect={() => {}}>
		Open Recent
	</CommandPaletteItem>
	<CommandPaletteItem value="save-all" onSelect={() => {}}>Save All</CommandPaletteItem>
	<CommandPaletteItem value="publish" isDisabled>Publish (disabled)</CommandPaletteItem>
</CommandPaletteList>
