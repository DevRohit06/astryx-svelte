<!--
	Ported from upstream's `templates/blocks/components/ChatSystemMessage/ChatSystemMessageStatusUpdates.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here rather than inlining the SVGs, so the icons
	are registry substitutions: `UserPlusIcon` → `info`, `UserMinusIcon` →
	`close`, `CheckCircleIcon` → `success`. Stand-ins rather than true matches,
	the same ones the demo routes make. Retires with the icon registry (TODO.md).
-->
<script lang="ts">
	import { ChatMessageList, ChatSystemMessage, Icon } from '@astryx-svelte/core';
</script>

{#snippet userPlusIcon()}<Icon icon="info" />{/snippet}
{#snippet userMinusIcon()}<Icon icon="close" />{/snippet}
{#snippet checkCircleIcon()}<Icon icon="success" />{/snippet}

<ChatMessageList>
	<ChatSystemMessage variant="divider">March 14, 2026</ChatSystemMessage>
	<ChatSystemMessage icon={userPlusIcon}>Sarah Chen joined the conversation</ChatSystemMessage>
	<ChatSystemMessage>Topic changed to "Q2 Launch Planning"</ChatSystemMessage>
	<ChatSystemMessage variant="divider">March 15, 2026</ChatSystemMessage>
	<ChatSystemMessage icon={userMinusIcon}>Alex Rivera left the conversation</ChatSystemMessage>
	<ChatSystemMessage variant="divider">Today</ChatSystemMessage>
	<ChatSystemMessage icon={checkCircleIcon}>Conversation marked as resolved</ChatSystemMessage>
</ChatMessageList>
