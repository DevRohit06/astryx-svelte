<script lang="ts">
	import type { ChatDensity } from '$lib/components/chat/chat-context.svelte.js';
	import ChatLayout from '$lib/components/chat/chat-layout.svelte';
	import ChatMessage from '$lib/components/chat/chat-message.svelte';
	import ChatMessageBubble from '$lib/components/chat/chat-message-bubble.svelte';
	import ChatMessageList from '$lib/components/chat/chat-message-list.svelte';

	/**
	 * `ChatLayout` with a message list that can start empty and grow.
	 *
	 * Covers both shapes the upstream suites need: the layout on its own with
	 * text or a custom scroll button, and the end-to-end "conditional
	 * `ChatMessageList`" harness from `useChatNewMessages.test.tsx`, where the
	 * list mounts only once a message exists.
	 */
	interface Props {
		/** Plain text rendered as the layout's children instead of a message list. */
		text?: string;
		emptyStateText?: string;
		density?: ChatDensity;
		/** How many `msg-N` messages to start with. `undefined` uses `text` instead. */
		initialMessages?: number;
		/** `'custom'` renders a button; `'none'` passes `null`; omit for the default. */
		scrollButton?: 'custom' | 'none';
		/**
		 * Height of a spacer inside the message list. The scroll cases need the
		 * layout root to *actually* overflow — Chromium clamps a `scrollTop` write
		 * on an element that does not, where jsdom accepts it — so the content is
		 * given real height rather than a defined `scrollHeight`.
		 */
		contentHeight?: number;
		/**
		 * Wraps the layout in a plain 400px scroll box and passes it as `scrollRef`.
		 *
		 * The self-scrolling root cannot serve the first-fill cases in a real
		 * browser: its message area is `min-height: 100%`, so the root overflows its
		 * own height by a fixed ~98px the moment it mounts, and the mount jump
		 * consumes the pending first fill before the case can. jsdom never computes
		 * that. Handing the layout an external container — a mode it supports and
		 * documents — puts the geometry back under the test's control while leaving
		 * the scroll logic under test untouched.
		 */
		externalScroller?: boolean;
		rest?: Record<string, unknown>;
	}

	const {
		text,
		emptyStateText,
		density,
		initialMessages,
		scrollButton,
		contentHeight: initialContentHeight,
		externalScroller = false,
		rest = {}
	}: Props = $props();

	let scroller: HTMLDivElement | null = $state(null);

	let messages = $state<string[]>(
		Array.from({ length: initialMessages ?? 0 }, (_, i) => `msg-${i}`)
	);
	let contentHeight = $state(initialContentHeight);

	const hasList = $derived(initialMessages != null);
	const showChildren = $derived(hasList ? messages.length > 0 : text != null);

	export function setContentHeight(px: number): void {
		contentHeight = px;
	}
</script>

{#snippet composer()}
	<div data-testid="composer">composer</div>
{/snippet}

{#snippet emptyState()}
	<div>{emptyStateText}</div>
{/snippet}

{#snippet customScrollButton()}
	<button type="button">Scroll down</button>
{/snippet}

{#snippet children()}
	{#if hasList}
		<ChatMessageList>
			{#each messages as msg (msg)}
				<ChatMessage sender="assistant">
					<ChatMessageBubble>{msg}</ChatMessageBubble>
				</ChatMessage>
			{/each}
			{#if contentHeight != null}
				<div data-testid="spacer" style="height: {contentHeight}px"></div>
			{/if}
		</ChatMessageList>
	{:else}
		<div>{text}</div>
	{/if}
{/snippet}

<button
	type="button"
	data-testid="add-message"
	onclick={() => (messages = [...messages, `msg-${messages.length}`])}
>
	Add
</button>

{#snippet layout()}
	<ChatLayout
		{...rest}
		{composer}
		{density}
		scrollRef={externalScroller ? () => scroller : undefined}
		children={showChildren ? children : undefined}
		emptyState={emptyStateText != null ? emptyState : undefined}
		scrollButton={scrollButton === 'custom'
			? customScrollButton
			: scrollButton === 'none'
				? null
				: undefined}
	/>
{/snippet}

{#if externalScroller}
	<div
		bind:this={scroller}
		data-testid="scroller"
		style="overflow-y: auto; height: 400px; margin: 0; padding: 0"
	>
		{@render layout()}
	</div>
{:else}
	{@render layout()}
{/if}
