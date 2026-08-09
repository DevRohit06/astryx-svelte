<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export type ChatSystemMessageVariant = 'default' | 'divider';

	export interface ChatSystemMessageProps extends BaseProps<HTMLDivElement> {
		/** System message content — text, or a snippet for markup. */
		children: string | Snippet;

		/**
		 * Visual variant.
		 * - `'default'`: plain centred text
		 * - `'divider'`: text with horizontal lines on each side (date separator)
		 * @default 'default'
		 */
		variant?: ChatSystemMessageVariant;

		/** Optional icon rendered before the text — typically an `Icon`. */
		icon?: Snippet;
	}
</script>

<script lang="ts">
	import Divider from '../divider/divider.svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import {
		chatSystemMessageContentAttrs,
		chatSystemMessageDividerWrapAttrs,
		chatSystemMessageIconAttrs,
		chatSystemMessageRootAttrs
	} from './chat-system-message.stylex.js';

	/**
	 * Centred system message for chat threads.
	 *
	 * Use for non-sender content: date separators, "conversation started", "user
	 * joined", status changes. The `divider` variant draws horizontal lines on
	 * each side of the text.
	 *
	 * `children` is `string | Snippet` because the `divider` branch hands it
	 * straight to `Divider.label`, which takes exactly that pair — so the two
	 * slots agree rather than the outer one being wider than what it feeds.
	 *
	 * @example
	 * ```svelte
	 * <ChatSystemMessage>Conversation started</ChatSystemMessage>
	 * <ChatSystemMessage variant="divider">Today</ChatSystemMessage>
	 * ```
	 */
	const {
		children,
		variant = 'default',
		icon,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: ChatSystemMessageProps = $props();

	const theme = $derived(themeProps('chat-system-message', { variant }));
	const dividerWrap = $derived(chatSystemMessageDividerWrapAttrs(xstyle));
	const root = $derived(chatSystemMessageRootAttrs(xstyle));
	const content = $derived(chatSystemMessageContentAttrs());
	const iconAttrs = $derived(chatSystemMessageIconAttrs());
</script>

{#if variant === 'divider'}
	<div
		{...rest}
		{...theme}
		class={cx(theme.class, dividerWrap.class, className)}
		style={mergeStyle(dividerWrap.style, styleProp as string | undefined)}
		role="status"
	>
		<Divider label={children} />
	</div>
{:else}
	<div
		{...rest}
		{...theme}
		class={cx(theme.class, root.class, className)}
		style={mergeStyle(root.style, styleProp as string | undefined)}
		role="status"
	>
		<span class={content.class} style={content.style}>
			{#if icon != null}
				<span class={iconAttrs.class} style={iconAttrs.style}>{@render icon()}</span>
			{/if}
			{#if typeof children === 'function'}{@render children()}{:else}{children}{/if}
		</span>
	</div>
{/if}
