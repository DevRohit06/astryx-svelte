<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type {
		ChatMessageBubbleGroup,
		ChatMessageBubbleVariant as ChatMessageBubbleVariantType
	} from './chat-message-bubble.stylex.js';

	// Aliased rather than re-exported: `export type { X }` over an imported
	// binding trips `no-import-assign`, the false positive `Calendar` records and
	// `NumberInput`/`TimeInput` already work around this way.
	export type ChatMessageBubbleVariant = ChatMessageBubbleVariantType;

	export interface ChatMessageBubbleProps extends BaseProps<HTMLDivElement> {
		/** Bubble content — text, `Markdown`, or any markup. */
		children: Snippet;

		/**
		 * Visual variant.
		 * - `'filled'`: background colour based on sender (default)
		 * - `'ghost'`: no background, but keeps padding for consistent alignment
		 * @default 'filled'
		 */
		variant?: ChatMessageBubbleVariant;

		/**
		 * Sender name rendered above the bubble, aligned with bubble text padding.
		 * Use when the first content in a message is a bubble. If the first
		 * content is raw (no bubble), use `ChatMessage`'s `name` prop instead.
		 */
		name?: string | Snippet;

		/**
		 * Metadata content rendered below the bubble, aligned with bubble text
		 * padding. Use when the last content in a message is a bubble. If the last
		 * content is raw (no bubble), use `ChatMessage`'s `metadata` prop instead.
		 */
		metadata?: string | Snippet;

		/**
		 * Position within a multi-bubble group. Controls corner radius reduction
		 * on the sender side.
		 * - `'first'`: bottom sender-side corner tightened
		 * - `'middle'`: both sender-side corners tightened
		 * - `'last'`: top sender-side corner tightened
		 *
		 * Leave unset for standalone bubbles (full radius).
		 */
		group?: ChatMessageBubbleGroup;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useChatMessageContext } from './chat-context.svelte.js';
	import {
		chatMessageBubbleContentAttrs,
		chatMessageBubbleMetadataAttrs,
		chatMessageBubbleNameAttrs
	} from './chat-message-bubble.stylex.js';

	/**
	 * Styled content container — the chat "bubble".
	 *
	 * Reads sender and density from the parent `ChatMessage` context to style the
	 * background; `group` tightens the sender-side corners in a multi-bubble run.
	 *
	 * Upstream returns a **fragment** of three siblings (name row, bubble,
	 * metadata row) so all three are direct children of `ChatMessage`'s flex
	 * column and share its alignment. A Svelte component's template is already a
	 * fragment, so the three elements sit at the top level here with no wrapper —
	 * the one place the translation would have been tempted to add a `<div>` and
	 * would have broken the alignment by doing so.
	 *
	 * @example
	 * ```svelte
	 * <ChatMessage sender="user">
	 *   <ChatMessageBubble name="Cindy" metadata={sentAt}>
	 *     Hey, how's it going?
	 *   </ChatMessageBubble>
	 * </ChatMessage>
	 * ```
	 */
	const {
		children,
		variant = 'filled',
		name,
		metadata,
		group,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: ChatMessageBubbleProps = $props();

	const msgContext = useChatMessageContext();
	const sender = $derived(msgContext?.().sender ?? 'assistant');
	const density = $derived(msgContext?.().density ?? 'balanced');
	const isUser = $derived(sender === 'user');

	const theme = $derived(themeProps('chat-message-bubble', { sender, variant, density }));
	const content = $derived(chatMessageBubbleContentAttrs(sender, density, variant, group, xstyle));
	const nameAttrs = $derived(chatMessageBubbleNameAttrs(density, isUser));
	const metadataAttrs = $derived(chatMessageBubbleMetadataAttrs(density, isUser));
</script>

{#if name}
	<div data-chat-name class={nameAttrs.class} style={nameAttrs.style}>
		{#if typeof name === 'function'}{@render name()}{:else}{name}{/if}
	</div>
{/if}
<div
	{...rest}
	{...theme}
	class={cx(theme.class, content.class, className)}
	style={mergeStyle(content.style, styleProp as string | undefined)}
>
	{@render children()}
</div>
{#if metadata}
	<div class={metadataAttrs.class} style={metadataAttrs.style}>
		{#if typeof metadata === 'function'}{@render metadata()}{:else}{metadata}{/if}
	</div>
{/if}
