<!--
	Ported from upstream's `templates/blocks/components/ChatSendButton/ChatSendButtonShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream imports a Heroicon here rather than inlining the SVG, so the icon is
	a registry substitution: `SparklesIcon` → `wrench`. A stand-in rather than a
	true match, the same one the demo routes make. Retires with the icon registry
	(TODO.md).
-->
<script lang="ts">
	import { ChatSendButton, Icon, Stack } from '@astryx-svelte/core';
</script>

{#snippet sparklesIcon()}<Icon icon="wrench" size="sm" />{/snippet}

<Stack direction="horizontal" gap={3} vAlign="center">
	<ChatSendButton isDisabled={false} onSend={() => {}} />
	<ChatSendButton isDisabled={false} onSend={() => {}} sendIcon={sparklesIcon} />
	<ChatSendButton isStopShown onStop={() => {}} />
</Stack>
