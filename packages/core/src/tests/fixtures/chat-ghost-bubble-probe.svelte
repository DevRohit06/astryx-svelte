<script lang="ts">
	import type { ChatDensity } from '$lib/components/chat/chat-context.svelte.js';
	import type { SizeValue } from '$lib/internal/types.js';
	import ChatMessage from '$lib/components/chat/chat-message.svelte';
	import ChatMessageBubble from '$lib/components/chat/chat-message-bubble.svelte';

	/**
	 * The `ghost` / `width` compositions upstream's `ChatMessageBubble.test.tsx`
	 * writes inline, added at 0.4.2 with #2574.
	 *
	 * Separate from `chat-message-probe.svelte` because these cases need *several*
	 * bubbles in one message — a named one to take the inset from, optionally a
	 * raw child, and the ghost under test — where that probe renders at most one.
	 */
	interface Props {
		density?: ChatDensity;
		/** Render a named bubble, whose name slot is the alignment reference. */
		name?: string;
		/** Render a raw, unwrapped child — the misalignment repro from the issue. */
		hasRawChild?: boolean;
		/** Render a `variant="ghost"` bubble carrying this `data-testid`. */
		ghostTestId?: string;
		/** `width` for the ghost bubble. */
		ghostWidth?: SizeValue;
		/** Render a default (capped) bubble carrying this `data-testid`. */
		cappedTestId?: string;
		/** `width` for the capped bubble, so a non-ghost width can be checked too. */
		cappedWidth?: SizeValue;
	}

	const {
		density,
		name,
		hasRawChild = false,
		ghostTestId,
		ghostWidth,
		cappedTestId,
		cappedWidth
	}: Props = $props();
</script>

<ChatMessage sender="assistant" {density}>
	{#if name}
		<ChatMessageBubble {name}>Hello</ChatMessageBubble>
	{/if}
	{#if hasRawChild}
		<div data-testid="raw">Artifact card</div>
	{/if}
	{#if cappedTestId}
		<ChatMessageBubble data-testid={cappedTestId} width={cappedWidth}>Text</ChatMessageBubble>
	{/if}
	{#if ghostTestId}
		<ChatMessageBubble variant="ghost" data-testid={ghostTestId} width={ghostWidth}>
			Artifact card
		</ChatMessageBubble>
	{/if}
</ChatMessage>
