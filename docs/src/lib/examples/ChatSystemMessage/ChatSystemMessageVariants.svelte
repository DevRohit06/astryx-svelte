<!--
	Ported from upstream's `templates/blocks/components/ChatSystemMessage/ChatSystemMessageVariants.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { ChatMessageList, ChatSystemMessage, Stack, Text } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={4}>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Default</Text>
		<ChatMessageList>
			<ChatSystemMessage>Alex joined the conversation</ChatSystemMessage>
			<ChatSystemMessage>Conversation marked as resolved</ChatSystemMessage>
		</ChatMessageList>
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Divider</Text>
		<ChatMessageList>
			<ChatSystemMessage variant="divider">March 15, 2026</ChatSystemMessage>
			<ChatSystemMessage variant="divider">Today</ChatSystemMessage>
		</ChatMessageList>
	</Stack>
</Stack>
