<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { IconName } from '../icon/icon-registry.js';

	export interface DropdownMenuItemProps extends Pick<BaseProps, 'xstyle' | 'class' | 'style'> {
		/**
		 * Icon before the label — a registry name, or a snippet for a custom icon.
		 * Upstream's `ReactNode | IconType`; the Svelte slot shape (as `Button.icon`)
		 * is `IconName | Snippet` — a snippet renders any icon element.
		 */
		icon?: Snippet | IconName;
		/** Primary label. A string single-line-truncates by default. */
		label: string | Snippet;
		/** Secondary description below the label. */
		description?: string | Snippet;
		/** Called when the item is selected. */
		onClick?: () => void;
		/** @default false */
		isDisabled?: boolean;
		/** Content after the label/description. */
		endContent?: Snippet;
		/**
		 * Whether activating the item closes the menu. Set `false` for an action
		 * that reports its result on the item itself (a copy row swapping to
		 * "Copied"), matching the checkbox and radio items, which already decide
		 * this for themselves.
		 * @default true
		 */
		hasCloseOnSelect?: boolean;
		/**
		 * Visual variant. `'destructive'` renders the label, description, and icon
		 * in the error color for dangerous actions (e.g. Delete).
		 * @default 'default'
		 */
		variant?: 'default' | 'destructive';
	}
</script>

<script lang="ts">
	import Item from '../item/item.svelte';
	import Icon from '../icon/icon.svelte';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useDropdownMenuContext } from './dropdown-menu-context.svelte.js';
	import { focusMenuItemOnHover } from './menu-item-hover.js';
	import { dropdownMenuItemXstyle } from './dropdown-menu-item.stylex.js';

	/**
	 * An interactive `role="menuitem"`. Must be used inside `DropdownMenu`;
	 * keyboard navigation comes from the parent's `useListFocus`. Composes `Item`,
	 * passing `role="menuitem"` so `Item` puts the click handler on its root rather
	 * than minting an invisible button.
	 */
	const {
		icon,
		label,
		description,
		onClick,
		isDisabled = false,
		endContent,
		hasCloseOnSelect = true,
		variant = 'default',
		xstyle,
		class: className,
		style: styleProp
	}: DropdownMenuItemProps = $props();

	const ctx = useDropdownMenuContext();
	const menuSize = $derived(ctx()?.menuSize ?? 'md');
	const isDestructive = $derived(variant === 'destructive');

	function handleClick(): void {
		if (isDisabled) return;
		onClick?.();
		if (hasCloseOnSelect) ctx()?.closeMenu();
	}

	function handlePointerMove(e: PointerEvent): void {
		focusMenuItemOnHover(e, isDisabled);
	}

	// `variant` is reflected only when it is destructive — a default item carries
	// no `data-variant`, so existing themes and usage are unchanged.
	const theme = $derived(
		themeProps('dropdown-menu-item', {
			size: menuSize,
			variant: isDestructive ? 'destructive' : null
		})
	);
	const itemXstyle = $derived(dropdownMenuItemXstyle(menuSize, isDisabled, isDestructive, xstyle));
</script>

{#snippet iconSlot()}
	{#if typeof icon === 'string'}
		<Icon {icon} size="sm" color={isDestructive ? 'error' : 'secondary'} />
	{:else if icon}
		{@render icon()}
	{/if}
{/snippet}

<Item
	role="menuitem"
	tabindex={isDisabled ? undefined : -1}
	onpointermove={handlePointerMove}
	{label}
	{description}
	{endContent}
	startContent={icon != null ? iconSlot : undefined}
	{isDisabled}
	onclick={handleClick}
	xstyle={itemXstyle}
	{...theme}
	class={cx(theme.class, className)}
	style={styleProp as string | undefined}
/>
