<!--
	Ported from upstream's `templates/blocks/components/ChatComposer/ChatComposerValidation.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { ChatComposer, Stack, Text } from '@astryx-svelte/core';
</script>

<Stack direction="vertical" gap={4} style="width: 100%; max-width: 450px">
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Error message (with top position)</Text>
		<ChatComposer
			onSubmit={(value) => {
				console.log('Sent:', value);
			}}
			statusPosition="top"
			status={{ type: 'error', message: 'Failed to send message. Please try again.' }}
		/>
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Warning message (with bottom position)</Text>
		<ChatComposer
			onSubmit={(value) => {
				console.log('Sent:', value);
			}}
			status={{ type: 'warning', message: 'Context window is 90% full.' }}
		/>
	</Stack>
</Stack>
