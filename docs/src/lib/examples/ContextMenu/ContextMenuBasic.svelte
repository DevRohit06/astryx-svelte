<!--
	Ported from upstream's `templates/blocks/components/ContextMenu/ContextMenuBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { ContextMenu } from '@astryx-svelte/core';
</script>

<ContextMenu
	items={[
		{ label: 'Cut', onClick: () => {} },
		{ label: 'Copy', onClick: () => {} },
		{ label: 'Paste', onClick: () => {} },
		{ type: 'divider' },
		{ label: 'Delete', onClick: () => {} }
	]}
>
	<div
		style="padding: 48px; border-width: 2px; border-style: dashed; border-color: #d1d5db; border-radius: 8px; text-align: center; color: #6b7280; user-select: none"
	>
		Right-click this area
	</div>
</ContextMenu>
