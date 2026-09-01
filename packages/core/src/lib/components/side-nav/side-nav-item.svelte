<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { IconName } from '../icon/icon-registry.js';
	import type { LinkComponentType } from '../link/types.js';
	import type { NavItemSize } from '../nav-item/nav-item.stylex.js';

	export interface SideNavItemProps extends Omit<BaseProps<HTMLElement>, 'onclick'> {
		/**
		 * Custom component to render instead of `<a>` for link items.
		 * Overrides the provider-level default set by `LinkProvider`.
		 * Only applies when `href` is provided.
		 */
		as?: LinkComponentType;
		/** Item label. */
		label: string;
		/**
		 * Icon (outline variant) — a registry name, or a snippet for a custom icon.
		 * Upstream's `ReactNode | IconType`; the Svelte icon-slot shape is
		 * `IconName | Snippet`, as `Button.icon` and `DropdownMenuItem.icon` are.
		 */
		icon?: IconName | Snippet;
		/** Icon when selected (filled variant). */
		selectedIcon?: IconName | Snippet;
		/**
		 * Current page indicator.
		 * @default false
		 */
		isSelected?: boolean;
		/**
		 * Whether the item is disabled.
		 * @default false
		 */
		isDisabled?: boolean;
		/** Navigation URL. */
		href?: string;
		/** Click handler. */
		onclick?: (event: MouseEvent) => void;
		/**
		 * Passive right-side content only (badges, counts). Interactive
		 * controls (icon buttons, menus) go in `actions`. `endContent`
		 * renders inside the primary link or button.
		 */
		endContent?: Snippet;
		/**
		 * Row-level secondary controls (icon buttons, menus) rendered as siblings
		 * of the primary element at the trailing edge of the row — after the
		 * expand/collapse toggle, and before any nested children in DOM and focus
		 * order. Content is passthrough: each control owns its accessible name,
		 * keyboard behavior, and disabled state. Hidden while the SideNav rail is
		 * collapsed.
		 *
		 * Controls inherit the row's control size through `SizeContext`, so an
		 * unsized icon button comes out the same box as the built-in
		 * expand/collapse toggle. An explicit `size` still wins.
		 */
		actions?: Snippet;
		/** Sub-items for nesting. */
		children?: Snippet;
		/**
		 * Enables collapse behaviour for items with children. When set, clicking
		 * the item (or its chevron, when it also has a primary action) toggles the
		 * sub-items.
		 *
		 * - `true` — collapsible with defaults (starts expanded)
		 * - Object — controlled/configured:
		 *   - `defaultIsCollapsed` — start collapsed (default: false)
		 *   - `isCollapsed` + `onCollapsedChange` — controlled mode
		 *
		 * @default false
		 */
		collapsible?:
			| boolean
			| {
					defaultIsCollapsed?: boolean;
					isCollapsed?: boolean;
					onCollapsedChange?: (isCollapsed: boolean) => void;
			  };
		/**
		 * Size variant for the nav item.
		 * @default 'md'
		 */
		size?: NavItemSize;
	}
</script>

<script lang="ts">
	import { useTranslator } from '../../i18n/index.js';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useAppShellMobile } from '../app-shell/app-shell-mobile-context.svelte.js';
	import Icon from '../icon/icon.svelte';
	import PopoverLayer from '../popover/popover-layer.svelte';
	import { usePopover } from '../popover/use-popover.svelte.js';
	import { useMenuHover } from '../../internal/use-menu-hover.svelte.js';
	import Tooltip from '../tooltip/tooltip.svelte';
	import SizeScope from '../../internal/size-scope.svelte';
	import NavItemElement from './nav-item-element.svelte';
	import {
		EXPANDED_COLLAPSE_STATE,
		useSideNavCollapse
	} from './side-nav-collapse-context.svelte.js';
	import SideNavCollapseScope from './side-nav-collapse-scope.svelte';
	import {
		sideNavItemChevronExpandedStyle,
		sideNavItemChevronStyle,
		sideNavItemChildrenAttrs,
		sideNavItemChildrenInnerAttrs,
		sideNavItemCollapsedAttrs,
		sideNavItemEndContentAttrs,
		sideNavItemExpandToggleAttrs,
		sideNavItemLabelAttrs,
		sideNavItemPopoverHeaderAttrs,
		sideNavItemPopoverSurfaceAttrs,
		sideNavItemRootAttrs,
		sideNavItemFocusableRowAttrs,
		sideNavItemPopoverGapStyle,
		sideNavItemRowAttrs,
		sideNavItemActionsRowAttrs,
		sideNavItemActionsAttrs,
		sideNavItemSplitActionAttrs,
		sideNavItemSplitActionSuppressedAttrs
	} from './side-nav-item.stylex.js';
	import { useSideNavRenderMode } from './side-nav-render-context.svelte.js';

	/**
	 * A navigation item for `SideNav` — icon, label, selected state, optional
	 * nesting and an end slot for badges or counts.
	 *
	 * Four shapes, and which one renders is worked out rather than configured:
	 *
	 * - **Collapsed with children** → an icon-only trigger opening a flyout that
	 *   repeats the label and lists the children, with the collapse context pinned
	 *   back to expanded inside it so nested rows do not collapse too.
	 * - **Collapsed without children** → an icon-only link/button with a tooltip.
	 *   An item with *no* icon renders nothing at all when collapsed — there would
	 *   be nothing to show. That test reads the raw `icon` prop, **not**
	 *   `displayIcon`, so an item carrying only a `selectedIcon` disappears when
	 *   collapsed even while selected. Upstream's condition verbatim.
	 * - **More than one row-level control** → the row wrapper: a `<div>` carrying
	 *   the nav-item styling with the link, the chevron toggle and the `actions`
	 *   slot as siblings, because a `<button>` cannot be nested inside an `<a>`.
	 *   It is reached by an independent toggle (collapsible *and* a primary
	 *   action), by `actions`, or by both, and every row-level control precedes
	 *   the nested children group in DOM and focus order.
	 * - **Otherwise** → a single link or button; when it is collapsible without a
	 *   primary action, clicking it toggles the children instead of navigating.
	 *
	 * **Rest props reach the item element**, which is where upstream lands them as
	 * of 0.4.2. Upstream destructured a closed list with no spread until then, so
	 * `id`/`aria-*`/handlers were all discarded; this port forwarded them to the
	 * wrapper `<div>` in the meantime, as the nearest working home. The 0.4.2
	 * hardening pass added `...rest` to the trigger, the link and the button, and
	 * this now matches. `xstyle`/`class`/`style` still reach the wrapper, which is
	 * a remaining divergence — upstream's collapsed-with-children wrapper takes
	 * neither. `data-testid` stays on the *item* element, as upstream routes it.
	 */
	let {
		as,
		label,
		icon,
		selectedIcon,
		isSelected = false,
		isDisabled = false,
		href,
		onclick,
		endContent,
		actions,
		children,
		collapsible: itemCollapsible,
		size = 'md',
		'data-testid': testId,
		xstyle,
		class: className,
		style: styleProp,
		...rest
	}: SideNavItemProps = $props();

	const t = useTranslator();
	const sideNavCollapse = useSideNavCollapse();
	const renderMode = useSideNavRenderMode();
	const appShellMobile = useAppShellMobile();
	const id = $props.id();
	// Svelte allows one `$props.id()` per component; the popover's id is derived
	// from it, which keeps both SSR-stable and unique.
	const popoverId = `${id}-popover`;

	const isCollapsed = $derived(sideNavCollapse().isCollapsed);
	const isInDrawer = $derived(renderMode() === 'drawer' || renderMode() === 'drawer-content');
	const hasChildren = $derived(children != null);

	// The wrapper element the collapsed tooltip anchors to. Seeded **`null`, not
	// `undefined`** — `Tooltip` discriminates sibling mode from wrapper mode on
	// `anchor !== undefined`, so an undefined seed makes the server and the first
	// client pass take the element-children branch, emit a stray `display:contents`
	// wrapper, and then tear the whole subtree down when `bind:this` lands. `null`
	// means "sibling mode, element not here yet", which is what upstream's
	// `anchorRef.current` says. Every other Tooltip consumer does the same.
	let itemEl = $state<HTMLDivElement | null>(null);

	// Popover for collapsed items with children.
	const popover = usePopover(() => ({
		id: popoverId,
		hasLightDismiss: true,
		hasAutoFocus: true,
		hasCloseButton: false,
		dialogLabel: t('@astryx.sideNavItem.submenuLabel', { label })
	}));

	// Collapse state for items with children.
	const itemCollapsibleConfig = $derived(
		typeof itemCollapsible === 'object' ? itemCollapsible : {}
	);
	const isItemCollapsible = $derived(hasChildren && itemCollapsible !== false);
	const isItemControlled = $derived(itemCollapsibleConfig.isCollapsed !== undefined);
	let uncontrolledCollapsed = $state(
		(typeof itemCollapsible === 'object' ? itemCollapsible.defaultIsCollapsed : undefined) ?? false
	);
	const isItemCollapsed = $derived(
		isItemControlled ? (itemCollapsibleConfig.isCollapsed ?? false) : uncontrolledCollapsed
	);

	function toggleItemCollapse(): void {
		const next = !isItemCollapsed;
		if (!isItemControlled) {
			uncontrolledCollapsed = next;
		}
		itemCollapsibleConfig.onCollapsedChange?.(next);
	}

	const displayIcon = $derived(isSelected && selectedIcon ? selectedIcon : icon);
	// `inherit` so a selected row's icon follows the row to HighlightText under
	// forced colors. Identical to `primary` otherwise: both token families are
	// emitted from one expression.
	const iconColor = $derived(isSelected ? 'inherit' : isDisabled ? 'disabled' : 'secondary');

	// When collapsible *and* a primary action (href or onclick) are both set, the
	// action and the toggle are independent: the label navigates, the chevron
	// expands.
	const hasPrimaryAction = $derived(!!href || !!onclick);
	const hasIndependentToggle = $derived(isItemCollapsible && hasPrimaryAction && !isCollapsed);
	const hasActions = $derived(!!actions);

	// Row-wrapper path: primary element + row controls as siblings.
	//
	// Used when the row carries more than one control: an independent
	// expand/collapse toggle (collapsible + href/onclick), consumer-supplied
	// actions, or both. A <div> is the styled flex row; the primary link or
	// button, the chevron toggle, and the actions slot render as siblings so no
	// interactive element nests inside another, and every row-level control
	// precedes the nested children group in DOM and focus order.
	const hasRowWrapper = $derived(hasIndependentToggle || hasActions);

	/**
	 * Cascaded to the `actions` slot through `SizeContext` so a consumer's row
	 * controls come out the same height as the built-in expand/collapse toggle,
	 * the way `SideNav` already cascades one size to its footer icons. An
	 * explicit `size` on a supplied control still wins.
	 *
	 * SYNC: `styles.expandToggle` carries the matching box.
	 */
	const ROW_CONTROL_SIZE = 'sm';

	function handleClick(event: MouseEvent): void {
		if (isDisabled) {
			event.preventDefault();
			return;
		}
		if (isItemCollapsible && !hasIndependentToggle && !isCollapsed) {
			event.preventDefault();
			toggleItemCollapse();
			return;
		}
		onclick?.(event);
		// Close the mobile nav when a nav item is activated inside the drawer.
		if (isInDrawer) {
			appShellMobile().closeMobileNav();
		}
	}

	function handleToggleClick(event: MouseEvent): void {
		event.preventDefault();
		event.stopPropagation();
		toggleItemCollapse();
	}

	// Pointer half only. The hook's `onkeydown`/`attachMenu` drive a `useListFocus`
	// over `[role="menuitem"]`, and this flyout is a focus-trapped dialog of
	// links — wiring them would swallow arrow keys rather than navigate with
	// them. Keyboard stays with `usePopover`'s trap, as in `DropdownMenuSubMenu`.
	const menuHover = useMenuHover(() => ({
		show: popover.show,
		hide: popover.hide,
		isOpen: popover.isOpen,
		isEnabled: isCollapsed && hasChildren,
		// Standard popover toggling: the flyout opens beside the rail, not over
		// the icon, so the click after a hover-open is a deliberate dismissal
		// rather than the #3121 confirmation the nav menus need.
		clickGuardMs: 0,
		ownsFocus: false
	}));

	const theme = $derived(
		themeProps('side-nav-item', {
			size,
			selected: isSelected ? 'selected' : null,
			disabled: isDisabled ? 'disabled' : null
		})
	);
	const rootAttrs = $derived(sideNavItemRootAttrs(xstyle));
	// Three shapes of the same row appearance: `rowAttrs` for the row-wrapper path
	// without actions, where the row is a plain <div> container and its children
	// take focus (so the ring belongs on them); `focusableRowAttrs` for the
	// ordinary path, where the row element is itself the focusable control; and
	// `actionsRowAttrs` for the same pill with the ring drawn for the primary
	// only. The wrapper is not a tab stop, so `:focus-visible` on it would never
	// match, and matching any descendant instead would light the whole row around
	// the chevron's or an action's own ring.
	const rowAttrs = $derived(sideNavItemRowAttrs(size, isSelected, isDisabled));
	const focusableRowAttrs = $derived(sideNavItemFocusableRowAttrs(size, isSelected, isDisabled));
	const actionsRowAttrs = $derived(sideNavItemActionsRowAttrs(size, isSelected, isDisabled));
	const collapsedAttrs = $derived(sideNavItemCollapsedAttrs(size, isSelected, isDisabled));
	const labelAttrs = sideNavItemLabelAttrs();
	const endContentAttrs = sideNavItemEndContentAttrs();
	const childrenAttrs = $derived(sideNavItemChildrenAttrs(isItemCollapsed));
	const childrenInnerAttrs = sideNavItemChildrenInnerAttrs();
	const chevronXstyle = $derived([
		sideNavItemChevronStyle,
		!isItemCollapsed && sideNavItemChevronExpandedStyle
	]);
	const expandToggleAttrs = sideNavItemExpandToggleAttrs();
	const splitActionAttrs = sideNavItemSplitActionAttrs();
	const splitActionSuppressedAttrs = sideNavItemSplitActionSuppressedAttrs();
	const actionsAttrs = sideNavItemActionsAttrs();
	const popoverSurfaceAttrs = sideNavItemPopoverSurfaceAttrs();
	const popoverHeaderAttrs = sideNavItemPopoverHeaderAttrs();

	// The item element's own attributes — the theme class plus the nav-item
	// styling. Rest props are deliberately *not* here; they go on the wrapper.
	const collapsedItemAttrs = $derived({
		...theme,
		class: cx(theme.class, collapsedAttrs.class),
		style: collapsedAttrs.style
	});
	const rowItemAttrs = $derived({
		...theme,
		class: cx(theme.class, rowAttrs.class),
		style: rowAttrs.style
	});
	const focusableRowItemAttrs = $derived({
		...theme,
		class: cx(theme.class, focusableRowAttrs.class),
		style: focusableRowAttrs.style
	});
	const actionsRowItemAttrs = $derived({
		...theme,
		class: cx(theme.class, actionsRowAttrs.class),
		style: actionsRowAttrs.style
	});

	// aria-expanded/-controls stay on the primary element only when the whole row
	// is the collapse toggle (no independent chevron button).
	const rowPrimaryAriaProps = $derived(
		hasIndependentToggle
			? { 'aria-current': isSelected ? ('page' as const) : undefined }
			: {
					'aria-current': isSelected ? ('page' as const) : undefined,
					'aria-disabled': isDisabled || undefined,
					'aria-expanded': isItemCollapsible ? !isItemCollapsed : undefined,
					'aria-controls': isItemCollapsible ? `${id}-children` : undefined
				}
	);
	const rowPrimaryStyleAttrs = $derived(hasActions ? splitActionSuppressedAttrs : splitActionAttrs);
</script>

{#snippet iconSlot(slot: IconName | Snippet)}
	{#if typeof slot === 'string'}
		<Icon icon={slot} size="sm" color={iconColor} />
	{:else}
		{@render slot()}
	{/if}
{/snippet}

{#snippet itemContent()}
	{#if displayIcon}{@render iconSlot(displayIcon)}{/if}
	{#if !isCollapsed}
		<span class={labelAttrs.class} style={labelAttrs.style}>{label}</span>
	{/if}
	{#if !isCollapsed && endContent}
		<span class={endContentAttrs.class} style={endContentAttrs.style}>
			{@render endContent()}
		</span>
	{/if}
	{#if !isCollapsed && isItemCollapsible && !hasIndependentToggle}
		<Icon icon="chevronDown" size="lg" color="inherit" xstyle={chevronXstyle} />
	{/if}
{/snippet}

{#if isCollapsed && !icon}
	<!-- In collapsed mode: hide items without icons. -->
{:else if isCollapsed && hasChildren}
	<!--
		Collapsed, with children — an icon-only trigger and a flyout.

		`{...rest}` sits on the trigger, not this wrapper. Upstream dropped rest
		entirely until 0.4.2, so this port carried it on the wrapper as the nearest
		working home; 0.4.2 landed it on the interactive element, which is where a
		consumer's `aria-*`, `title` or handler actually belongs.
	-->
	<div
		class={cx(rootAttrs.class, className)}
		style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	>
		<button
			{@attach popover.attachTrigger}
			type="button"
			{...rest}
			onclick={menuHover.triggerProps.onclick}
			onmouseenter={menuHover.triggerProps.onmouseenter}
			onmouseleave={menuHover.triggerProps.onmouseleave}
			aria-label={label}
			data-testid={testId}
			{...popover.triggerProps}
			{...collapsedItemAttrs}
		>
			{#if displayIcon}{@render iconSlot(displayIcon)}{/if}
		</button>
		<PopoverLayer {popover} placement="end" alignment="start" xstyle={sideNavItemPopoverGapStyle}>
			<div
				class={popoverSurfaceAttrs.class}
				style={popoverSurfaceAttrs.style}
				onmouseenter={menuHover.contentProps.onmouseenter}
				onmouseleave={menuHover.contentProps.onmouseleave}
				onclick={() => popover.hide()}
			>
				<div class={popoverHeaderAttrs.class} style={popoverHeaderAttrs.style}>{label}</div>
				<SideNavCollapseScope state={EXPANDED_COLLAPSE_STATE}>
					{#if children}{@render children()}{/if}
				</SideNavCollapseScope>
			</div>
		</PopoverLayer>
	</div>
{:else if isCollapsed}
	<!-- Collapsed, no children — an icon-only link/button with a tooltip. -->
	<div
		bind:this={itemEl}
		class={cx(rootAttrs.class, className)}
		style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	>
		<NavItemElement
			{href}
			{as}
			{isDisabled}
			onclick={handleClick}
			attrs={{
				...rest,
				'aria-current': isSelected ? 'page' : undefined,
				'aria-disabled': isDisabled || undefined,
				'aria-label': label,
				'data-testid': testId,
				...collapsedItemAttrs
			}}
		>
			{#if displayIcon}{@render iconSlot(displayIcon)}{/if}
		</NavItemElement>
		<Tooltip content={label} placement="end" anchor={itemEl} />
	</div>
{:else}
	<div
		bind:this={itemEl}
		class={cx(rootAttrs.class, className)}
		style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	>
		{#if hasRowWrapper}
			<!--
				Row wrapper: the primary element, the chevron toggle and the actions
				slot as siblings inside a <div> carrying the nav-item styling, because
				a <button> cannot be nested inside an <a>.
			-->
			<div data-testid={testId} {...hasActions ? actionsRowItemAttrs : rowItemAttrs}>
				<NavItemElement
					{href}
					{as}
					{isDisabled}
					onclick={handleClick}
					attrs={{
						...rest,
						...rowPrimaryAriaProps,
						class: rowPrimaryStyleAttrs.class,
						style: rowPrimaryStyleAttrs.style
					}}
				>
					{@render itemContent()}
				</NavItemElement>
				{#if hasIndependentToggle}
					<button
						type="button"
						onclick={handleToggleClick}
						aria-label={isItemCollapsed
							? t('@astryx.sideNavItem.expand', { label })
							: t('@astryx.sideNavItem.collapse', { label })}
						aria-expanded={!isItemCollapsed}
						aria-controls="{id}-children"
						class={expandToggleAttrs.class}
						style={expandToggleAttrs.style}
					>
						<Icon icon="chevronDown" size="lg" color="inherit" xstyle={chevronXstyle} />
					</button>
				{/if}
				{#if actions}
					<span class={actionsAttrs.class} style={actionsAttrs.style}>
						<SizeScope value={ROW_CONTROL_SIZE}>{@render actions()}</SizeScope>
					</span>
				{/if}
			</div>
		{:else}
			<NavItemElement
				{href}
				{as}
				{isDisabled}
				onclick={handleClick}
				attrs={{
					...rest,
					'aria-current': isSelected ? 'page' : undefined,
					'aria-disabled': isDisabled || undefined,
					'aria-expanded': isItemCollapsible ? !isItemCollapsed : undefined,
					'aria-controls': isItemCollapsible ? `${id}-children` : undefined,
					'data-testid': testId,
					...focusableRowItemAttrs
				}}
			>
				{@render itemContent()}
			</NavItemElement>
		{/if}

		{#if hasChildren}
			<div
				id="{id}-children"
				role="group"
				aria-labelledby="{id}-label"
				aria-hidden={isItemCollapsed}
				inert={isItemCollapsed ? true : undefined}
				class={childrenAttrs.class}
				style={childrenAttrs.style}
			>
				<div class={childrenInnerAttrs.class} style={childrenInnerAttrs.style}>
					<span id="{id}-label" hidden>{label}</span>
					{#if children}{@render children()}{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
