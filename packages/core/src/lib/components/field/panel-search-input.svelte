<script lang="ts" module>
	import type { FocusEventHandler, KeyboardEventHandler } from 'svelte/elements';
	import type { BaseProps } from '../../base-props.js';

	/**
	 * `oninput` is the omission, and it is upstream's `Omit<…, 'onChange'>`
	 * translated by *semantics* rather than by name: React's `onChange` on a text
	 * input IS the input event, and `oninput` is what this component binds its own
	 * value callback to below. The rest props are spread onto the `<input>`
	 * **after** that binding (deliberately — a caller's `role`/`aria-*` have to
	 * win), so a forwarded `oninput` would silently replace `onValueChange` and
	 * the query would never update. `TextInput` omits the same name for the same
	 * reason. The native `onchange` has no React counterpart to omit and this
	 * component never sets it, so it passes through.
	 */
	export interface PanelSearchInputProps extends Omit<BaseProps<HTMLInputElement>, 'oninput'> {
		/**
		 * The `<input>` element, for focus management. Upstream's `ref`, which
		 * `bind:ref` translates directly — `Selector` focuses it on open and
		 * compares it against a key event's target.
		 */
		ref?: HTMLInputElement | null;

		/**
		 * Accessible name for the input. Rendered as `aria-label`: the panel has no
		 * visible label for the field, and a placeholder is not a reliable name.
		 */
		label: string;

		/** Accessible name for the clear (✕) button, e.g. `Clear Search options`. */
		clearLabel: string;

		/** Placeholder text shown while the query is empty. */
		placeholder?: string;

		/** The current query. */
		value: string;

		/** Called with the next query on every keystroke and on clear. */
		onValueChange: (value: string) => void;

		/**
		 * Key handler for the input itself. Lowercase because it is forwarded to
		 * the `<input>` — the DOM event name, as `InputClearButton`'s `onclick`
		 * established for this family.
		 */
		onkeydown?: KeyboardEventHandler<HTMLInputElement>;

		/** Focus handler for the input; runs after the ring's own bookkeeping. */
		onfocus?: FocusEventHandler<HTMLInputElement>;

		/** Blur handler for the input; runs after the ring's own bookkeeping. */
		onblur?: FocusEventHandler<HTMLInputElement>;

		/**
		 * Key handler for the row. Events from the input are handled by `onkeydown`;
		 * this one exists for keys pressed on the clear button, which has no other
		 * handler of its own.
		 */
		onContainerKeyDown?: KeyboardEventHandler<HTMLDivElement>;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import {
		getInteractionModality,
		trackInteractionModality
	} from '../../utils/interaction-modality.js';
	import Icon from '../icon/icon.svelte';
	import InputClearButton from './input-clear-button.svelte';
	import {
		panelSearchFieldAttrs,
		panelSearchIconStyle,
		panelSearchInputAttrs,
		panelSearchWrapperAttrs
	} from './panel-search-input.stylex.js';

	/**
	 * Search row for the top of a dropdown panel: magnifier, borderless input, and
	 * a clear button once a query is typed, in a rounded box shaped like the
	 * option rows beneath it.
	 *
	 * A dropdown panel is already a bordered, elevated surface. Nesting a bordered
	 * `TextInput` inside it draws a second box within that box, so the field reads
	 * as a control dropped into the menu rather than part of it. This row is the
	 * seamless alternative, separated from the options by a divider the panel owns.
	 *
	 * `class`/`style`/`xstyle` apply to the outer row (use them to match the option
	 * list's inline padding); every other prop (`role`, `aria-*`, `id`, …) passes
	 * through to the `<input>`, so the caller owns the combobox wiring — which is
	 * why the rest spread comes **after** the StyleX class on the input.
	 *
	 * The clear button renders **after** the input in DOM order: the selectors'
	 * Tab handling depends on that order to keep the popup open while focus moves
	 * onto it.
	 *
	 * **Not exported from `src/lib/index.ts`**, because upstream's `Field/index.ts`
	 * exports only `InputClearButton` — this is an implementation detail of the
	 * panels that use it, not public API.
	 */
	let {
		ref = $bindable(null),
		label,
		clearLabel,
		placeholder,
		value,
		onValueChange,
		onkeydown,
		onfocus,
		onblur,
		onContainerKeyDown,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: PanelSearchInputProps = $props();

	// `:focus-visible` matches a text input focused by POINTER as well (CSS
	// Selectors 4, verified in Chromium), so it cannot express "keyboard focus"
	// by itself. Gate it on how the user last interacted; the CSS condition
	// stays `:focus-visible`, this only narrows it.
	let isKeyboardFocus = $state(false);

	$effect(() => {
		trackInteractionModality();
	});

	function handleFocus(e: FocusEvent & { currentTarget: HTMLInputElement }): void {
		isKeyboardFocus = getInteractionModality() === 'keyboard';
		onfocus?.(e);
	}

	function handleBlur(e: FocusEvent & { currentTarget: HTMLInputElement }): void {
		isKeyboardFocus = false;
		onblur?.(e);
	}

	function handleClear(): void {
		onValueChange('');
		// Clearing puts the caret back where the user was typing, matching
		// TextInput's built-in clear.
		ref?.focus();
	}

	const wrapper = $derived(panelSearchWrapperAttrs(xstyle));
	const field = $derived(panelSearchFieldAttrs(isKeyboardFocus));
	const input = panelSearchInputAttrs();
</script>

<!--
	The row is not interactive itself; the key handler exists only so keys pressed
	on the clear button (which has no handler of its own) reach the caller.
-->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	onkeydown={onContainerKeyDown}
	class={cx(wrapper.class, className)}
	style={mergeStyle(wrapper.style, styleProp as string | undefined)}
>
	<div
		data-keyboard-focus={isKeyboardFocus ? 'true' : undefined}
		class={field.class}
		style={field.style}
	>
		<Icon icon="search" size="sm" color="secondary" xstyle={panelSearchIconStyle} />
		<input
			bind:this={ref}
			type="text"
			aria-label={label}
			{placeholder}
			{value}
			oninput={(e) => onValueChange(e.currentTarget.value)}
			{onkeydown}
			onfocus={handleFocus}
			onblur={handleBlur}
			class={input.class}
			style={input.style}
			{...rest}
		/>
		{#if value !== ''}
			<InputClearButton label={clearLabel} onclick={handleClear} />
		{/if}
	</div>
</div>
