<!--
	Ported from upstream's `templates/blocks/components/ContextMenuItem/ContextMenuItemBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { ContextMenu, ContextMenuItem } from '@astryx-svelte/core';
</script>

<ContextMenu>
	{#snippet menuContent()}
		<ContextMenuItem label="Edit" description="Modify this item" onClick={() => {}} />
		<ContextMenuItem label="Duplicate" description="Create a copy" onClick={() => {}} />
		<ContextMenuItem label="Delete" description="This action cannot be undone" onClick={() => {}} />
	{/snippet}
	<div
		style="padding: 48px; border-width: 2px; border-style: dashed; border-color: var(--color-border); border-radius: 8px; text-align: center; color: var(--color-text-secondary); user-select: none"
	>
		Right-click this area
	</div>
</ContextMenu>
