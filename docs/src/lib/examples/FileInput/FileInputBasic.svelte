<!--
	Ported from upstream's `templates/blocks/components/FileInput/FileInputBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { FileInput } from '@astryx-svelte/core';

	let value = $state<File | File[] | null>(null);
</script>

<div style="width: 350px">
	<FileInput
		label="Resume"
		{value}
		onChange={(next) => (value = next)}
		accept=".pdf,.docx"
		description="PDF or Word document, up to 5 MB"
		maxSize={5 * 1024 * 1024}
	/>
</div>
