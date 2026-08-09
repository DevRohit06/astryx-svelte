<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type {
		ChatComposerDensity as ChatComposerDensityType,
		ChatComposerElevation as ChatComposerElevationType
	} from './chat-composer.stylex.js';

	// Aliased rather than re-exported: `export type { X }` over an imported
	// binding trips `no-import-assign`, the false positive `Calendar` records and
	// `NumberInput`/`TimeInput` already work around this way.
	export type ChatComposerDensity = ChatComposerDensityType;
	export type ChatComposerElevation = ChatComposerElevationType;

	export type ChatComposerStatus = {
		type: 'error' | 'warning';
		message?: string;
	};

	export interface ChatComposerProps extends Omit<
		BaseProps<HTMLDivElement>,
		'onchange' | 'onsubmit'
	> {
		/** Called when the user submits the message */
		onSubmit: (value: string) => void;
		/** Called when the user clicks the stop button */
		onStop?: () => void;
		/** Whether the stop button is shown instead of the send button. @default false */
		isStopShown?: boolean;
		/** Controlled value of the input */
		value?: string;
		/** Called when the input value changes */
		onChange?: (value: string) => void;
		/** Placeholder text for the input */
		placeholder?: string;
		/** Whether the composer is disabled */
		isDisabled?: boolean;
		/** Density variant */
		density?: ChatComposerDensity;
		/**
		 * Resting elevation of the composer shell.
		 * - `low` (default): a drop shadow that deepens on hover and focus.
		 * - `none`: a bordered surface instead, with inset hover/focus rings. The
		 *   border width is subtracted from the body padding, so total inset —
		 *   and therefore content geometry — is identical between the two.
		 * @default 'low'
		 */
		elevation?: ChatComposerElevation;

		// --- Slot props ---

		/** Collapsible drawer rendered above the input — attachments, context chips, etc. Use `ChatComposerDrawer`. */
		drawer?: Snippet;
		/** Actions rendered on the left side of the header (e.g. attach, mention buttons). Use icon-only `size="sm"` buttons. */
		headerActions?: Snippet;
		/** Contextual info rendered on the right side of the header (e.g. context window usage, `ProgressBar`). */
		headerContext?: Snippet;
		/** Custom input element — replaces the default `ChatComposerInput`. */
		input?: Snippet;
		/** Actions rendered on the left side of the footer. Use `size="md"` buttons to match the send button height. */
		footerActions?: Snippet;
		/** Actions rendered to the left of the send button. Use `size="md"` buttons to match the send button height. */
		sendActions?: Snippet;
		/** Custom send button — replaces the default */
		sendButton?: Snippet;
		/** Status message rendered below (or above) the composer body */
		status?: ChatComposerStatus;
		/** Where to render the status. @default 'bottom' */
		statusPosition?: 'top' | 'bottom';
	}
</script>

<script lang="ts">
	import Icon from '../icon/icon.svelte';
	import ChatComposerInput from './chat-composer-input.svelte';
	import ChatSendButton from './chat-send-button.svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { setChatComposerContext } from './chat-context.svelte.js';
	import type { ChatComposerInputControl } from './chat-context.svelte.js';
	import {
		chatComposerBodyAttrs,
		chatComposerFooterAttrs,
		chatComposerFooterLeftAttrs,
		chatComposerFooterRightAttrs,
		chatComposerHeaderAttrs,
		chatComposerHeaderLeftAttrs,
		chatComposerHeaderRightAttrs,
		chatComposerInputAreaAttrs,
		chatComposerRootAttrs,
		chatComposerStatusBarAttrs
	} from './chat-composer.stylex.js';

	/**
	 * Layout shell for a chat composer, with slots for a drawer, the input,
	 * header/footer actions and a send button.
	 *
	 * Everything the sub-components need — the value, the submit handler,
	 * `canSend`, the stop state — travels through `ChatComposerContext`, which is
	 * why `<ChatComposerInput />` and `<ChatSendButton />` take no props when the
	 * defaults are used.
	 *
	 * `xstyle` lands on the **body**, not the root: that is upstream's placement,
	 * and it is what makes an `xstyle` padding override interact with the
	 * `--_chat-composer-padding` var the root sets.
	 *
	 * @example
	 * ```svelte
	 * <ChatComposer onSubmit={(value) => console.log(value)} placeholder="Type a message..." />
	 * ```
	 */
	const {
		onSubmit,
		onStop,
		isStopShown = false,
		value: controlledValue,
		onChange,
		placeholder: placeholderFromProps,
		isDisabled = false,
		density = 'balanced',
		elevation = 'low',
		drawer,
		headerActions,
		headerContext,
		input,
		footerActions,
		sendActions,
		sendButton,
		status,
		statusPosition = 'bottom',
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: ChatComposerProps = $props();

	const t = useTranslator();
	const placeholder = $derived(placeholderFromProps ?? t('@astryx.chat.composer.placeholder'));

	let internalValue = $state('');

	const isControlled = $derived(controlledValue !== undefined);
	const currentValue = $derived(isControlled ? controlledValue! : internalValue);

	function updateValue(newValue: string): void {
		if (!isControlled) {
			internalValue = newValue;
		}
		onChange?.(newValue);
	}

	function handleSubmit(): void {
		const trimmed = currentValue.trim();
		if (!trimmed || isDisabled) {
			return;
		}
		onSubmit(trimmed);
		updateValue('');
	}

	const canSend = $derived(currentValue.trim().length > 0 && !isDisabled);

	let bodyEl: HTMLDivElement | null = $state(null);

	// The input slot registers its focus (and future) control here, so the shell
	// can drive it without knowing the input's DOM shape. A plain `let` rather
	// than `$state`: it is only ever read from a click handler, so nothing needs
	// to re-render when it changes — upstream's `useRef` says the same thing.
	let inputControl: ChatComposerInputControl | null = null;

	function registerInputControl(control: ChatComposerInputControl | null): void {
		inputControl = control;
	}

	function handleBodyClick(e: MouseEvent): void {
		// Focus the input when clicking empty space in the body.
		// Skip if the click target is a button, link, or interactive element.
		const target = e.target as HTMLElement;
		if (
			target.closest('button, a, [role="button"], [contenteditable="true"], [data-astryx-token]')
		) {
			return;
		}
		// Prefer the input's registered control (works for any input shape,
		// including editors whose focusable node isn't a bare
		// contenteditable/textarea). Fall back to a DOM query so uninstrumented
		// custom inputs still get click-to-focus.
		if (inputControl) {
			inputControl.focus();
			return;
		}
		const editable = bodyEl?.querySelector<HTMLElement>('[contenteditable="true"], textarea');
		editable?.focus();
	}

	setChatComposerContext(() => ({
		value: currentValue,
		onChange: updateValue,
		onSubmit: handleSubmit,
		placeholder,
		isDisabled,
		isStopShown,
		canSend,
		onStop,
		inputControlRef: registerInputControl
	}));

	const theme = $derived(themeProps('chat-composer', { density }));
	const root = $derived(chatComposerRootAttrs(isDisabled));
	const body = $derived(chatComposerBodyAttrs(density, elevation, xstyle));
	const header = $derived(chatComposerHeaderAttrs());
	const headerLeft = $derived(chatComposerHeaderLeftAttrs());
	const headerRight = $derived(chatComposerHeaderRightAttrs());
	const inputArea = $derived(chatComposerInputAreaAttrs());
	const footer = $derived(chatComposerFooterAttrs());
	const footerLeft = $derived(chatComposerFooterLeftAttrs());
	const footerRight = $derived(chatComposerFooterRightAttrs());
	const statusBar = $derived(
		status ? chatComposerStatusBarAttrs(statusPosition, status.type) : null
	);
</script>

{#snippet statusEl()}
	{#if status && statusBar}
		<div
			role={status.type === 'error' ? 'alert' : 'status'}
			class={statusBar.class}
			style={statusBar.style}
		>
			<Icon
				icon={status.type === 'error' ? 'error' : 'warning'}
				size="md"
				color={status.type === 'error' ? 'error' : 'warning'}
			/>
			{status.message ?? ''}
		</div>
	{/if}
{/snippet}

<div
	{...rest}
	{...theme}
	class={cx(theme.class, root.class, className)}
	style={mergeStyle(root.style, styleProp as string | undefined)}
>
	{#if statusPosition === 'top'}
		{@render statusEl()}
	{/if}
	{@render drawer?.()}

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div bind:this={bodyEl} onclick={handleBodyClick} class={body.class} style={body.style}>
		{#if headerActions || headerContext}
			<div class={header.class} style={header.style}>
				<div class={headerLeft.class} style={headerLeft.style}>{@render headerActions?.()}</div>
				<div class={headerRight.class} style={headerRight.style}>{@render headerContext?.()}</div>
			</div>
		{/if}

		<div class={inputArea.class} style={inputArea.style}>
			{#if input}
				{@render input()}
			{:else}
				<ChatComposerInput />
			{/if}
		</div>

		<div class={footer.class} style={footer.style}>
			<div class={footerLeft.class} style={footerLeft.style}>{@render footerActions?.()}</div>
			<div class={footerRight.class} style={footerRight.style}>
				{@render sendActions?.()}
				{#if sendButton}
					{@render sendButton()}
				{:else}
					<ChatSendButton />
				{/if}
			</div>
		</div>
	</div>

	{#if statusPosition === 'bottom'}
		{@render statusEl()}
	{/if}
</div>
