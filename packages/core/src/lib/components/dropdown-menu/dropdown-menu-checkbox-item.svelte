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
	import Icon from '../icon/icon.svelte';
	import Item from '../item/item.svelte';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useDropdownMenuContext } from './dropdown-menu-context.svelte.js';
	import { focusMenuItemOnHover } from './menu-item-hover.js';
	import {
		checkboxItemXstyle,
		checkboxMarkerXstyle
	} from './dropdown-menu-checkbox-item.stylex.js';
	import { useIndicator } from '../indicator/use-indicator.svelte.js';

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
	 * The checkbox visual is the shared `checkbox` indicator, so it matches
	 * `CheckboxInput` and `CheckboxListItem` exactly and follows a theme that
	 * replaces it. Through 0.3.0 this composed a whole `CheckboxInput` wrapped in
	 * an `aria-hidden` + `inert` element — a real control rendered purely to
	 * borrow its picture, with a native `<input>` and an sr-only label that had to
	 * be kept out of the tab order and the accessibility tree. An indicator is
	 * decorative by contract, so all of that scaffolding is gone.
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
	const itemXstyle = $derived(checkboxItemXstyle(isDisabled, xstyle));

	// A menu checkbox and a form checkbox are the same component now, so a theme
	// that replaces `checkbox` reaches both.
	const checkboxIndicator = useIndicator('checkbox');
	const CheckboxControl = $derived(checkboxIndicator.current);
</script>

{#snippet iconSlot()}
	{#if typeof icon === 'string'}
		<Icon {icon} size="sm" color="secondary" />
	{:else if icon}
		{@render icon()}
	{/if}
{/snippet}

{#snippet marker()}
	<!--
		No wrapper: the `astryx-checkbox` target is already on the indicator's own
		element, so the menu adds only its placement rules. A wrapper here would
		have duplicated the indicator's control size and moved nothing themeable.
	-->
	<CheckboxControl
		state={value ? 'checked' : 'unchecked'}
		size={controlSize}
		{isDisabled}
		xstyle={checkboxMarkerXstyle}
	/>
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
