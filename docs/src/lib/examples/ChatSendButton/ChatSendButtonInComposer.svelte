<!--
	Ported from upstream's `templates/blocks/components/ChatSendButton/ChatSendButtonInComposer.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { ChatComposer, Stack } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" width="100%" style="max-width: 450px">
	<ChatComposer onSubmit={() => {}} value="Hello, how can you help?" onChange={() => {}} />
</Stack>
