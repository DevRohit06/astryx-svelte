<!--
	Ported from upstream's `templates/blocks/components/TreeList/TreeListFileTreeWithIcons.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Icon, TreeList } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `FolderIcon`/`DocumentIcon`; the registry ships
	 * neither glyph, so both substitute a built-in — the same gap the `TreeList`
	 * demo's `WithIcons` story records. Retires with the icon registry (TODO.md).
	 */
</script>

{#snippet folderIcon()}<Icon icon="menu" size="sm" />{/snippet}
{#snippet documentIcon()}<Icon icon="copy" size="sm" />{/snippet}

<TreeList
	items={[
		{
			id: 'src',
			label: 'src',
			isExpanded: true,
			startContent: folderIcon,
			children: [
				{ id: 'app', label: 'App.tsx', onClick: () => {}, startContent: documentIcon },
				{ id: 'index', label: 'index.tsx', onClick: () => {}, startContent: documentIcon }
			]
		},
		{ id: 'pkg', label: 'package.json', onClick: () => {}, startContent: documentIcon }
	]}
/>
