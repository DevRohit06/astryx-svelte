<!--
	Ported from upstream's `templates/blocks/components/ChatMessage/ChatMessageShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`name`, `metadata` and `timestamp` are `string | Snippet` here where upstream
	types them `ReactNode`, so each element it writes inline becomes a snippet.
-->
<script lang="ts">
	import {
		ChatMessage,
		ChatMessageBubble,
		ChatMessageList,
		ChatMessageMetadata,
		Text,
		Timestamp
	} from '@astryx-svelte/core';
</script>

{#snippet userTimestamp()}
	<Timestamp value="2026-04-28T14:30:00" format="time" />
{/snippet}

{#snippet assistantTimestamp()}
	<Timestamp value="2026-04-28T14:31:00" format="time" />
{/snippet}

{#snippet modelFooter()}
	<Text type="supporting" color="secondary">Claude Opus 4.6</Text>
{/snippet}

{#snippet userMetadata()}
	<ChatMessageMetadata timestamp={userTimestamp} status="read" />
{/snippet}

{#snippet assistantMetadata()}
	<ChatMessageMetadata timestamp={assistantTimestamp} footer={modelFooter} />
{/snippet}

<ChatMessageList style="max-width: 600px">
	<ChatMessage sender="user">
		<ChatMessageBubble group="first">I just pushed the refactored auth module.</ChatMessageBubble>
		<ChatMessageBubble group="last" metadata={userMetadata}>
			Can you review the token validation changes?
		</ChatMessageBubble>
	</ChatMessage>
	<ChatMessage sender="assistant">
		<ChatMessageBubble variant="ghost" metadata={assistantMetadata}>
			Looks good — the refresh token rotation is solid and the error handling covers all the edge
			cases. Ship it.
		</ChatMessageBubble>
	</ChatMessage>
</ChatMessageList>
