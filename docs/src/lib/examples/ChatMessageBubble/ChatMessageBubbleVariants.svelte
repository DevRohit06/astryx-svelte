<!--
	Ported from upstream's `templates/blocks/components/ChatMessageBubble/ChatMessageBubbleVariants.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		ChatMessage,
		ChatMessageBubble,
		ChatMessageList,
		Stack,
		Text
	} from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={4} style="max-width: 500px">
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Filled — sender-colored background (default)</Text>
		<ChatMessageList>
			<ChatMessage sender="user">
				<ChatMessageBubble>Can you summarize the latest deployment logs?</ChatMessageBubble>
			</ChatMessage>
		</ChatMessageList>
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">
			Ghost — transparent background, keeps alignment padding
		</Text>
		<ChatMessageList>
			<ChatMessage sender="assistant">
				<ChatMessageBubble variant="ghost">
					The last deploy completed at 2:41 PM with zero errors across all three regions.
				</ChatMessageBubble>
			</ChatMessage>
		</ChatMessageList>
	</Stack>
</Stack>
