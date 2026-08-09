<!--
	Ported from upstream's `templates/blocks/components/ChatComposerInput/ChatComposerInputControlledInput.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`useState` + `setValue` become `$state` and an arrow that assigns it —
	`value`/`onChange` is a controlled pair on both sides, not a `$bindable`.
-->
<script lang="ts">
	import { ChatComposer, ChatComposerInput, Stack, Text } from '@astryx-svelte/core';

	let value = $state('');
</script>

{#snippet input()}
	<ChatComposerInput {value} onChange={(next) => (value = next)} placeholder="Type a message..." />
{/snippet}

<Stack direction="vertical" gap={3} style="width: 450px; max-width: 100%">
	<ChatComposer onSubmit={() => (value = '')} {value} onChange={(next) => (value = next)} {input} />
	<Text type="supporting" color="secondary">Value: {JSON.stringify(value)}</Text>
</Stack>
