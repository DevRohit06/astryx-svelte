<!--
	Ported from upstream's `templates/blocks/components/CommandPaletteGroup/CommandPaletteGroupBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CommandPaletteGroup, CommandPaletteItem, CommandPaletteList } from '@astryx-svelte/core';
</script>

<CommandPaletteList>
	<CommandPaletteGroup heading="Navigation">
		<CommandPaletteItem value="home" onSelect={() => {}}>Go to Home</CommandPaletteItem>
		<CommandPaletteItem value="dashboard" onSelect={() => {}}>Go to Dashboard</CommandPaletteItem>
	</CommandPaletteGroup>
	<CommandPaletteGroup heading="Actions">
		<CommandPaletteItem value="new-file" onSelect={() => {}}>New File</CommandPaletteItem>
		<CommandPaletteItem value="save-all" onSelect={() => {}}>Save All</CommandPaletteItem>
	</CommandPaletteGroup>
</CommandPaletteList>
