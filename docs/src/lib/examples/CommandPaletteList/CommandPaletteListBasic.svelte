<!--
	Ported from upstream's `templates/blocks/components/CommandPaletteList/CommandPaletteListBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { CommandPaletteItem, CommandPaletteList } from '@astryx-svelte/core';
</script>

<CommandPaletteList>
	<CommandPaletteItem value="home" onSelect={() => {}}>Go Home</CommandPaletteItem>
	<CommandPaletteItem value="settings" isHighlighted onSelect={() => {}}>
		Open Settings
	</CommandPaletteItem>
	<CommandPaletteItem value="profile" isSelected onSelect={() => {}}>
		View Profile
	</CommandPaletteItem>
	<CommandPaletteItem value="help" isDisabled onSelect={() => {}}>
		Help (unavailable)
	</CommandPaletteItem>
</CommandPaletteList>
