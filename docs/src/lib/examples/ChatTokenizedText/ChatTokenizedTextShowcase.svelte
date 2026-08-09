<!--
	Ported from upstream's `templates/blocks/components/ChatTokenizedText/ChatTokenizedTextShowcase.tsx`.
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

	const mixedTokens: ChatComposerToken[] = [
		{ value: '@cindy', label: '@Cindy', variant: 'blue' },
		{ value: '#bug', label: '#bug', variant: 'red' },
		{ value: '#feat', label: '#feature', variant: 'green' }
	];
</script>

<ChatMessageList>
	<ChatMessage sender="system">
		<ChatMessageBubble>
			<ChatTokenizedText
				tokens={mixedTokens}
				children="@cindy filed #bug and #feat for the sprint"
			/>
		</ChatMessageBubble>
	</ChatMessage>
</ChatMessageList>
