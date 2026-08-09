<!--
	Ported from upstream's `templates/blocks/components/ChatSystemMessage/ChatSystemMessageShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { ChatMessageList, ChatSystemMessage } from '@astryx-svelte/core';
</script>

<ChatMessageList>
	<ChatSystemMessage variant="divider">March 15, 2026</ChatSystemMessage>
	<ChatSystemMessage>Alex joined the conversation</ChatSystemMessage>
	<ChatSystemMessage>Agent is thinking…</ChatSystemMessage>
	<ChatSystemMessage variant="divider">Today</ChatSystemMessage>
	<ChatSystemMessage>Conversation marked as resolved</ChatSystemMessage>
</ChatMessageList>
