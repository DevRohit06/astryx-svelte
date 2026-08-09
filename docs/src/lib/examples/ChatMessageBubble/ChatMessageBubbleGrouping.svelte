<!--
	Ported from upstream's `templates/blocks/components/ChatMessageBubble/ChatMessageBubbleGrouping.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
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

{#snippet assistantTimestamp()}
	<Timestamp value="2026-04-10T10:45:00" format="time" />
{/snippet}

{#snippet userTimestamp()}
	<Timestamp value="2026-04-10T10:46:00" format="time" />
{/snippet}

{#snippet assistantMetadata()}
	<ChatMessageMetadata timestamp={assistantTimestamp} />
{/snippet}

{#snippet userMetadata()}
	<ChatMessageMetadata timestamp={userTimestamp} status="delivered" />
{/snippet}

<ChatMessageList style="max-width: 500px">
	<ChatMessage sender="assistant" avatar={agentAvatar}>
		<ChatMessageBubble group="first" name={agentName}>
			I reviewed the three files you shared.
		</ChatMessageBubble>
		<ChatMessageBubble group="middle">
			The data model looks solid, but the API handler has a race condition on concurrent writes.
		</ChatMessageBubble>
		<ChatMessageBubble group="last" metadata={assistantMetadata}>
			I can draft a fix if you want.
		</ChatMessageBubble>
	</ChatMessage>
	<ChatMessage sender="user">
		<ChatMessageBubble group="first">Yes please!</ChatMessageBubble>
		<ChatMessageBubble group="last" metadata={userMetadata}>
			Also add a test for the concurrent case.
		</ChatMessageBubble>
	</ChatMessage>
</ChatMessageList>
