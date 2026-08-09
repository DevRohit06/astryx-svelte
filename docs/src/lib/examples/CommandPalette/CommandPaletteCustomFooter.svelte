<!--
	Ported from upstream's `templates/blocks/components/CommandPalette/CommandPaletteCustomFooter.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
	`input`/`footer`/`emptyBootstrapText` are ReactNode slots upstream and snippets
	here, so each is declared above the component rather than inline.
-->
<script lang="ts">
	import {
		CommandPalette,
		CommandPaletteFooter,
		Text,
		createStaticSource
	} from '@astryx-svelte/core';

	const source = createStaticSource([
		{ id: 'home', label: 'Home' },
		{ id: 'settings', label: 'Settings' }
	]);
</script>

{#snippet tip()}
	<Text type="supporting">Pro tip: use ⌘K to open anywhere</Text>
{/snippet}

{#snippet footer()}
	<CommandPaletteFooter children={tip} />
{/snippet}

<CommandPalette isOpen isInline onOpenChange={() => {}} searchSource={source} {footer} />
