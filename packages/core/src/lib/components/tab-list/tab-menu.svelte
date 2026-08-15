<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { IconName } from '../icon/icon-registry.js';

	export interface TabMenuOption {
		value: string;
		label: string;
		/**
		 * Icon to display before the label — a registry name, or a snippet for a
		 * custom icon. Upstream's `ReactNode | IconType`; the Svelte icon-slot shape
		 * (as `Button.icon`) is `IconName | Snippet`.
		 */
		icon?: IconName | Snippet;
	}

	export interface TabMenuProps extends Pick<
		BaseProps<HTMLButtonElement>,
		'xstyle' | 'class' | 'style'
	> {
		/**
		 * Label for the trigger button and dropdown heading.
		 * Displayed as trigger text when no option is selected.
		 */
		label: string;
		/** Menu options rendered in the dropdown. */
		options: TabMenuOption[];
	}
</script>

<script lang="ts">
	import Icon from '../icon/icon.svelte';
	import PopoverLayer from '../popover/popover-layer.svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { usePopover } from '../popover/use-popover.svelte.js';
	import { MENU_ITEM_SELECTOR } from '../dropdown-menu/menu-item-roles.js';
	import { useListFocus } from '../../hooks/use-list-focus.svelte.js';
	import { useTabListContext } from './tab-list-context.svelte.js';
	import {
		tabMenuChevronAttrs,
		tabMenuChevronIconStyle,
		tabMenuChevronOpenStyle,
		tabMenuDropdownAttrs,
		tabMenuHeadingAttrs,
		tabMenuHoverBgAttrs,
		tabMenuIndicatorAttrs,
		tabMenuItemAttrs,
		tabMenuItemContentAttrs,
		tabMenuTriggerAttrs,
		tabMenuTriggerLabelAttrs,
		tabMenuTriggerLabelSizerAttrs,
		tabMenuTriggerLabelTextAttrs
	} from './tab-menu.stylex.js';

	/**
	 * Tab menu trigger that opens a dropdown of additional tab options.
	 *
	 * Shows the selected option's label as trigger text when an option is active.
	 * The dropdown includes a heading showing the menu's `label` prop.
	 *
	 * @example
	 * ```svelte
	 * <TabList value={tab} onChange={(v) => (tab = v)}>
	 *   <Tab value="overview" label="Overview" />
	 *   <TabMenu
	 *     label="More"
	 *     options={[
	 *       { value: 'settings', label: 'Settings' },
	 *       { value: 'history', label: 'History' }
	 *     ]}
	 *   />
	 * </TabList>
	 * ```
	 */
	let { label, options, xstyle, class: className, style: styleProp }: TabMenuProps = $props();

	const tabList = useTabListContext();

	// Upstream mints one `useId` for the menu div and lets `useLayer` mint the
	// layer's own id internally. `$props.id()` may be called once per component,
	// so the menu's id derives from the same uid — the two-ids-from-one-uid shape
	// `ContextMenu` already records. `aria-controls` points at the `role="menu"`
	// div, as upstream's does, not at the layer wrapper.
	const uid = $props.id();
	const menuId = `${uid}-menu`;

	let buttonEl = $state<HTMLButtonElement>();

	const popover = usePopover(() => ({
		id: uid,
		hasLightDismiss: true,
		hasCloseButton: false,
		hasAutoFocus: false,
		// The popup's own role="menu" is the exposed semantics; a modal dialog
		// wrapper would announce an unnamed dialog around the menu.
		role: 'none',
		// Return focus to the trigger when the menu closes (Escape, Tab, select,
		// or light dismiss) so keyboard focus is never dropped to <body>.
		onHide: () => buttonEl?.focus()
	}));

	// The overflow menu is a composite widget: a single roving tab stop with
	// arrow-key navigation between items, per the APG menu pattern. The hook owns
	// item tabindex — items render tabindex={-1} and exactly one is promoted to 0.
	const list = useListFocus(() => ({
		hasRovingTabIndex: true,
		// Options render as menuitemradio (single-select menu), which the default
		// '[role="menuitem"]' selector would not match.
		itemSelector: MENU_ITEM_SELECTOR,
		onEscape: () => popover.hide()
	}));

	function handleToggle(): void {
		if (popover.isOpen) {
			popover.hide();
		} else {
			popover.show();
			// Move focus into the menu on open so arrow navigation works and the
			// roving tab stop lands on a real item (APG menu-button focus-on-open).
			requestAnimationFrame(() => list.focusFirst());
		}
	}

	function handleMenuKeyDown(e: KeyboardEvent): void {
		// APG menu-button: Tab leaves the menu rather than walking its items.
		// Close and let onHide return focus to the trigger, from which the
		// browser's default Tab continues to the next element.
		if (e.key === 'Tab') {
			popover.hide();
			return;
		}
		list.handleKeyDown(e);
	}

	const selectedOption = $derived(options.find((o) => o.value === tabList().value));
	const triggerLabel = $derived(selectedOption?.label ?? label);
	const hasSelectedOption = $derived(selectedOption != null);
	const size = $derived(tabList().size);

	function handleSelect(value: string): void {
		tabList().onChange(value);
		popover.hide();
	}

	const theme = themeProps('tab-menu');
	const dropdownTheme = themeProps('tab-menu-dropdown');
	const itemTheme = themeProps('tab-menu-item');
	const indicatorTheme = themeProps('tab-indicator', { selected: 'selected' });

	const triggerAttrs = $derived(tabMenuTriggerAttrs(size, hasSelectedOption, xstyle));
	const hoverBgAttrs = $derived(tabMenuHoverBgAttrs(size));
	const triggerLabelAttrs = tabMenuTriggerLabelAttrs();
	const triggerLabelTextAttrs = tabMenuTriggerLabelTextAttrs();
	const triggerLabelSizerAttrs = tabMenuTriggerLabelSizerAttrs();
	const chevronAttrs = tabMenuChevronAttrs();
	const indicatorAttrs = tabMenuIndicatorAttrs();
	const dropdownAttrs = tabMenuDropdownAttrs();
	const headingAttrs = tabMenuHeadingAttrs();
	const itemContentAttrs = tabMenuItemContentAttrs();
</script>

<button
	bind:this={buttonEl}
	{@attach popover.attachTrigger}
	type="button"
	aria-haspopup="menu"
	aria-expanded={popover.isOpen}
	aria-controls={menuId}
	data-tab-menu=""
	tabindex={hasSelectedOption ? 0 : -1}
	onclick={handleToggle}
	{...theme}
	class={cx(theme.class, triggerAttrs.class, className)}
	style={mergeStyle(triggerAttrs.style, styleProp as string | undefined)}
>
	<span aria-hidden="true" class={hoverBgAttrs.class} style={hoverBgAttrs.style}></span>
	<span class={triggerLabelAttrs.class} style={triggerLabelAttrs.style}>
		<span class={triggerLabelTextAttrs.class} style={triggerLabelTextAttrs.style}
			>{triggerLabel}</span
		>
		<span
			aria-hidden="true"
			class={triggerLabelSizerAttrs.class}
			style={triggerLabelSizerAttrs.style}>{triggerLabel}</span
		>
	</span>
	<span aria-hidden="true" class={chevronAttrs.class} style={chevronAttrs.style}>
		<Icon
			icon="chevronDown"
			size="sm"
			color="inherit"
			xstyle={[tabMenuChevronIconStyle, popover.isOpen && tabMenuChevronOpenStyle]}
		/>
	</span>
	{#if hasSelectedOption}
		<span
			{...indicatorTheme}
			class={cx(indicatorTheme.class, indicatorAttrs.class)}
			style={indicatorAttrs.style}
		></span>
	{/if}
</button>

<PopoverLayer {popover} placement="below" alignment="start">
	<div
		{@attach list.attachList}
		id={menuId}
		role="menu"
		aria-label={label}
		onkeydown={handleMenuKeyDown}
		onfocusin={list.handleFocus}
		{...dropdownTheme}
		class={cx(dropdownTheme.class, dropdownAttrs.class)}
		style={dropdownAttrs.style}
	>
		<span role="presentation" class={headingAttrs.class} style={headingAttrs.style}>{label}</span>
		{#each options as option (option.value)}
			{@const isSelected = tabList().value === option.value}
			{@const itemAttrs = tabMenuItemAttrs(isSelected)}
			<!--
				The menu is single-select: exactly one option can be the active tab, so
				options are radio menu items with aria-checked (APG menu-button), not
				plain menuitems with aria-current.
			-->
			<div
				role="menuitemradio"
				tabindex={-1}
				aria-checked={isSelected}
				onclick={() => handleSelect(option.value)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleSelect(option.value);
					}
				}}
				{...itemTheme}
				class={cx(itemTheme.class, itemAttrs.class)}
				style={itemAttrs.style}
			>
				<span class={itemContentAttrs.class} style={itemContentAttrs.style}>
					{#if option.icon}
						{#if typeof option.icon === 'string'}
							<Icon icon={option.icon} size="sm" color="secondary" />
						{:else}
							{@render option.icon()}
						{/if}
					{/if}
					{option.label}
				</span>
				{#if isSelected}
					<Icon icon="check" size="sm" color="accent" />
				{/if}
			</div>
		{/each}
	</div>
</PopoverLayer>
