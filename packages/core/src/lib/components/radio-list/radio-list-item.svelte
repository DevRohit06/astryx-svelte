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
		radioCircleAttrs,
		radioDotAttrs,
		radioEmbeddedRoot,
		radioInputAttrs,
		radioLabelAttrs,
		radioListItemContainerAttrs,
		radioWrapperAttrs
	} from './radio-list-item.stylex.js';

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
	const wrapperAttrs = $derived(radioWrapperAttrs(size, isDisabled));
	const inputAttrs = $derived(radioInputAttrs(size, isDisabled));
	const circleAttrs = $derived(radioCircleAttrs(size, isChecked, isDisabled));
	const dotAttrs = $derived(radioDotAttrs(size));
	const labelAttrs = $derived(radioLabelAttrs(isDisabled));
	const radioTheme = $derived(
		themeProps('radio', {
			size,
			checked: isChecked ? 'checked' : null,
			disabled: isDisabled ? 'disabled' : null
		})
	);
	const dotTheme = $derived(themeProps('radio-dot', { size }));

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
	<div class={wrapperAttrs.class} style={wrapperAttrs.style}>
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
		<div
			aria-hidden="true"
			{...radioTheme}
			class={cx(radioTheme.class, circleAttrs.class)}
			style={circleAttrs.style}
		>
			{#if isChecked}
				<div {...dotTheme} class={cx(dotTheme.class, dotAttrs.class)} style={dotAttrs.style}></div>
			{/if}
		</div>
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
