<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';

	export interface RadioListItemProps extends BaseProps<HTMLDivElement> {
		/** Label text for the radio item. */
		label: string;
		/** Value of this item. */
		value: string;
		/** Description text below the label. */
		description?: string;
		/**
		 * Whether just this item is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/** Content before the radio circle. */
		startContent?: Snippet;
		/** Content after the label. */
		endContent?: Snippet;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import Item from '../item/item.svelte';
	import { useRadioList } from './radio-list-context.svelte.js';
	import {
		radioEmbeddedRoot,
		radioIndicatorSlotAttrs,
		radioInputAttrs,
		radioLabelAttrs,
		radioListItemContainerAttrs,
		radioWrapperAttrs
	} from './radio-list-item.stylex.js';
	import { useIndicator } from '../indicator/use-indicator.svelte.js';
	import { useIndicatorFocusRing } from '../../hooks/use-indicator-focus-ring.svelte.js';

	/**
	 * A single radio within a `RadioList`. The visible circle is decorative; the
	 * real `<input type="radio">` is transparent and overlaid on it, and the
	 * label/description/end content are laid out through a nested `Item`.
	 */
	let {
		label,
		value,
		description,
		isDisabled: isItemDisabled = false,
		startContent,
		endContent,
		class: className,
		style: styleProp,
		xstyle,
		...rest
	}: RadioListItemProps = $props();

	const ctx = useRadioList();

	const uid = $props.id();
	const id = `${uid}-input`;
	const descriptionID = `${uid}-desc`;

	const isDisabled = $derived(ctx().isDisabled || isItemDisabled);
	// A whole-group disabled-with-reason keeps radios focusable via aria-disabled
	// (not native `disabled`); per-item disabling always uses native `disabled`.
	const keepsFocusableForMessage = $derived(ctx().hasDisabledMessage && !isItemDisabled);
	const isChecked = $derived(ctx().value === value);
	const size = $derived(ctx().size);

	const containerTheme = themeProps('radio-list-item');
	const containerAttrs = $derived(radioListItemContainerAttrs(isDisabled, xstyle));
	const wrapperAttrs = $derived(radioWrapperAttrs(size));
	const inputAttrs = $derived(radioInputAttrs(size, isDisabled));
	const indicatorSlotAttrs = radioIndicatorSlotAttrs();
	const labelAttrs = $derived(radioLabelAttrs(isDisabled));

	// The circle and its dot are a component the theme resolves now, so it
	// carries its own `radio-indicator` / `radio-indicator-dot` targets (with the
	// legacy `radio` / `radio-dot` beside them) and its own size ramp.
	const radioIndicator = useIndicator('radio');
	const RadioControl = $derived(radioIndicator.current);

	// The focusable `<input>` is transparent, so the ring has to land on the
	// indicator beside it — painted imperatively, since a theme's replacement may
	// never draw one itself.
	let indicatorSlot = $state<HTMLElement | null>(null);
	const { focusProps } = useIndicatorFocusRing(() => ({
		container: indicatorSlot,
		isDisabled
	}));

	function handleChange(e: Event): void {
		if (isDisabled) {
			// Focusable-disabled radios aren't natively disabled, so a click flips the
			// DOM checked state — and unchecks a same-name sibling without firing its
			// own change event. One-way `checked={isChecked}` won't repaint a sibling
			// whose `isChecked` is unchanged, so restore the *whole* group to the
			// controlled value by hand — React's `updateNamedCousins`, which its
			// controlled-radio machinery runs after every change.
			const input = e.target as HTMLInputElement;
			const groupValue = ctx().value;
			const root = input.getRootNode() as Document | ShadowRoot;
			const cousins = root.querySelectorAll<HTMLInputElement>(
				`input[type="radio"][name="${CSS.escape(ctx().name)}"]`
			);
			for (const cousin of cousins) {
				cousin.checked = cousin.value === groupValue;
			}
			return;
		}
		ctx().onChange(value);
	}
</script>

{#snippet radioCircle()}
	<!--
		`focusin`/`focusout`, not `focus`/`blur`: the focusable element is the
		`<input>` inside this wrapper, and the plain events do not bubble.
	-->
	<div
		class={wrapperAttrs.class}
		style={wrapperAttrs.style}
		onfocusin={focusProps.onFocus}
		onfocusout={focusProps.onBlur}
	>
		<input
			{id}
			type="radio"
			name={ctx().name}
			{value}
			checked={isChecked}
			disabled={isDisabled && !keepsFocusableForMessage}
			aria-disabled={keepsFocusableForMessage ? 'true' : undefined}
			form={keepsFocusableForMessage ? '' : undefined}
			required={ctx().isRequired}
			onchange={handleChange}
			aria-describedby={description ? descriptionID : undefined}
			class={inputAttrs.class}
			style={inputAttrs.style}
		/>
		<!--
			A container holding ONLY the indicator, so the focus ring has an
			unambiguous target whatever a theme renders. `display: contents` keeps it
			out of layout entirely.
		-->
		<span bind:this={indicatorSlot} class={indicatorSlotAttrs.class}>
			<RadioControl state={isChecked ? 'checked' : 'unchecked'} {size} {isDisabled} />
		</span>
	</div>
{/snippet}

{#snippet mediaContent()}
	{@render radioCircle()}
	{#if startContent}{@render startContent()}{/if}
{/snippet}

{#snippet labelContent()}
	<label for={id} class={labelAttrs.class} style={labelAttrs.style}>{label}</label>
{/snippet}

{#snippet descriptionContent()}
	<span id={descriptionID}>{description}</span>
{/snippet}

<div
	{...rest}
	{...containerTheme}
	class={cx(containerTheme.class, containerAttrs.class, className)}
	style={mergeStyle(containerAttrs.style, styleProp as string | undefined)}
>
	<Item
		startContent={mediaContent}
		label={labelContent}
		description={description != null ? descriptionContent : undefined}
		{endContent}
		xstyle={radioEmbeddedRoot}
	/>
</div>
