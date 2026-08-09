<!--
	Ported from upstream's `templates/blocks/components/ChatComposer/ChatComposerSimple.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { ChatComposer, Stack } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" style="width: 100%; max-width: 450px">
	<ChatComposer
		onSubmit={(value) => {
			console.log('Sent:', value);
		}}
	/>
</Stack>
