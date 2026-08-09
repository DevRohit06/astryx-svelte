<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { IconName } from '../icon/icon-registry.js';

	/** The row owns `role`, `aria-checked` and `tabindex`, so all three are omitted. */
	export interface DropdownMenuRadioItemProps extends Omit<
		BaseProps,
		'role' | 'aria-checked' | 'tabindex'
	> {
		/**
		 * The value this item represents within its group. The group's `value`
		 * matches against this to determine the checked state.
		 */
		value: string;
		/** Primary label text identifying the option. */
		label: string | Snippet;
		/** Secondary description text displayed below the label. */
		description?: string | Snippet;
		/**
		 * Icon before the label — a registry name, or a snippet for a custom icon.
		 * Upstream's `ReactNode | IconType`, in this port's slot shape.
		 */
		icon?: Snippet | IconName;
		/**
		 * Whether this individual radio item is disabled. Disabled items stay
		 * focusable (via `aria-disabled`) so they remain discoverable by keyboard
		 * and assistive technology, but selection is blocked.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * Content to render after the label and description, such as a badge or
		 * metadata.
		 */
		endContent?: Snippet;
	}
</script>

<script lang="ts">
	import Icon from '../icon/icon.svelte';
	import Item from '../item/item.svelte';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import {
		useDropdownMenuContext,
		useDropdownMenuRadioGroupContext
	} from './dropdown-menu-context.svelte.js';
	import { focusMenuItemOnHover } from './menu-item-hover.js';
	import {
		radioCircleAttrs,
		radioDotAttrs,
		radioItemXstyle
	} from './dropdown-menu-radio-item.stylex.js';

	/**
	 * A single option in a `DropdownMenuRadioGroup` (`role="menuitemradio"`).
	 *
	 * @example
	 * ```svelte
	 * <DropdownMenuRadioGroup value={sort} onChange={(v) => (sort = v)} label="Sort by">
	 *   <DropdownMenuRadioItem value="newest" label="Newest" />
	 *   <DropdownMenuRadioItem value="oldest" label="Oldest" icon="clock" />
	 * </DropdownMenuRadioGroup>
	 * ```
	 */
	const {
		value,
		label,
		description,
		icon,
		isDisabled = false,
		endContent,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: DropdownMenuRadioItemProps = $props();

	const menuCtx = useDropdownMenuContext();
	const groupCtx = useDropdownMenuRadioGroupContext();
	// Upstream throws during render; the init-time check is the counterpart, and
	// it runs on the server too — a radio item outside a group is a mistake at
	// authoring time, not a runtime state.
	if (!groupCtx()) {
		throw new Error('DropdownMenuRadioItem must be used within a DropdownMenuRadioGroup');
	}

	const menuSize = $derived(menuCtx()?.menuSize ?? 'md');
	const controlSize = $derived(menuSize === 'sm' ? 'sm' : 'md');
	const isChecked = $derived(groupCtx()?.value === value);

	function handleClick(): void {
		if (isDisabled) return;
		const group = groupCtx();
		if (!group) return;
		group.onChange(value);
		if (group.hasCloseOnSelect) {
			menuCtx()?.closeMenu();
		}
	}

	function handlePointerMove(e: PointerEvent): void {
		focusMenuItemOnHover(e, isDisabled);
	}

	const circleTheme = $derived(
		themeProps('dropdown-menu-radio', {
			size: controlSize,
			checked: isChecked ? 'checked' : null,
			disabled: isDisabled ? 'disabled' : null
		})
	);
	// The dot renders only when checked, so its `checked` state is a constant —
	// it mirrors the circle's visual props/states so both theme consistently.
	const dotTheme = $derived(
		themeProps('dropdown-menu-radio-dot', {
			size: controlSize,
			checked: 'checked',
			disabled: isDisabled ? 'disabled' : null
		})
	);
	const itemTheme = $derived(themeProps('dropdown-menu-item', { size: menuSize }));
	const circleAttrs = $derived(radioCircleAttrs(controlSize, isChecked));
	const dotAttrs = $derived(radioDotAttrs(controlSize));
	const itemXstyle = $derived(radioItemXstyle(isDisabled, xstyle));
</script>

{#snippet iconSlot()}
	{#if typeof icon === 'string'}
		<Icon {icon} size="sm" color="secondary" />
	{:else if icon}
		{@render icon()}
	{/if}
{/snippet}

{#snippet marker()}
	<span
		aria-hidden="true"
		{...circleTheme}
		class={cx(circleTheme.class, circleAttrs.class)}
		style={circleAttrs.style}
	>
		{#if isChecked}
			<span {...dotTheme} class={cx(dotTheme.class, dotAttrs.class)} style={dotAttrs.style}></span>
		{/if}
	</span>
{/snippet}

<Item
	{...rest}
	role="menuitemradio"
	aria-checked={isChecked}
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
