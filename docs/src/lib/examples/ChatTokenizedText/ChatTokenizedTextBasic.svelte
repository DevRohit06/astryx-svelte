<!--
	Ported from upstream's `templates/blocks/components/ChatTokenizedText/ChatTokenizedTextBasic.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`children` is typed `string` on both sides, so the text is passed as a prop:
	content written between the tags would be a `Snippet`.
-->
<script lang="ts">
	import type { ChatComposerToken } from '@astryx-svelte/core';
	import {
		ChatMessage,
		ChatMessageBubble,
		ChatMessageList,
		ChatTokenizedText
	} from '@astryx-svelte/core';

	const tokens: ChatComposerToken[] = [
		{ value: '@cindy', label: '@Cindy', variant: 'blue' },
		{ value: '@alex', label: '@Alex', variant: 'blue' }
	];
</script>

<ChatMessageList>
	<ChatMessage sender="system">
		<ChatMessageBubble>
			<ChatTokenizedText {tokens} children="Assign @cindy and @alex as reviewers." />
		</ChatMessageBubble>
	</ChatMessage>
</ChatMessageList>
