<!--
	Ported from upstream's `templates/blocks/components/ChatMessageMetadata/ChatMessageMetadataFooter.tsx`.
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
		Timestamp
	} from '@astryx-svelte/core';
</script>

{#snippet copyIcon()}<Icon icon="copy" size="sm" />{/snippet}
{#snippet retryIcon()}<Icon icon="arrowsUpDown" size="sm" />{/snippet}
{#snippet thumbUpIcon()}<Icon icon="success" size="sm" />{/snippet}
{#snippet thumbDownIcon()}<Icon icon="error" size="sm" />{/snippet}

{#snippet userTimestamp()}
	<Timestamp value="2026-04-29T09:41:00" format="time" />
{/snippet}

{#snippet assistantTimestamp()}
	<Timestamp value="2026-04-29T09:42:00" format="time" />
{/snippet}

{#snippet assistantFooter()}
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
		<Text type="supporting" color="secondary">GPT-4o</Text>
	</HStack>
{/snippet}

{#snippet userMetadata()}
	<ChatMessageMetadata timestamp={userTimestamp} status="read" />
{/snippet}

{#snippet assistantMetadata()}
	<ChatMessageMetadata timestamp={assistantTimestamp} footer={assistantFooter} />
{/snippet}

<ChatMessageList style="max-width: 500px">
	<ChatMessage sender="user">
		<ChatMessageBubble metadata={userMetadata}>Summarize the Q1 revenue report.</ChatMessageBubble>
	</ChatMessage>
	<ChatMessage sender="assistant">
		<ChatMessageBubble metadata={assistantMetadata}>
			Q1 revenue reached $2.4B, up 18% year-over-year. Enterprise subscriptions drove 62% of the
			growth, while ad revenue held steady at $890M.
		</ChatMessageBubble>
	</ChatMessage>
</ChatMessageList>
