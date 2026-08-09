<!--
	Ported from upstream's `templates/blocks/components/CommandPaletteInput/CommandPaletteInputShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		CommandPalette,
		CommandPaletteInput,
		Kbd,
		createStaticSource
	} from '@astryx-svelte/core';

	const source = createStaticSource([
		{ id: 'home', label: 'Home' },
		{ id: 'settings', label: 'Settings' },
		{ id: 'profile', label: 'Profile' },
		{ id: 'help', label: 'Help' }
	]);
</script>

{#snippet shortcut()}
	<Kbd keys="mod+k" />
{/snippet}

{#snippet input()}
	<CommandPaletteInput placeholder="Search commands, files, or actions..." endContent={shortcut} />
{/snippet}

<CommandPalette isOpen isInline onOpenChange={() => {}} searchSource={source} {input} />
