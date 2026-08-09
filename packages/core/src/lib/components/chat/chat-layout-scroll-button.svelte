<script lang="ts" module>
	import type { BaseProps } from '../../base-props.js';

	export interface ChatLayoutScrollButtonProps extends Omit<BaseProps<HTMLDivElement>, 'onclick'> {
		/** Whether the button is visible. */
		isVisible: boolean;
		/** Optional label — expands the button (e.g. "New messages"). */
		label?: string;
		/** Click handler. */
		onClick: () => void;
	}
</script>

<script lang="ts">
	import Button from '../button/button.svelte';
	import Icon from '../icon/icon.svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import {
		scrollButtonContainerAttrs,
		scrollButtonStyle,
		scrollButtonWrapperAttrs
	} from './chat-layout-scroll-button.stylex.js';

	/**
	 * Floating scroll-to-bottom button for use inside `ChatLayout`.
	 *
	 * This is one of the few components upstream stamps **no `themeProps`** on —
	 * the wrapper carries only its compiled StyleX class — so there is no
	 * `astryx-chat-layout-scroll-button` class here either.
	 *
	 * @example
	 * ```svelte
	 * <ChatLayoutScrollButton isVisible={!isAtBottom} onClick={scrollToBottom} />
	 * ```
	 */
	const {
		isVisible,
		label,
		onClick,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: ChatLayoutScrollButtonProps = $props();

	const t = useTranslator();
	const buttonLabel = $derived(label ?? t('@astryx.chatLayoutScrollButton.scrollToBottom'));

	const wrapper = $derived(scrollButtonWrapperAttrs(xstyle));
	const container = $derived(scrollButtonContainerAttrs(isVisible, Boolean(label)));
</script>

{#snippet chevron()}
	<Icon icon="chevronDown" size="md" />
{/snippet}

{#snippet labelText()}{label}{/snippet}

<div
	{...rest}
	class={cx(wrapper.class, className)}
	style={mergeStyle(wrapper.style, styleProp as string | undefined)}
>
	<div class={container.class} style={container.style}>
		<Button
			label={buttonLabel}
			aria-label={buttonLabel}
			icon={chevron}
			variant="ghost"
			size="md"
			onclick={onClick}
			xstyle={scrollButtonStyle(Boolean(label))}
			children={label ? labelText : undefined}
		/>
	</div>
</div>
