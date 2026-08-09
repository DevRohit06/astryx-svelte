<!--
	Ported from upstream's `templates/blocks/components/ChatMessage/ChatMessageMultiBubble.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`avatar`, `name`, `metadata` and `timestamp` are all snippets here — upstream
	types them `ReactNode` and writes the elements inline.
-->
<script lang="ts">
	import {
		Avatar,
		ChatMessage,
		ChatMessageBubble,
		ChatMessageList,
		ChatMessageMetadata,
		Text,
		Timestamp
	} from '@astryx-svelte/core';
</script>

{#snippet agentAvatar()}
	<Avatar name="Agent" size="md" />
{/snippet}

{#snippet agentName()}
	<Text type="supporting" weight="semibold" color="secondary">Agent</Text>
{/snippet}

{#snippet userTimestamp()}
	<Timestamp value="2026-04-28T11:00:00" format="time" />
{/snippet}

{#snippet assistantTimestamp()}
	<Timestamp value="2026-04-28T11:01:00" format="time" />
{/snippet}

{#snippet userMetadata()}
	<ChatMessageMetadata timestamp={userTimestamp} status="delivered" />
{/snippet}

{#snippet assistantMetadata()}
	<ChatMessageMetadata timestamp={assistantTimestamp} />
{/snippet}

<ChatMessageList style="max-width: 500px">
	<ChatMessage sender="user">
		<ChatMessageBubble group="first">
			I have a couple of questions about the new API.
		</ChatMessageBubble>
		<ChatMessageBubble group="middle">First, how should we handle pagination?</ChatMessageBubble>
		<ChatMessageBubble group="last" metadata={userMetadata}>
			And second, what's the rate limit?
		</ChatMessageBubble>
	</ChatMessage>
	<ChatMessage sender="assistant" avatar={agentAvatar}>
		<ChatMessageBubble group="first" name={agentName}>
			Great questions! For pagination, use cursor-based with a limit parameter. The response
			includes a nextCursor field.
		</ChatMessageBubble>
		<ChatMessageBubble group="last" metadata={assistantMetadata}>
			Rate limit is 100 requests per minute per API key. You'll get a 429 response with a
			Retry-After header if you exceed it.
		</ChatMessageBubble>
	</ChatMessage>
</ChatMessageList>
