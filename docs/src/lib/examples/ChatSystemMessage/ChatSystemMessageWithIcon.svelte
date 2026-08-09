<!--
	Ported from upstream's `templates/blocks/components/ChatSystemMessage/ChatSystemMessageWithIcon.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here rather than inlining the SVGs, so the icons
	are registry substitutions: `UserPlusIcon` → `info`, `LockClosedIcon` →
	`stop`, `SparklesIcon` → `wrench`, `ShieldCheckIcon` → `success`. Stand-ins
	rather than true matches, the same ones the demo routes make. Retires with
	the icon registry (TODO.md).
-->
<script lang="ts">
	import { ChatMessageList, ChatSystemMessage, Icon, Stack, Text } from '@astryx-svelte/core';
</script>

{#snippet userPlusIcon()}<Icon icon="info" />{/snippet}
{#snippet lockClosedIcon()}<Icon icon="stop" />{/snippet}
{#snippet sparklesIcon()}<Icon icon="wrench" />{/snippet}
{#snippet shieldCheckIcon()}<Icon icon="success" />{/snippet}

<Stack direction="vertical" gap={4}>
	<Text type="supporting" color="secondary">Icons reinforce the message type</Text>
	<ChatMessageList>
		<ChatSystemMessage icon={userPlusIcon}>Jordan was added to the conversation</ChatSystemMessage>
		<ChatSystemMessage icon={lockClosedIcon}>Messages are end-to-end encrypted</ChatSystemMessage>
		<ChatSystemMessage icon={sparklesIcon}>Agent is generating a response…</ChatSystemMessage>
		<ChatSystemMessage icon={shieldCheckIcon}>Conversation verified by admin</ChatSystemMessage>
	</ChatMessageList>
</Stack>
