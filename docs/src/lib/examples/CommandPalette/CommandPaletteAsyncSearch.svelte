<!--
	Ported from upstream's `templates/blocks/components/CommandPalette/CommandPaletteAsyncSearch.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
	`input`/`footer`/`emptyBootstrapText` are ReactNode slots upstream and snippets
	here, so each is declared above the component rather than inline.
-->
<script lang="ts">
	import { CommandPalette, CommandPaletteInput } from '@astryx-svelte/core';
	import type { SearchSource } from '@astryx-svelte/core';

	const allFiles = [
		{ id: 'readme', label: 'README.md' },
		{ id: 'package', label: 'package.json' },
		{ id: 'tsconfig', label: 'tsconfig.json' },
		{ id: 'index', label: 'src/index.ts' },
		{ id: 'app', label: 'src/App.tsx' }
	];

	const source: SearchSource = {
		async search(query: string) {
			await new Promise((r) => setTimeout(r, 400));
			return allFiles.filter((f) => f.label.toLowerCase().includes(query.toLowerCase()));
		},
		bootstrap() {
			return [];
		}
	};
</script>

{#snippet input()}
	<CommandPaletteInput placeholder="Search files..." />
{/snippet}

<CommandPalette
	isOpen
	isInline
	onOpenChange={() => {}}
	searchSource={source}
	{input}
	emptyBootstrapText="Type a filename to search"
	emptySearchText="No files found"
/>
