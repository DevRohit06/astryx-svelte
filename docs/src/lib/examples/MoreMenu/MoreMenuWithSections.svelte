<!--
	Ported from upstream's `templates/blocks/components/MoreMenu/MoreMenuWithSections.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { MoreMenu } from '@astryx-svelte/core';

	/**
	 * Upstream passes Heroicons' `Pencil`/`DocumentDuplicate`/`Trash` components;
	 * item icons are registry names or snippets here, and the registry ships none
	 * of the three, so these are built-in substitutions. Retires with the icon
	 * registry (port/todo.md).
	 */
</script>

<MoreMenu
	variant="secondary"
	label="Document actions"
	items={[
		{
			type: 'section',
			title: 'Actions',
			items: [
				{ label: 'Edit', icon: 'wrench', onClick: () => {} },
				{ label: 'Duplicate', icon: 'copy', onClick: () => {} }
			]
		},
		{
			type: 'section',
			title: 'Danger zone',
			items: [{ label: 'Delete', icon: 'close', onClick: () => {} }]
		}
	]}
/>
