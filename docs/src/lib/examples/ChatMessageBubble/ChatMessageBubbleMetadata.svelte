<!--
	Ported from upstream's `templates/blocks/components/ChatMessageBubble/ChatMessageBubbleMetadata.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Unusually for a Chat block, no icon is substituted: upstream already passes
	`icon="copy"`, a registry name this port carries.
-->
<script lang="ts">
	import {
		Avatar,
		Button,
		ChatMessage,
		ChatMessageBubble,
		ChatMessageList,
		ChatMessageMetadata,
		HStack,
		Icon,
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

{#snippet copyIcon()}
	<Icon icon="copy" size="sm" />
{/snippet}

{#snippet assistantTimestamp()}
	<Timestamp value="2026-04-10T09:15:00" format="time" />
{/snippet}

{#snippet userTimestamp()}
	<Timestamp value="2026-04-10T09:16:00" format="time" />
{/snippet}

{#snippet assistantFooter()}
	<HStack gap={1}>
		<Button label="Copy" variant="ghost" size="sm" icon={copyIcon} isIconOnly onclick={() => {}} />
		<Text type="supporting" color="secondary">Claude Opus 4.6</Text>
	</HStack>
{/snippet}

{#snippet assistantMetadata()}
	<ChatMessageMetadata timestamp={assistantTimestamp} footer={assistantFooter} />
{/snippet}

{#snippet userMetadata()}
	<ChatMessageMetadata timestamp={userTimestamp} status="read" />
{/snippet}

<ChatMessageList style="max-width: 500px">
	<ChatMessage sender="assistant" avatar={agentAvatar}>
		<ChatMessageBubble name={agentName} metadata={assistantMetadata}>
			Your deployment finished successfully. All 14 checks passed.
		</ChatMessageBubble>
	</ChatMessage>
	<ChatMessage sender="user">
		<ChatMessageBubble metadata={userMetadata}>
			Great, can you send me the production URL?
		</ChatMessageBubble>
	</ChatMessage>
</ChatMessageList>
