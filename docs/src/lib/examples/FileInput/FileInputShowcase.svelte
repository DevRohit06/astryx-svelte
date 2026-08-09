<!--
	Ported from upstream's `templates/blocks/components/FileInput/FileInputShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { FileInput } from '@astryx-svelte/core';

	let value = $state<File | File[] | null>(null);
</script>

<div style="width: 350px">
	<FileInput
		label="Upload file"
		{value}
		onChange={(next) => (value = next)}
		placeholder="Drag files here or click to browse"
	/>
</div>
