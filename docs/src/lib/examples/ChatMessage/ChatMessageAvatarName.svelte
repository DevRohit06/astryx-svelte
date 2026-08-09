<!--
	Ported from upstream's `templates/blocks/components/ChatMessage/ChatMessageAvatarName.tsx`.
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

{#snippet firstTimestamp()}
	<Timestamp value="2026-04-28T10:15:00" format="time" />
{/snippet}

{#snippet secondTimestamp()}
	<Timestamp value="2026-04-28T10:16:00" format="time" />
{/snippet}

{#snippet thirdTimestamp()}
	<Timestamp value="2026-04-28T10:17:00" format="time" />
{/snippet}

{#snippet firstMetadata()}
	<ChatMessageMetadata timestamp={firstTimestamp} />
{/snippet}

{#snippet secondMetadata()}
	<ChatMessageMetadata timestamp={secondTimestamp} status="read" />
{/snippet}

{#snippet thirdMetadata()}
	<ChatMessageMetadata timestamp={thirdTimestamp} />
{/snippet}

<ChatMessageList style="max-width: 500px">
	<ChatMessage sender="assistant" avatar={agentAvatar}>
		<ChatMessageBubble name={agentName} metadata={firstMetadata}>
			I reviewed the pull request. The changes look solid — clean code and good test coverage.
		</ChatMessageBubble>
	</ChatMessage>
	<ChatMessage sender="user">
		<ChatMessageBubble metadata={secondMetadata}>Thanks! Merging it now.</ChatMessageBubble>
	</ChatMessage>
	<ChatMessage sender="assistant" avatar={agentAvatar}>
		<ChatMessageBubble name={agentName} metadata={thirdMetadata}>
			I can run the deployment pipeline once it lands. Just let me know.
		</ChatMessageBubble>
	</ChatMessage>
</ChatMessageList>
