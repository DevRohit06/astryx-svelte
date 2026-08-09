<!--
	Ported from upstream's `templates/blocks/components/DropdownMenu/DropdownMenuShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { DropdownMenu } from '@astryx-svelte/core';
</script>

<DropdownMenu
	button={{ label: 'Actions' }}
	items={[
		{ label: 'Edit', onClick: () => {} },
		{ label: 'Duplicate', onClick: () => {} },
		{ label: 'Delete', onClick: () => {} }
	]}
/>
