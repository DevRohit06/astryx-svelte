<script lang="ts">
	import type { ChatDensity } from '$lib/components/chat/chat-context.svelte.js';
	import type { SpacingStep } from '$lib/internal/types.js';
	import ChatMessageList from '$lib/components/chat/chat-message-list.svelte';

	/**
	 * `ChatMessageList` with plain content, the empty state, or neither.
	 *
	 * Upstream's empty-state case passes `{[]}` — children present that render
	 * nothing. A `Snippet` has no such value, so `hasChildren={false}` (omitting
	 * the prop) is the port's spelling of it, and the component documents the
	 * difference.
	 */
	interface Props {
		hasChildren?: boolean;
		emptyStateText?: string;
		density?: ChatDensity;
		gap?: SpacingStep;
		isStreaming?: boolean;
		rest?: Record<string, unknown>;
	}

	const {
		hasChildren = true,
		emptyStateText,
		density,
		gap,
		isStreaming,
		rest = {}
	}: Props = $props();
</script>

{#snippet children()}
	<div>msg</div>
{/snippet}

{#snippet emptyState()}
	<div>{emptyStateText}</div>
{/snippet}

<ChatMessageList
	{...rest}
	{density}
	{gap}
	{isStreaming}
	children={hasChildren ? children : undefined}
	emptyState={emptyStateText != null ? emptyState : undefined}
/>
