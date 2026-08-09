<!--
	Ported from upstream's `templates/blocks/components/CommandPaletteList/CommandPaletteListShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CommandPaletteGroup, CommandPaletteItem, CommandPaletteList } from '@astryx-svelte/core';
</script>

<CommandPaletteList>
	<CommandPaletteGroup heading="Navigation">
		<CommandPaletteItem value="home" onSelect={() => {}}>Go Home</CommandPaletteItem>
		<CommandPaletteItem value="settings" onSelect={() => {}}>Open Settings</CommandPaletteItem>
		<CommandPaletteItem value="profile" onSelect={() => {}}>View Profile</CommandPaletteItem>
	</CommandPaletteGroup>
	<CommandPaletteGroup heading="Actions">
		<CommandPaletteItem value="new-file" onSelect={() => {}}>New File</CommandPaletteItem>
		<CommandPaletteItem value="search" isHighlighted onSelect={() => {}}>
			Search Files
		</CommandPaletteItem>
		<CommandPaletteItem value="save" onSelect={() => {}}>Save All</CommandPaletteItem>
	</CommandPaletteGroup>
</CommandPaletteList>
