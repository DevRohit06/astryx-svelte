<!--
	Ported from upstream's `templates/blocks/components/ChatMessageList/ChatMessageListShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import {
		ChatMessage,
		ChatMessageBubble,
		ChatMessageList,
		ChatMessageMetadata,
		ChatSystemMessage,
		Timestamp,
		VStack
	} from '@astryx-svelte/core';
</script>

{#snippet firstTimestamp()}
	<Timestamp value="2026-03-15T14:30:00" format="time" />
{/snippet}

{#snippet secondTimestamp()}
	<Timestamp value="2026-03-15T14:30:15" format="time" />
{/snippet}

{#snippet thirdTimestamp()}
	<Timestamp value="2026-03-15T14:31:00" format="time" />
{/snippet}

{#snippet firstMetadata()}
	<ChatMessageMetadata timestamp={firstTimestamp} status="read" />
{/snippet}

{#snippet secondMetadata()}
	<ChatMessageMetadata timestamp={secondTimestamp} />
{/snippet}

{#snippet thirdMetadata()}
	<ChatMessageMetadata timestamp={thirdTimestamp} status="delivered" />
{/snippet}

<VStack style="max-width: 600px; height: 100%">
	<ChatMessageList density="balanced">
		<ChatSystemMessage variant="divider">March 15, 2026</ChatSystemMessage>

		<ChatMessage sender="user">
			<ChatMessageBubble metadata={firstMetadata}>
				How should I structure a monorepo?
			</ChatMessageBubble>
		</ChatMessage>

		<ChatMessage sender="assistant">
			<ChatMessageBubble metadata={secondMetadata}>
				Use workspaces with a shared packages directory. Keep each package focused on a single
				concern.
			</ChatMessageBubble>
		</ChatMessage>

		<ChatMessage sender="user">
			<ChatMessageBubble metadata={thirdMetadata}>
				Should I use Yarn or pnpm for that?
			</ChatMessageBubble>
		</ChatMessage>
	</ChatMessageList>
</VStack>
