<!--
	Ported from upstream's `templates/blocks/components/ChatSendButton/ChatSendButtonCustomIcon.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports Heroicons here rather than inlining the SVGs, so the icons
	are registry substitutions: `PaperAirplaneIcon` → `arrowUp`, `CheckIcon` →
	`check`, `SparklesIcon` → `wrench`, `XCircleIcon` → `close`. Stand-ins rather
	than true matches, the same ones the demo routes make — `arrowUp` and `check`
	happen to be exact. Retires with the icon registry (port/todo.md).
-->
<script lang="ts">
	import { ChatSendButton, Icon, Stack, Text } from '@astryx-svelte/core';
</script>

{#snippet paperAirplaneIcon()}<Icon icon="arrowUp" size="sm" />{/snippet}
{#snippet checkIcon()}<Icon icon="check" size="sm" />{/snippet}
{#snippet sparklesIcon()}<Icon icon="wrench" size="sm" />{/snippet}
{#snippet xCircleIcon()}<Icon icon="close" size="sm" />{/snippet}

<Stack direction="vertical" gap={4}>
	<Text type="supporting" color="secondary">Custom icons for send and stop states</Text>
	<Stack direction="horizontal" gap={4} vAlign="center">
		<ChatSendButton isDisabled={false} onSend={() => {}} sendIcon={paperAirplaneIcon} />
		<ChatSendButton isDisabled={false} onSend={() => {}} sendIcon={checkIcon} />
		<ChatSendButton isDisabled={false} onSend={() => {}} sendIcon={sparklesIcon} />
		<ChatSendButton isStopShown onStop={() => {}} stopIcon={xCircleIcon} />
	</Stack>
</Stack>
