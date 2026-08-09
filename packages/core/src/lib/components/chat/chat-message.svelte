<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { ChatDensity, ChatMessageSender } from './chat-context.svelte.js';

	export interface ChatMessageProps extends BaseProps<HTMLElement> {
		sender: ChatMessageSender;
		children: Snippet;
		avatar?: Snippet;
		/**
		 * Sender name rendered above the message body. Use when the first child is
		 * raw content (not a bubble). If the first child is a `ChatMessageBubble`,
		 * put the name on the bubble's `name` prop instead — it aligns with the
		 * bubble's padding.
		 */
		name?: string | Snippet;
		/**
		 * Metadata rendered below the message body. Use when the last child is raw
		 * content (not a bubble). If the last child is a `ChatMessageBubble`, put
		 * metadata on the bubble's `metadata` prop instead.
		 */
		metadata?: string | Snippet;
		density?: ChatDensity;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { setChatMessageContext, useChatListContext } from './chat-context.svelte.js';
	import {
		chatMessageAvatarWrapAttrs,
		chatMessageChildrenAttrs,
		chatMessageContentColumnAttrs,
		chatMessageNameAttrs,
		chatMessageRootAttrs
	} from './chat-message.stylex.js';

	/**
	 * Sender context wrapper for chat messages.
	 *
	 * Publishes sender and density to child components; use
	 * `ChatMessageMetadata` as a child for timestamp, status and footer.
	 *
	 * The `astryx-chat-message` class `themeProps` stamps on the `<article>` is
	 * **load-bearing rather than cosmetic**: `useChatStreamScroll` and
	 * `useChatNewMessages` both find messages with
	 * `getElementsByClassName('astryx-chat-message')`, so the scroll-to-last and
	 * new-message detection run off it.
	 *
	 * @example
	 * ```svelte
	 * <ChatMessage sender="assistant" name="Navi" {avatar}>
	 *   <ChatMessageBubble>Hello!</ChatMessageBubble>
	 *   <ChatMessageMetadata timestamp="2:30 PM" />
	 * </ChatMessage>
	 * ```
	 */
	const {
		sender,
		children,
		avatar,
		name,
		metadata,
		density: densityProp,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: ChatMessageProps = $props();

	const t = useTranslator();
	const listContext = useChatListContext();
	const density = $derived(densityProp ?? listContext?.().density ?? 'balanced');

	setChatMessageContext(() => ({ sender, density }));

	const isSystem = $derived(sender === 'system');
	const hasAvatar = $derived(avatar != null && !isSystem);
	const hasName = $derived(name != null && !isSystem);
	const nameId = $props.id();

	const theme = $derived(themeProps('chat-message', { sender, density }));
	const root = $derived(chatMessageRootAttrs(sender, density, hasAvatar, xstyle));
	const avatarWrap = $derived(chatMessageAvatarWrapAttrs());
	const contentColumn = $derived(chatMessageContentColumnAttrs(sender));
	const nameAttrs = $derived(chatMessageNameAttrs());
	const childrenAttrs = $derived(chatMessageChildrenAttrs(sender, density));
</script>

<article
	{...rest}
	{...theme}
	aria-label={!hasName ? t('@astryx.chatMessage.messageFrom', { sender }) : undefined}
	aria-labelledby={hasName ? nameId : undefined}
	class={cx(theme.class, root.class, className)}
	style={mergeStyle(root.style, styleProp as string | undefined)}
>
	{#if hasAvatar}
		<div class={avatarWrap.class} style={avatarWrap.style}>{@render avatar?.()}</div>
	{/if}

	<div class={contentColumn.class} style={contentColumn.style}>
		{#if hasName}
			<div id={nameId} class={nameAttrs.class} style={nameAttrs.style}>
				{#if typeof name === 'function'}{@render name()}{:else}{name}{/if}
			</div>
		{/if}

		<div class={childrenAttrs.class} style={childrenAttrs.style}>
			{@render children()}
		</div>

		{#if metadata != null && !isSystem}
			<div>
				{#if typeof metadata === 'function'}{@render metadata()}{:else}{metadata}{/if}
			</div>
		{/if}
	</div>
</article>
