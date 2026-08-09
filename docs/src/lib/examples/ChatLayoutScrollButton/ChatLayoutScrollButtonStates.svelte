<!--
	Ported from upstream's `templates/blocks/components/ChatLayoutScrollButton/ChatLayoutScrollButtonStates.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { ChatLayoutScrollButton, Stack, Text } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={4}>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Hidden (user is at bottom)</Text>
		<ChatLayoutScrollButton isVisible={false} onClick={() => {}} />
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Visible (user scrolled up)</Text>
		<ChatLayoutScrollButton isVisible={true} onClick={() => {}} />
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Expanded with label (new messages arrived)</Text>
		<ChatLayoutScrollButton isVisible={true} label="New messages" onClick={() => {}} />
	</Stack>
</Stack>
