<script lang="ts">
	import type { ChatToolCallItem } from '$lib/components/chat/chat-tool-calls.svelte';
	import ChatToolCalls from '$lib/components/chat/chat-tool-calls.svelte';

	/**
	 * `ChatToolCalls` with an optional `resultDetail` snippet on the last call.
	 *
	 * `resultDetail` is `string | Snippet` here where upstream types it
	 * `ReactNode`; the one upstream case that uses it passes an element, so the
	 * snippet branch is the one worth exercising and it needs a component to
	 * author it in.
	 */
	interface Props {
		calls: ChatToolCallItem[];
		/** Text rendered inside a `resultDetail` snippet on the first call. */
		detailText?: string;
		defaultIsExpanded?: boolean;
	}

	const { calls, detailText, defaultIsExpanded }: Props = $props();

	const withDetail = $derived(
		detailText == null
			? calls
			: calls.map((call, i) => (i === 0 ? { ...call, resultDetail } : call))
	);
</script>

{#snippet resultDetail()}
	<div>{detailText}</div>
{/snippet}

<ChatToolCalls calls={withDetail} {defaultIsExpanded} />
