<script lang="ts">
	import type { ChatDensity, ChatMessageSender } from '$lib/components/chat/chat-context.svelte.js';
	import type { ChatMessageStatus } from '$lib/components/chat/chat-message-metadata.svelte';
	import ChatMessage from '$lib/components/chat/chat-message.svelte';
	import ChatMessageBubble from '$lib/components/chat/chat-message-bubble.svelte';
	import ChatMessageList from '$lib/components/chat/chat-message-list.svelte';
	import ChatMessageMetadata from '$lib/components/chat/chat-message-metadata.svelte';

	/**
	 * The `ChatMessage` compositions the upstream suites write inline as JSX.
	 *
	 * React's tests nest four components in a literal; a Svelte snippet only
	 * exists inside a template, so the nesting has to live in a component. One
	 * fixture covers the family because every case is the same shape with parts
	 * switched off: an optional `ChatMessageList` wrapper for density, a
	 * `ChatMessage`, and either a bubble, a metadata row, or raw content.
	 */
	interface Props {
		sender?: ChatMessageSender;
		name?: string;
		/** Renders an avatar slot carrying `data-testid="avatar"`. */
		hasAvatar?: boolean;
		/** Wraps the message in a `ChatMessageList` at this density. */
		listDensity?: ChatDensity;
		/** Bubble text. Omit to render no bubble. */
		text?: string;
		/** Renders raw (non-bubble) content carrying `data-testid="custom-content"`. */
		customContent?: string;
		/** Renders a `ChatMessageMetadata` with these props. */
		metadata?: { timestamp?: string; status?: ChatMessageStatus; footer?: string };
		/** Rest props for the `ChatMessage`. */
		rest?: Record<string, unknown>;
		/** Rest props for the `ChatMessageBubble`. */
		bubbleRest?: Record<string, unknown>;
	}

	const {
		sender = 'assistant',
		name,
		hasAvatar = false,
		listDensity,
		text,
		customContent,
		metadata,
		rest = {},
		bubbleRest = {}
	}: Props = $props();
</script>

{#snippet avatar()}
	<div data-testid="avatar">A</div>
{/snippet}

{#snippet footer()}
	<span>{metadata?.footer}</span>
{/snippet}

{#snippet message()}
	<ChatMessage {...rest} {sender} {name} avatar={hasAvatar ? avatar : undefined}>
		{#if text != null}
			<ChatMessageBubble {...bubbleRest}>{text}</ChatMessageBubble>
		{/if}
		{#if customContent != null}
			<div data-testid="custom-content">{customContent}</div>
		{/if}
		{#if metadata != null}
			<ChatMessageMetadata
				timestamp={metadata.timestamp}
				status={metadata.status}
				footer={metadata.footer != null ? footer : undefined}
			/>
		{/if}
	</ChatMessage>
{/snippet}

{#if listDensity != null}
	<ChatMessageList density={listDensity}>
		{@render message()}
	</ChatMessageList>
{:else}
	{@render message()}
{/if}
