<!--
	Ported from upstream's `templates/blocks/components/ChatComposer/ChatComposerStreaming.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`useState` becomes `$state`; `value`/`onChange` stays a controlled pair rather
	than a `$bindable`, which is what upstream's is.
-->
<script lang="ts">
	import { ChatComposer, Stack, Text } from '@astryx-svelte/core';

	let isStreaming = $state(false);
	let value = $state('Click the send button to start streaming.');
</script>

<Stack direction="vertical" gap={4} style="width: 100%; max-width: 450px">
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">
			{isStreaming ? 'Streaming — click stop to cancel' : 'Send a message to start streaming'}
		</Text>
		<ChatComposer
			{value}
			onChange={(next) => (value = next)}
			onSubmit={(submitted) => {
				console.log('Sent:', submitted);
				value = '';
				isStreaming = true;
				setTimeout(() => (isStreaming = false), 5000);
			}}
			isStopShown={isStreaming}
			onStop={() => {
				console.log('Stopped');
				isStreaming = false;
			}}
			placeholder="Send a message to start streaming..."
		/>
	</Stack>
</Stack>
