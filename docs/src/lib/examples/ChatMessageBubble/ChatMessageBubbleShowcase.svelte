<!--
	Ported from upstream's `templates/blocks/components/ChatMessageBubble/ChatMessageBubbleShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		ChatMessage,
		ChatMessageBubble,
		ChatMessageList,
		ChatMessageMetadata,
		Timestamp
	} from '@astryx-svelte/core';
</script>

{#snippet userTimestamp()}
	<Timestamp value="2026-04-10T09:15:00" format="time" />
{/snippet}

{#snippet assistantTimestamp()}
	<Timestamp value="2026-04-10T09:16:00" format="time" />
{/snippet}

{#snippet userMetadata()}
	<ChatMessageMetadata timestamp={userTimestamp} status="read" />
{/snippet}

{#snippet assistantMetadata()}
	<ChatMessageMetadata timestamp={assistantTimestamp} />
{/snippet}

<ChatMessageList style="max-width: 600px">
	<ChatMessage sender="user">
		<ChatMessageBubble group="first">
			I just pushed the latest changes to the feature branch.
		</ChatMessageBubble>
		<ChatMessageBubble group="last" metadata={userMetadata}>
			Can you review when you get a chance?
		</ChatMessageBubble>
	</ChatMessage>
	<ChatMessage sender="assistant">
		<ChatMessageBubble variant="ghost" metadata={assistantMetadata}>
			The changes look great. Ship it!
		</ChatMessageBubble>
	</ChatMessage>
</ChatMessageList>
