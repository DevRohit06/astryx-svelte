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
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import {
		scrollButtonContainerAttrs,
		scrollButtonStyle,
		scrollButtonWrapperAttrs
	} from './chat-layout-scroll-button.stylex.js';

	/**
	 * Floating scroll-to-bottom button for use inside `ChatLayout`.
	 *
	 * The wrapper carries the `astryx-chat-layout-scroll-button` theme target.
	 * Through 0.3.0 it carried only its compiled StyleX class and this comment
	 * said so; #4634 gave the three chat buttons targets of their own.
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

	// Constant — the target takes no visual props, so there is nothing to track.
	const theme = themeProps('chat-layout-scroll-button');
	const wrapper = $derived(scrollButtonWrapperAttrs(xstyle));
	const container = $derived(scrollButtonContainerAttrs(isVisible, Boolean(label)));
</script>

{#snippet chevron()}
	<Icon icon="chevronDown" size="md" />
{/snippet}

{#snippet labelText()}{label}{/snippet}

<div
	{...rest}
	{...theme}
	class={cx(theme.class, wrapper.class, className)}
	style={mergeStyle(wrapper.style, styleProp as string | undefined)}
>
	<div class={container.class} style={container.style}>
		<!--
			`isIconOnly` only when there is no label (#4854). Without it the button
			keeps icon-only sizing while rendering visible text, so the label is
			clipped by a box measured for a glyph.
		-->
		<Button
			label={buttonLabel}
			aria-label={buttonLabel}
			icon={chevron}
			variant="ghost"
			size="md"
			isIconOnly={!label}
			onclick={onClick}
			xstyle={scrollButtonStyle(Boolean(label))}
			children={label ? labelText : undefined}
		/>
	</div>
</div>
