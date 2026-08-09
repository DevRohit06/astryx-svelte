<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface CommandPaletteInputProps extends Omit<
		BaseProps<HTMLInputElement>,
		'onchange' | 'oninput'
	> {
		/**
		 * The current search value.
		 * When omitted inside CommandPalette, reads from context.
		 */
		value?: string;

		/**
		 * Called when the search value changes.
		 * When omitted inside CommandPalette, writes to context.
		 */
		onValueChange?: (value: string) => void;

		/**
		 * Placeholder text for the input.
		 * @default 'Search...'
		 */
		placeholder?: string;

		/**
		 * Accessible label for the combobox input, announced by screen readers.
		 * Falls back to the placeholder text (`'Search…'` by default), since a
		 * placeholder alone is not a reliable accessible name.
		 */
		label?: string;

		/**
		 * Whether to auto-focus the input when mounted.
		 * @default true
		 */
		hasAutoFocus?: boolean;

		/**
		 * Content rendered at the trailing end of the input, after the spinner.
		 * Use for clear buttons, keyboard shortcuts, or other trailing actions.
		 * The spinner (when busy) appears immediately before this content with a
		 * 4px gap.
		 */
		endContent?: Snippet;

		/** Native change handler for the input element. */
		onChange?: (event: Event & { currentTarget: HTMLInputElement }) => void;

		/** Key handler run before the combobox's own. */
		onkeydown?: (event: KeyboardEvent) => void;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import Icon from '../icon/icon.svelte';
	import Spinner from '../spinner/spinner.svelte';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { useCommandPaletteContext } from './command-palette-context.svelte.js';
	import { useDialogContext } from '../dialog/dialog-context.svelte.js';
	import {
		commandPaletteInputWrapperAttrs,
		commandPaletteInputIconAttrs,
		commandPaletteInputEndAttrs,
		commandPaletteInputSpinnerAttrs,
		commandPaletteInputAttrs
	} from './command-palette-input.stylex.js';

	/**
	 * Search input for the command palette, ported from Astryx's
	 * `CommandPalette/CommandPaletteInput.tsx`.
	 *
	 * Renders a search icon and a text input, auto-focusing on mount so users can
	 * start typing immediately. Inside `CommandPalette` it wires itself to the
	 * context for search state and keyboard navigation; standalone, it takes
	 * explicit `value`/`onValueChange`.
	 *
	 * `oninput` is omitted from the props surface for the reason `TextInput` and
	 * `NumberInput` record: `BaseProps` would let a caller's handler typecheck and
	 * then be silently shadowed by the component's own. The `value` spread hazard
	 * `NumberInput` documents does **not** reach here — a `type="text"` field has
	 * no bad-input state, so it is immune for the same reason `TextInput` is.
	 */
	const {
		value: controlledValue,
		onValueChange,
		placeholder: placeholderFromProps,
		label,
		hasAutoFocus = true,
		endContent,
		onChange,
		onkeydown,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: CommandPaletteInputProps = $props();

	const t = useTranslator();
	const placeholder = $derived(
		placeholderFromProps ?? t('@astryx.commandPalette.input.placeholder')
	);

	const ctx = useCommandPaletteContext();
	const dialogContext = useDialogContext();

	let inputEl = $state<HTMLInputElement | null>(null);

	// Use context values as fallback
	const value = $derived(controlledValue ?? ctx?.().search);
	const handleValueChange = $derived(onValueChange ?? ctx?.().setSearch);

	// When rendered inside an inline dialog, disable auto-focus by default
	// to avoid stealing focus from the surrounding page.
	const effectiveAutoFocus = $derived(hasAutoFocus && dialogContext()?.isInline !== true);

	// Auto-focus on mount. Upstream keys this on `[effectiveAutoFocus]` alone, so
	// the element is reached through `untrack` rather than tracked as a third
	// dependency — otherwise the rAF would be re-armed on every remount of the
	// input node.
	$effect(() => {
		if (!effectiveAutoFocus) {
			return;
		}
		const el = untrack(() => inputEl);
		if (el == null) {
			return;
		}
		const frame = requestAnimationFrame(() => {
			el.focus();
		});
		return () => cancelAnimationFrame(frame);
	});

	// Keyboard navigation — delegates to useCombobox via context
	function handleKeyDown(event: KeyboardEvent): void {
		onkeydown?.(event);
		if (event.defaultPrevented) {
			return;
		}
		// Delegate to useCombobox's keyboard handler from context
		ctx?.().onKeyDown(event);
	}

	function handleInput(event: Event & { currentTarget: HTMLInputElement }): void {
		handleValueChange?.(event.currentTarget.value);
		onChange?.(event);
	}

	const theme = $derived(themeProps('command-palette-input'));
	const wrapperAttrs = $derived(commandPaletteInputWrapperAttrs(xstyle));
	const iconAttrs = $derived(commandPaletteInputIconAttrs());
	const endAttrs = $derived(commandPaletteInputEndAttrs());
	const spinnerAttrs = $derived(commandPaletteInputSpinnerAttrs());
	const inputAttrs = $derived(commandPaletteInputAttrs());
</script>

<div {...theme} class={cx(theme.class, wrapperAttrs.class)} style={wrapperAttrs.style}>
	<span class={iconAttrs.class} style={iconAttrs.style}>
		<Icon icon="search" size="sm" color="inherit" />
	</span>
	<!--
		`aria-label` re-reads `rest` deliberately. Upstream spreads its rest props
		*last* on this input, so a consumer's own `aria-label` wins over the
		derived one; this port spreads rest *first*, as it does everywhere, which
		would make the derived value win instead. Re-emitting the consumer's value
		when it exists keeps upstream's documented precedence without reordering
		the spread the other ARIA attributes here depend on.
	-->
	<input
		{...rest}
		bind:this={inputEl}
		type="text"
		role="combobox"
		aria-expanded={ctx?.().isOpen ?? true}
		aria-autocomplete="list"
		aria-controls={ctx?.().listId}
		aria-activedescendant={ctx && ctx().highlightedIndex >= 0
			? ctx().getItemId(ctx().highlightedIndex)
			: undefined}
		aria-label={rest['aria-label'] ?? label ?? placeholder}
		{placeholder}
		{value}
		data-autofocus={effectiveAutoFocus || undefined}
		oninput={handleInput}
		onkeydown={handleKeyDown}
		class={cx(inputAttrs.class, className)}
		style={mergeStyle(inputAttrs.style, styleProp as string | undefined)}
	/>
	{#if ctx?.().isBusy || endContent}
		<span class={endAttrs.class} style={endAttrs.style}>
			{#if ctx?.().isBusy}
				<span class={spinnerAttrs.class} style={spinnerAttrs.style}>
					<Spinner size="sm" />
				</span>
			{/if}
			{#if endContent}{@render endContent()}{/if}
		</span>
	{/if}
</div>
