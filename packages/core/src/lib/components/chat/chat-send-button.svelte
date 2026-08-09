<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface ChatSendButtonProps extends BaseProps<HTMLButtonElement> {
		/** Whether the stop button is shown instead of the send button. @default false */
		isStopShown?: boolean;
		/** Whether the send button is disabled. Defaults to `!canSend` from context. */
		isDisabled?: boolean;
		/** Called when the user clicks the send button. Defaults to context onSubmit. */
		onSend?: () => void;
		/** Called when the user clicks the stop button. */
		onStop?: () => void;
		/** Icon for the send state. Resolves from the icon registry by default. */
		sendIcon?: Snippet;
		/** Icon for the stop state. Resolves from the icon registry by default. */
		stopIcon?: Snippet;
		/** Button size. @default 'md' */
		size?: 'sm' | 'md';
	}
</script>

<script lang="ts">
	import Button, { type ButtonProps } from '../button/button.svelte';
	import { useIcon } from '../icon/use-icon.svelte.js';
	import { useChatComposerContext } from './chat-context.svelte.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { cx } from '../../internal/sx.js';
	import { chatSendButtonStyle } from './chat-send-button.stylex.js';

	/**
	 * Circular send/stop toggle button for the chat composer.
	 *
	 * Reads state from `ChatComposerContext` by default so it "just works"
	 * inside `ChatComposer`; every context-derived value can be overridden via
	 * props for standalone use.
	 *
	 * - **Send** — accent/primary, `arrowUp` icon, disabled when nothing to send.
	 * - **Stop** — neutral/secondary, `stop` icon, calls `onStop`.
	 *
	 * 0.1.9 closed the widest of this port's closed-prop-list roots: upstream used
	 * to destructure a closed list and never rest-spread, dropping `id`/`role`/
	 * `aria-*`/handlers — and even `class`/`style`/`data-testid` — that its
	 * `BaseProps<HTMLButtonElement>` promises. It forwards them all now, so the
	 * divergence ends and the rest spread moves to upstream's position: **after**
	 * the component's own `label`/`variant`/`icon`/`onclick`, which a consumer's
	 * rest therefore overrides. That is a deliberate reversal of what this port
	 * did while upstream dropped rest entirely.
	 */
	const {
		isStopShown: isStopShownProp,
		isDisabled: isDisabledProp,
		onSend,
		onStop: onStopProp,
		sendIcon,
		stopIcon,
		size = 'md',
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: ChatSendButtonProps = $props();

	const t = useTranslator();
	const context = useChatComposerContext();

	const ctx = $derived(context?.() ?? null);
	const isStopShown = $derived(isStopShownProp ?? ctx?.isStopShown ?? false);
	const isDisabled = $derived(isDisabledProp ?? !(ctx?.canSend ?? false));
	const onStop = $derived(onStopProp ?? ctx?.onStop);

	// Upstream's `onSend ?? (() => context?.onSubmit(''))` — the empty string is
	// deliberate: the composer owns the value, so the button only signals intent.
	const handleSend = $derived(onSend ?? (() => ctx?.onSubmit('')));

	const theme = themeProps('chat-send-button');
	const defaultStopIcon = useIcon(() => 'stop');
	const defaultSendIcon = useIcon(() => 'arrowUp');
	const icon = $derived(
		isStopShown ? (stopIcon ?? defaultStopIcon.current) : (sendIcon ?? defaultSendIcon.current)
	);
</script>

<!--
	`rest` is typed off `BaseProps<HTMLButtonElement>` while `ButtonProps` takes
	the *intersection* of the button and anchor attribute sets, which makes every
	event handler contravariantly incompatible — the same clash `Timestamp`
	records against `Text`. The cast is `SideNavCollapseButton`'s, for the same
	reason: the values are button attributes either way, and only the declared
	element type differs.

	The `class` is `cx(theme.class, className)` where upstream writes
	`{...themeProps('chat-send-button')} className={className}`. Those are not the
	same thing: a later key wins in an object literal even when its value is
	`undefined`, so upstream's own theme class is replaced by the consumer's
	`className` — or by nothing at all, which is the usual case. Verified against
	the shipped 0.2.0 dist, not just the source. Documented under Known debts and
	**not** replicated: it would silently retire the `astryx-chat-send-button`
	theme target that `defineTheme` still advertises.
-->
<Button
	label={isStopShown ? t('@astryx.chatSendButton.stop') : t('@astryx.chatSendButton.send')}
	variant={isStopShown ? 'secondary' : 'primary'}
	{size}
	{icon}
	isIconOnly
	isDisabled={!isStopShown && isDisabled}
	onclick={isStopShown ? onStop : handleSend}
	{...rest as Partial<ButtonProps>}
	{...theme}
	class={cx(theme.class, className)}
	style={styleProp as string | undefined}
	xstyle={chatSendButtonStyle(xstyle)}
/>
