<!--
	Ported from upstream's `templates/blocks/components/DropdownMenuItem/DropdownMenuItemBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { DropdownMenu, DropdownMenuItem } from '@astryx-svelte/core';
</script>

<DropdownMenu button={{ label: 'Actions' }}>
	<DropdownMenuItem label="Edit" description="Modify this item" onClick={() => {}} />
	<DropdownMenuItem label="Duplicate" description="Create a copy" onClick={() => {}} />
	<DropdownMenuItem label="Delete" description="This action cannot be undone" onClick={() => {}} />
</DropdownMenu>
