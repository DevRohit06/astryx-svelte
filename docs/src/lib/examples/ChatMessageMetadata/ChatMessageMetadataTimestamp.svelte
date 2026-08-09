<!--
	Ported from upstream's `templates/blocks/components/ChatMessageMetadata/ChatMessageMetadataTimestamp.tsx`.
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

{#snippet absoluteTimestamp()}
	<Timestamp value="2026-04-29T14:30:00" format="time" />
{/snippet}

{#snippet relativeTimestamp()}
	<Timestamp value="2026-04-28T16:45:00" format="relative" />
{/snippet}

{#snippet userMetadata()}
	<ChatMessageMetadata timestamp={absoluteTimestamp} />
{/snippet}

{#snippet assistantMetadata()}
	<ChatMessageMetadata timestamp={relativeTimestamp} />
{/snippet}

<ChatMessageList style="max-width: 500px">
	<ChatMessage sender="user">
		<ChatMessageBubble metadata={userMetadata}>
			Thanks — any blockers I should know about?
		</ChatMessageBubble>
	</ChatMessage>
	<ChatMessage sender="assistant">
		<ChatMessageBubble metadata={assistantMetadata}>
			Relative timestamps work too — helpful for older messages where the exact time matters less
			than recency.
		</ChatMessageBubble>
	</ChatMessage>
</ChatMessageList>
