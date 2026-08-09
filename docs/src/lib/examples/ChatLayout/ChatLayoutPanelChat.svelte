<!--
	Ported from upstream's `templates/blocks/components/ChatLayout/ChatLayoutPanelChat.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream's `panel` is a `CSSProperties` object on a plain `<div>`; here it is
	a style string, with React's implicit `px` on bare numbers written out.
	`Markdown`'s `children` is typed `string` on both sides, so each body is a
	prop rather than markup.
-->
<script lang="ts">
	import {
		ChatComposer,
		ChatLayout,
		ChatMessage,
		ChatMessageBubble,
		ChatMessageList,
		ChatSystemMessage,
		Markdown
	} from '@astryx-svelte/core';

	const panel =
		'width: 450px; height: 600px; border-radius: 8px; overflow: hidden; border: 1px solid var(--color-border)';

	const firstAnswer = `I'll check the Button component now.

Found the issue — the border radius was hardcoded. Replaced with the theme token.`;

	const secondAnswer = `Checking the component now.

Found the issue — the border radius was hardcoded. Replaced with the theme token.`;
</script>

{#snippet composer()}
	<ChatComposer onSubmit={() => {}} placeholder="Ask something..." />
{/snippet}

<div style={panel}>
	<ChatLayout {composer}>
		<ChatMessageList>
			<ChatSystemMessage variant="divider">Today</ChatSystemMessage>

			<ChatMessage sender="user">
				<ChatMessageBubble>
					Can you review the Button component and fix the focus ring?
				</ChatMessageBubble>
			</ChatMessage>

			<ChatMessage sender="assistant">
				<Markdown density="compact" children={firstAnswer} />
			</ChatMessage>

			<ChatMessage sender="user">
				<ChatMessageBubble>Nice, can you also check the Card component?</ChatMessageBubble>
			</ChatMessage>

			<ChatMessage sender="assistant">
				<Markdown density="compact" children={secondAnswer} />
			</ChatMessage>
		</ChatMessageList>
	</ChatLayout>
</div>
