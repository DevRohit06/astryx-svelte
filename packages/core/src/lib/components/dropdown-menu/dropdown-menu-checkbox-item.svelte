<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { IconName } from '../icon/icon-registry.js';

	/**
	 * `onchange`, `role`, `aria-checked` and `tabindex` are omitted from
	 * `BaseProps`: the row owns all four, and `onChange` is redeclared below with
	 * the checkbox's own signature.
	 */
	export interface DropdownMenuCheckboxItemProps extends Omit<
		BaseProps,
		'onchange' | 'role' | 'aria-checked' | 'tabindex'
	> {
		/** Primary label text identifying the item. */
		label: string | Snippet;
		/** Secondary description text displayed below the label. */
		description?: string | Snippet;
		/**
		 * Icon before the label — a registry name, or a snippet for a custom icon.
		 * Upstream's `ReactNode | IconType`, in this port's slot shape.
		 */
		icon?: Snippet | IconName;
		/** Whether the item is checked. Controlled — pair with `onChange`. */
		value: boolean;
		/** Callback fired with the next checked state when the item is toggled. */
		onChange?: (checked: boolean) => void;
		/**
		 * Whether the item is disabled. Disabled items stay focusable (via
		 * `aria-disabled`) so they remain discoverable by keyboard and assistive
		 * technology, but activation is blocked.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * Whether toggling the item closes the menu. Checkbox items default to
		 * staying open so several can be toggled in a single session, unlike radio
		 * items which default to closing on selection.
		 * @default false
		 */
		hasCloseOnSelect?: boolean;
		/**
		 * Content to render after the label and description, such as a keyboard
		 * shortcut hint or badge.
		 */
		endContent?: Snippet;
	}
</script>

<script lang="ts">
	import CheckboxInput from '../checkbox-input/checkbox-input.svelte';
	import Icon from '../icon/icon.svelte';
	import Item from '../item/item.svelte';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useDropdownMenuContext } from './dropdown-menu-context.svelte.js';
	import { focusMenuItemOnHover } from './menu-item-hover.js';
	import {
		checkboxItemXstyle,
		checkboxMarkerBoxAttrs
	} from './dropdown-menu-checkbox-item.stylex.js';

	/**
	 * A checkable dropdown menu item (`role="menuitemcheckbox"`).
	 *
	 * Must be used inside a `DropdownMenu`. Toggles an independent boolean; for a
	 * one-of-N choice use `DropdownMenuRadioGroup` + `DropdownMenuRadioItem`.
	 *
	 * Unlike `CheckboxInput` there is no nested native `<input>` that participates
	 * in accessibility: the row itself owns the role and `aria-checked`, per the
	 * WAI-ARIA `menuitemcheckbox` pattern. Arrow navigation, typeahead and
	 * Enter/Space activation come from the parent menu's `useListFocus`, whose
	 * selector matches `menuitemcheckbox` alongside plain `menuitem` rows.
	 *
	 * The checkbox visual composes the real `CheckboxInput` primitive so its
	 * checkmark matches `CheckboxListItem` and picks up the standard `checkbox`
	 * theming slots. It is purely decorative: the composed control is wrapped in
	 * an element that is both `aria-hidden` and `inert`, so it contributes nothing
	 * to the row's accessible name, and its native `<input>` and sr-only label stay
	 * out of the tab order and the accessibility tree while pointer clicks fall
	 * through to the row — the same shim `MultiSelector` uses.
	 *
	 * @example
	 * ```svelte
	 * <DropdownMenu button={{ label: 'View' }}>
	 *   {#snippet children()}
	 *     <DropdownMenuCheckboxItem
	 *       label="Show archived"
	 *       value={showArchived}
	 *       onChange={(next) => (showArchived = next)}
	 *     />
	 *   {/snippet}
	 * </DropdownMenu>
	 * ```
	 */
	const {
		label,
		description,
		icon,
		value,
		onChange,
		isDisabled = false,
		hasCloseOnSelect = false,
		endContent,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: DropdownMenuCheckboxItemProps = $props();

	const ctx = useDropdownMenuContext();
	const menuSize = $derived(ctx()?.menuSize ?? 'md');
	const controlSize = $derived(menuSize === 'sm' ? 'sm' : 'md');

	// The composed checkbox is decorative and inert, so its label never reaches
	// the accessibility tree — the row's `label` prop provides the announced
	// name. CheckboxInput still requires a string label, so pass one through when
	// the row label is a plain string.
	const checkboxLabel = $derived(typeof label === 'string' ? label : '');

	function handleClick(): void {
		if (isDisabled) return;
		onChange?.(!value);
		if (hasCloseOnSelect) {
			ctx()?.closeMenu();
		}
	}

	function handlePointerMove(e: PointerEvent): void {
		focusMenuItemOnHover(e, isDisabled);
	}

	const itemTheme = $derived(themeProps('dropdown-menu-item', { size: menuSize }));
	const markerBoxAttrs = checkboxMarkerBoxAttrs();
	const itemXstyle = $derived(checkboxItemXstyle(isDisabled, xstyle));
</script>

{#snippet iconSlot()}
	{#if typeof icon === 'string'}
		<Icon {icon} size="sm" color="secondary" />
	{:else if icon}
		{@render icon()}
	{/if}
{/snippet}

{#snippet marker()}
	<div aria-hidden="true" inert class={markerBoxAttrs.class} style={markerBoxAttrs.style}>
		<CheckboxInput label={checkboxLabel} isLabelHidden {value} {isDisabled} size={controlSize} />
	</div>
{/snippet}

<Item
	{...rest}
	role="menuitemcheckbox"
	aria-checked={value}
	tabindex={isDisabled ? undefined : -1}
	onpointermove={handlePointerMove}
	{marker}
	startContent={icon != null ? iconSlot : undefined}
	{label}
	{description}
	{endContent}
	onclick={handleClick}
	{isDisabled}
	xstyle={itemXstyle}
	class={cx(itemTheme.class, className)}
	style={styleProp as string | undefined}
	data-size={menuSize}
/>
