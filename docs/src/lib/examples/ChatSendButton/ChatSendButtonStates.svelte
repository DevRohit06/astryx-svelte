<!--
	Ported from upstream's `templates/blocks/components/ChatSendButton/ChatSendButtonStates.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { ChatSendButton, Stack, Text } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={2}>
	<Text type="supporting" color="secondary">Disabled → Ready → Streaming</Text>
	<Stack direction="horizontal" gap={3} vAlign="center">
		<ChatSendButton isDisabled onSend={() => {}} />
		<ChatSendButton isDisabled={false} onSend={() => {}} />
		<ChatSendButton isStopShown onStop={() => {}} />
	</Stack>
</Stack>
