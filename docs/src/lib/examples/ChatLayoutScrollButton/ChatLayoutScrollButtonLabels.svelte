<!--
	Ported from upstream's `templates/blocks/components/ChatLayoutScrollButton/ChatLayoutScrollButtonLabels.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { ChatLayoutScrollButton, Stack, Text } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={4}>
	<Text type="supporting" color="secondary">Labels expand the button to give context</Text>
	<Stack direction="vertical" gap={3}>
		<ChatLayoutScrollButton isVisible={true} onClick={() => {}} />
		<ChatLayoutScrollButton isVisible={true} label="New messages" onClick={() => {}} />
		<ChatLayoutScrollButton isVisible={true} label="3 unread replies" onClick={() => {}} />
	</Stack>
</Stack>
