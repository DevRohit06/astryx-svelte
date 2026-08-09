<!--
	Ported from upstream's `templates/blocks/components/ChatLayout/ChatLayoutShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`ChatTokenizedText`'s `children` is typed `string` on both sides, so the text
	is passed as a prop: content between the tags would be a `Snippet`.
-->
<script lang="ts">
	import type { ChatComposerToken } from '@astryx-svelte/core';
	import {
		ChatComposer,
		ChatLayout,
		ChatMessage,
		ChatMessageBubble,
		ChatMessageList,
		ChatTokenizedText,
		VStack
	} from '@astryx-svelte/core';

	const TOKENS: ChatComposerToken[] = [{ value: '/review', label: '/review', variant: 'blue' }];
</script>

{#snippet composer()}
	<ChatComposer onSubmit={() => {}} placeholder="Ask something..." />
{/snippet}

<VStack width={450}>
	<ChatLayout {composer}>
		<ChatMessageList>
			<ChatMessage sender="user">
				<ChatMessageBubble>
					<ChatTokenizedText tokens={TOKENS} children="/review the changes in this file" />
				</ChatMessageBubble>
			</ChatMessage>
			<ChatMessage sender="assistant">
				<ChatMessageBubble variant="ghost">Reading the file now...</ChatMessageBubble>
			</ChatMessage>
		</ChatMessageList>
	</ChatLayout>
</VStack>
