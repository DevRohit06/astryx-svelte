<!--
	Ported from upstream's `templates/blocks/components/ChatMessageMetadata/ChatMessageMetadataShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here rather than inlining the SVGs, so the icons
	are registry substitutions: `ClipboardDocumentIcon` → `copy` (an exact
	match), `ArrowPathIcon` → `arrowsUpDown`, `HandThumbUpIcon` → `success`,
	`HandThumbDownIcon` → `error`. Stand-ins rather than true matches, the same
	ones the demo routes make. Retires with the icon registry (port/todo.md).
-->
<script lang="ts">
	import {
		Button,
		ChatMessage,
		ChatMessageBubble,
		ChatMessageList,
		ChatMessageMetadata,
		HStack,
		Icon,
		Text,
		Timestamp,
		VStack
	} from '@astryx-svelte/core';
</script>

{#snippet copyIcon()}<Icon icon="copy" size="sm" />{/snippet}
{#snippet retryIcon()}<Icon icon="arrowsUpDown" size="sm" />{/snippet}
{#snippet thumbUpIcon()}<Icon icon="success" size="sm" />{/snippet}
{#snippet thumbDownIcon()}<Icon icon="error" size="sm" />{/snippet}

{#snippet errorTimestamp()}
	<Timestamp value="2026-03-15T14:30:00" format="time" />
{/snippet}

{#snippet userTimestamp()}
	<Timestamp value="2026-03-15T14:31:00" format="time" />
{/snippet}

{#snippet replyTimestamp()}
	<Timestamp value="2026-03-15T14:32:00" format="time" />
{/snippet}

{#snippet retryFooter()}
	<HStack gap={1}>
		<Button
			label="Retry"
			variant="ghost"
			size="sm"
			icon={retryIcon}
			isIconOnly
			onclick={() => {}}
		/>
	</HStack>
{/snippet}

{#snippet replyFooter()}
	<HStack gap={1}>
		<Button label="Copy" variant="ghost" size="sm" icon={copyIcon} isIconOnly onclick={() => {}} />
		<Button
			label="Retry"
			variant="ghost"
			size="sm"
			icon={retryIcon}
			isIconOnly
			onclick={() => {}}
		/>
		<Button
			label="Good response"
			variant="ghost"
			size="sm"
			icon={thumbUpIcon}
			isIconOnly
			onclick={() => {}}
		/>
		<Button
			label="Bad response"
			variant="ghost"
			size="sm"
			icon={thumbDownIcon}
			isIconOnly
			onclick={() => {}}
		/>
		<Text type="supporting" color="secondary">Claude Opus 4.6</Text>
	</HStack>
{/snippet}

{#snippet errorMetadata()}
	<ChatMessageMetadata timestamp={errorTimestamp} status="error" footer={retryFooter} />
{/snippet}

{#snippet userMetadata()}
	<ChatMessageMetadata timestamp={userTimestamp} status="read" />
{/snippet}

{#snippet replyMetadata()}
	<ChatMessageMetadata timestamp={replyTimestamp} footer={replyFooter} />
{/snippet}

<VStack style="max-width: 600px">
	<ChatMessageList>
		<ChatMessage sender="assistant">
			<ChatMessageBubble metadata={errorMetadata}>
				Sorry, something went wrong on my end.
			</ChatMessageBubble>
		</ChatMessage>

		<ChatMessage sender="user">
			<ChatMessageBubble metadata={userMetadata}>
				No worries — try again with just the last 24 hours of logs.
			</ChatMessageBubble>
		</ChatMessage>

		<ChatMessage sender="assistant">
			<ChatMessageBubble metadata={replyMetadata}>
				The canary at 11:42 AM caused a memory spike. Rolled back at 11:58 AM.
			</ChatMessageBubble>
		</ChatMessage>
	</ChatMessageList>
</VStack>
