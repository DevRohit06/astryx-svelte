<!--
	Ported from upstream's `templates/blocks/components/ChatMessage/ChatMessageGhost.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`metadata`, `timestamp` and `footer` are `string | Snippet` here where
	upstream types them `ReactNode`, so each element it writes inline becomes a
	snippet.
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

{#snippet firstTimestamp()}
	<Timestamp value="2026-04-28T09:45:00" format="time" />
{/snippet}

{#snippet secondTimestamp()}
	<Timestamp value="2026-04-28T09:46:00" format="time" />
{/snippet}

{#snippet modelFooter()}
	<Text type="supporting" color="secondary">Claude Opus 4.6</Text>
{/snippet}

{#snippet firstMetadata()}
	<ChatMessageMetadata timestamp={firstTimestamp} footer={modelFooter} />
{/snippet}

{#snippet secondMetadata()}
	<ChatMessageMetadata timestamp={secondTimestamp} footer={modelFooter} />
{/snippet}

<ChatMessageList style="max-width: 500px">
	<ChatMessage sender="assistant">
		<ChatMessageBubble variant="ghost" metadata={firstMetadata}>
			Here is an analysis of your production metrics from last week. Traffic peaked at 12,400
			requests per second on Wednesday, with a p99 latency of 45ms. Error rate stayed below 0.1%
			across all endpoints.
		</ChatMessageBubble>
	</ChatMessage>
	<ChatMessage sender="user">
		<ChatMessageBubble>That looks great. Can you compare it to the week before?</ChatMessageBubble>
	</ChatMessage>
	<ChatMessage sender="assistant">
		<ChatMessageBubble variant="ghost" metadata={secondMetadata}>
			Compared to the previous week, traffic is up 8% and latency improved by 3ms. The deployment on
			Tuesday seems to have helped.
		</ChatMessageBubble>
	</ChatMessage>
</ChatMessageList>
