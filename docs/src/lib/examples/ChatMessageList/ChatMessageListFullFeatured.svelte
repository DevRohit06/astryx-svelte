<!--
	Ported from upstream's `templates/blocks/components/ChatMessageList/ChatMessageListFullFeatured.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	`Markdown`'s `children` is typed `string` on both sides, so each body is a
	prop rather than markup — content written between the tags would be a
	`Snippet`.
-->
<script lang="ts">
	import {
		Avatar,
		ChatMessage,
		ChatMessageBubble,
		ChatMessageList,
		ChatMessageMetadata,
		ChatSystemMessage,
		CodeBlock,
		HStack,
		Markdown,
		Timestamp,
		Token,
		VStack
	} from '@astryx-svelte/core';

	const firstAnswer = `Sure! Here's the key pattern from **useReducer.ts**:`;
	const secondAnswer = `The reducer is **pure and easy to test** — pass in state and action, assert on the output.`;

	const snippet = `const [state, dispatch] = useReducer(
  (state, action) => ({
    ...state,
    [action.field]: action.value,
  }),
  { name: '', email: '' }
);`;
</script>

{#snippet agentAvatar()}
	<Avatar name="Agent" size="md" />
{/snippet}

{#snippet userTimestamp()}
	<Timestamp value="2026-03-15T14:30:00" format="time" />
{/snippet}

{#snippet codeTimestamp()}
	<Timestamp value="2026-03-15T14:30:30" format="time" />
{/snippet}

{#snippet closingTimestamp()}
	<Timestamp value="2026-03-15T14:31:00" format="time" />
{/snippet}

{#snippet userMetadata()}
	<ChatMessageMetadata timestamp={userTimestamp} status="read" />
{/snippet}

{#snippet codeMetadata()}
	<ChatMessageMetadata timestamp={codeTimestamp} />
{/snippet}

{#snippet closingMetadata()}
	<ChatMessageMetadata timestamp={closingTimestamp} status="delivered" />
{/snippet}

<VStack style="max-width: 500px; justify-content: center">
	<ChatMessageList>
		<ChatSystemMessage variant="divider">Today</ChatSystemMessage>

		<ChatMessage sender="user">
			<HStack gap={2} wrap="wrap">
				<Token label="useReducer.ts" />
				<Token label="formState.ts" />
			</HStack>
			<ChatMessageBubble metadata={userMetadata}>Can you review these files?</ChatMessageBubble>
		</ChatMessage>

		<ChatMessage sender="assistant" avatar={agentAvatar}>
			<ChatMessageBubble group="first">
				<Markdown density="compact" children={firstAnswer} />
			</ChatMessageBubble>
			<ChatMessageBubble group="last">
				<Markdown density="compact" children={secondAnswer} />
			</ChatMessageBubble>
			<ChatMessageBubble variant="ghost" group="middle" metadata={codeMetadata}>
				<CodeBlock code={snippet} language="tsx" />
			</ChatMessageBubble>
		</ChatMessage>

		<ChatSystemMessage>Agent shared a code snippet</ChatSystemMessage>

		<ChatMessage sender="user">
			<ChatMessageBubble metadata={closingMetadata}>That's clean, thanks!</ChatMessageBubble>
		</ChatMessage>
	</ChatMessageList>
</VStack>
