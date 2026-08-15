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
		/** Right-side content (badges, counts). */
		endContent?: Snippet;
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
	import Tooltip from '../tooltip/tooltip.svelte';
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
		sideNavItemRowAttrs,
		sideNavItemSplitActionAttrs
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
	 * - **Collapsible with a primary action** → the split-action row: a `<div>`
	 *   carrying the nav-item styling with the link and the chevron toggle as
	 *   siblings, because a `<button>` cannot be nested inside an `<a>`.
	 * - **Otherwise** → a single link or button; when it is collapsible without a
	 *   primary action, clicking it toggles the children instead of navigating.
	 *
	 * **Rest props reach the wrapper `<div>`, where upstream drops them.**
	 * `SideNavItemProps extends BaseProps<HTMLElement>` on both sides, but upstream
	 * destructures a closed list with no spread, so `id`/`aria-*`/handlers — and
	 * `xstyle`/`class`/`style` — are all discarded. We forward, as `DropdownMenu`
	 * and `Timestamp` do. `data-testid` stays on the *item* element, which is
	 * where upstream routes it. See port/debts.md → Known debts.
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
		dialogLabel: `${label} submenu`
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
	const iconColor = $derived(isSelected ? 'primary' : isDisabled ? 'disabled' : 'secondary');

	// When collapsible *and* a primary action (href or onclick) are both set, the
	// action and the toggle are independent: the label navigates, the chevron
	// expands.
	const hasPrimaryAction = $derived(!!href || !!onclick);
	const hasIndependentToggle = $derived(isItemCollapsible && hasPrimaryAction && !isCollapsed);

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

	// Hover handlers for the collapsed popover (mirrors the TopNavMenu pattern).
	// Plain `let`s — upstream's two refs.
	let showTimeout: ReturnType<typeof setTimeout> | null = null;
	let hideTimeout: ReturnType<typeof setTimeout> | null = null;

	function clearPopoverTimeouts(): void {
		if (showTimeout) {
			clearTimeout(showTimeout);
			showTimeout = null;
		}
		if (hideTimeout) {
			clearTimeout(hideTimeout);
			hideTimeout = null;
		}
	}

	$effect(() => () => clearPopoverTimeouts());

	function handlePopoverMouseEnter(): void {
		clearPopoverTimeouts();
		showTimeout = setTimeout(() => {
			popover.show({ skipAutoFocus: true });
		}, 150);
	}

	function handlePopoverMouseLeave(): void {
		clearPopoverTimeouts();
		hideTimeout = setTimeout(() => {
			popover.hide();
		}, 200);
	}

	const theme = $derived(
		themeProps('side-nav-item', { size, selected: isSelected ? 'selected' : null })
	);
	const rootAttrs = $derived(sideNavItemRootAttrs(xstyle));
	const rowAttrs = $derived(sideNavItemRowAttrs(size, isSelected, isDisabled));
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
	<!-- Collapsed, with children — an icon-only trigger and a flyout. -->
	<div
		{...rest}
		class={cx(rootAttrs.class, className)}
		style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	>
		<button
			{@attach popover.attachTrigger}
			type="button"
			onclick={popover.toggle}
			onmouseenter={handlePopoverMouseEnter}
			onmouseleave={handlePopoverMouseLeave}
			aria-label={label}
			data-testid={testId}
			{...popover.triggerProps}
			{...collapsedItemAttrs}
		>
			{#if displayIcon}{@render iconSlot(displayIcon)}{/if}
		</button>
		<PopoverLayer {popover} placement="end" alignment="start">
			<div
				class={popoverSurfaceAttrs.class}
				style={popoverSurfaceAttrs.style}
				onmouseenter={handlePopoverMouseEnter}
				onmouseleave={handlePopoverMouseLeave}
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
		{...rest}
		class={cx(rootAttrs.class, className)}
		style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	>
		<NavItemElement
			{href}
			{as}
			{isDisabled}
			onclick={handleClick}
			attrs={{
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
		{...rest}
		class={cx(rootAttrs.class, className)}
		style={mergeStyle(rootAttrs.style, styleProp as string | undefined)}
	>
		{#if hasIndependentToggle}
			<!--
				Split-action row: the primary element and the chevron toggle as
				siblings inside a <div> carrying the nav-item styling, because a
				<button> cannot be nested inside an <a>.
			-->
			<div data-testid={testId} {...rowItemAttrs}>
				<NavItemElement
					{href}
					{as}
					{isDisabled}
					onclick={handleClick}
					attrs={{
						'aria-current': isSelected ? 'page' : undefined,
						class: splitActionAttrs.class,
						style: splitActionAttrs.style
					}}
				>
					{@render itemContent()}
				</NavItemElement>
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
			</div>
		{:else}
			<NavItemElement
				{href}
				{as}
				{isDisabled}
				onclick={handleClick}
				attrs={{
					'aria-current': isSelected ? 'page' : undefined,
					'aria-disabled': isDisabled || undefined,
					'aria-expanded': isItemCollapsible ? !isItemCollapsed : undefined,
					'aria-controls': isItemCollapsible ? `${id}-children` : undefined,
					'data-testid': testId,
					...rowItemAttrs
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
