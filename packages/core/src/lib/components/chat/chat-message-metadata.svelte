<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { IconName } from '../icon/icon-registry.js';
	import type { ChatMessageStatus as ChatMessageStatusType } from './chat-message-metadata.stylex.js';

	// Aliased rather than re-exported: `export type { X }` over an imported
	// binding trips `no-import-assign`, the false positive `Calendar` records and
	// `NumberInput`/`TimeInput` already work around this way.
	export type ChatMessageStatus = ChatMessageStatusType;

	export interface ChatMessageMetadataProps extends BaseProps<HTMLDivElement> {
		/** Timestamp content — a string, or a snippet (e.g. a `Timestamp`). */
		timestamp?: string | Snippet;
		/** Footer content — model info, ratings, reactions. */
		footer?: string | Snippet;
		/** Message delivery status. */
		status?: ChatMessageStatus;
	}

	const STATUS_CONFIG: Record<ChatMessageStatus, { icon: IconName; i18nKey: string }> = {
		sending: { icon: 'clock', i18nKey: '@astryx.chat.status.sending' },
		sent: { icon: 'check', i18nKey: '@astryx.chat.status.sent' },
		delivered: { icon: 'checkDouble', i18nKey: '@astryx.chat.status.delivered' },
		read: { icon: 'checkDouble', i18nKey: '@astryx.chat.status.read' },
		error: { icon: 'error', i18nKey: '@astryx.chat.status.failed' }
	};
</script>

<script lang="ts">
	import Icon from '../icon/icon.svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useChatMessageContext } from './chat-context.svelte.js';
	import {
		chatMessageMetadataAttrs,
		chatMessageStatusRowAttrs
	} from './chat-message-metadata.stylex.js';

	/**
	 * Composable metadata row for chat messages: timestamp · footer · status.
	 * Renders nothing when all three are absent.
	 *
	 * `timestamp` and `footer` are `string | Snippet`, the port's settled leaf-slot
	 * shape — upstream types both `ReactNode`, and its own examples pass a
	 * `<Timestamp>` to one and a bare string to the other.
	 *
	 * @example
	 * ```svelte
	 * <ChatMessage sender="user">
	 *   <ChatMessageBubble>Hello!</ChatMessageBubble>
	 *   <ChatMessageMetadata timestamp={sent} status="read" />
	 * </ChatMessage>
	 * ```
	 */
	const {
		timestamp,
		footer,
		status,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: ChatMessageMetadataProps = $props();

	const t = useTranslator();
	const msgContext = useChatMessageContext();
	const sender = $derived(msgContext?.().sender ?? 'assistant');

	const statusConfig = $derived(status != null ? STATUS_CONFIG[status] : null);
	const statusLabel = $derived(statusConfig != null ? t(statusConfig.i18nKey) : '');

	const hasContent = $derived(timestamp != null || footer != null || statusConfig != null);

	const attrs = $derived(chatMessageMetadataAttrs(sender, xstyle));
	const theme = $derived(themeProps('chat-message-metadata'));
	const statusRow = $derived(status != null ? chatMessageStatusRowAttrs(status) : null);
</script>

{#if hasContent}
	<div
		{...rest}
		{...theme}
		class={cx(theme.class, attrs.class, className)}
		style={mergeStyle(attrs.style, styleProp as string | undefined)}
	>
		{#if timestamp != null}
			<span
				>{#if typeof timestamp === 'function'}{@render timestamp()}{:else}{timestamp}{/if}</span
			>
		{/if}
		{#if timestamp != null && (footer != null || statusConfig != null)}
			<span>·</span>
		{/if}
		{#if footer != null}
			{#if typeof footer === 'function'}{@render footer()}{:else}{footer}{/if}
		{/if}
		{#if footer != null && statusConfig != null}
			<span>·</span>
		{/if}
		{#if statusConfig != null && statusRow != null}
			<span
				title={statusLabel}
				aria-label={t('@astryx.chat.messageAriaLabel', {
					status: statusLabel.toLowerCase()
				})}
				class={statusRow.class}
				style={statusRow.style}
			>
				<Icon icon={statusConfig.icon} size="xsm" color="inherit" />
				<span>{statusLabel}</span>
			</span>
		{/if}
	</div>
{/if}
