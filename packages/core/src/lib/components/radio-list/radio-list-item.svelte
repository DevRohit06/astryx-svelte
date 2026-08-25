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
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import Item from '../item/item.svelte';
	import { useRadioList } from './radio-list-context.svelte.js';
	import {
		radioIndicatorSlotAttrs,
		radioInputAttrs,
		radioListItemRowXstyle,
		radioWrapperAttrs
	} from './radio-list-item.stylex.js';
	import { useIndicator } from '../indicator/use-indicator.svelte.js';
	import { useIndicatorFocusRing } from '../../hooks/use-indicator-focus-ring.svelte.js';

	/**
	 * A single radio within a `RadioList`. The visible circle is decorative; the
	 * real `<input type="radio">` is transparent and overlaid on it, and the
	 * label/description/end content are laid out by the `Item` that *is* the row.
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
		onclick: onclickProp,
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

	// One target for every row, carrying its size and runtime state so a theme can
	// express "selected option at large" or restyle disabled rows without reaching
	// for structural selectors. It lands on the element Item paints — the row
	// surface — so a theme styling `radio-list-item`'s background/padding/
	// borderRadius (and its `:hover`) actually takes effect from the
	// `astryx-theme` layer, even though the component zeroes those by default.
	const rowTheme = $derived(
		themeProps('radio-list-item', {
			size,
			selected: isChecked ? 'selected' : null,
			disabled: isDisabled ? 'disabled' : null
		})
	);
	const rowXstyle = $derived(radioListItemRowXstyle(isDisabled, xstyle));
	const wrapperAttrs = $derived(radioWrapperAttrs(size));
	const inputAttrs = $derived(radioInputAttrs(size, isDisabled));
	const indicatorSlotAttrs = radioIndicatorSlotAttrs();

	// Upstream types `RadioListItem`'s props `BaseProps<HTMLDivElement>` — the
	// element `Item` really renders — while `Item`'s own props are
	// `BaseProps<HTMLElement>`. Event handlers are contravariant in that element
	// type, so the two are incompatible at the seam even though the DOM agrees.
	// The public type stays upstream's; the widening happens at the one point the
	// rest props cross into `Item`, exactly as `ListItem` does it.
	const itemRest = $derived(rest as Omit<BaseProps<HTMLElement>, 'onclick'>);

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

	// The radio is the row's single keyboard control and action. The row is an
	// enlarged click/tap target that delegates surface clicks — the description
	// and the empty hover area, not just the control and its label — to the input
	// via Item's `interactiveRef` (useClickableContainer). This matches
	// CheckboxListItem so the whole row is clickable, and keeps one tab stop per
	// option (WCAG 4.1.2). The radio carries its accessible name via `aria-label`
	// since the visible label is now a plain (non-`<label>`) text node — a real
	// `<label for>` would double-fire under delegation.
	let radioInput = $state<HTMLInputElement | null>(null);

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
			bind:this={radioInput}
			{id}
			type="radio"
			name={ctx().name}
			{value}
			checked={isChecked}
			aria-label={label}
			disabled={isDisabled && !keepsFocusableForMessage}
			aria-disabled={keepsFocusableForMessage ? 'true' : undefined}
			form={keepsFocusableForMessage ? '' : undefined}
			required={ctx().isRequired}
			onchange={handleChange}
			onclick={onclickProp}
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
	<span>{label}</span>
{/snippet}

{#snippet descriptionContent()}
	<span id={descriptionID}>{description}</span>
{/snippet}

<Item
	{...itemRest}
	startContent={mediaContent}
	interactiveRef={() => radioInput}
	{isDisabled}
	label={labelContent}
	description={description != null ? descriptionContent : undefined}
	{endContent}
	xstyle={rowXstyle}
	{...rowTheme}
	class={cx(rowTheme.class, className)}
	style={styleProp}
/>
