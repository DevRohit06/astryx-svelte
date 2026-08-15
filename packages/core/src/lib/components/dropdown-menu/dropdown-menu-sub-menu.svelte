<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { IconName } from '../icon/icon-registry.js';

	export interface DropdownMenuSubMenuProps extends Pick<BaseProps, 'xstyle' | 'class' | 'style'> {
		/**
		 * Icon before the label on the trigger row — a registry name, or a snippet
		 * for a custom icon. Upstream's `ReactNode | IconType`.
		 */
		icon?: Snippet | IconName;
		/** Primary label text for the trigger row. */
		label: string | Snippet;
		/** Secondary description text displayed below the label. */
		description?: string | Snippet;
		/**
		 * Whether the submenu is disabled. A disabled submenu renders its trigger
		 * row but never opens the flyout.
		 * @default false
		 */
		isDisabled?: boolean;
		/**
		 * Show a spinner in place of the caret, e.g. while a lazy submenu's
		 * children are loading. Ported from the legacy `hasSpinner` async-submenu
		 * affordance.
		 * @default false
		 */
		hasSpinner?: boolean;
		/** Fixed flyout width. Defaults to sizing to its content (min 160px). */
		menuWidth?: number | string;
		/** Called when the flyout opens or closes. */
		onOpenChange?: (isOpen: boolean) => void;
		/** Test id for the trigger row. */
		'data-testid'?: string;
		/** Test id for the flyout menu. */
		menuDataTestId?: string;
		/**
		 * The flyout's menu items — the same components used at the top level
		 * (`DropdownMenuItem`, `DropdownMenuSubMenu`, selectable items, etc.).
		 *
		 * Data-mode parity lives one level up: give a `DropdownMenu`/`ContextMenu`
		 * item a nested `items` array and it renders a `DropdownMenuSubMenu` with
		 * these children automatically — so the data path never has to reach into
		 * this component.
		 */
		children: Snippet;
	}
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import Icon from '../icon/icon.svelte';
	import Item from '../item/item.svelte';
	import Layer from '../layer/layer.svelte';
	import Spinner from '../spinner/spinner.svelte';
	import { layerAnimations } from '../layer/layer-animations.stylex.js';
	import { useLayer } from '../layer/use-layer.svelte.js';
	import { useListFocus } from '../../hooks/use-list-focus.svelte.js';
	import { useTypeahead } from '../../hooks/use-typeahead.js';
	import { isRtlElement } from '../../hooks/is-rtl-element.js';
	import { useMenuHover } from '../../internal/use-menu-hover.svelte.js';
	import { cx } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import {
		setDropdownMenuContext,
		useDropdownMenuContext
	} from './dropdown-menu-context.svelte.js';
	import { focusMenuItemOnHover } from './menu-item-hover.js';
	import {
		MENU_BOUNDARY_SELECTOR,
		MENU_ITEM_ROLES,
		MENU_ITEM_SELECTOR
	} from './menu-item-roles.js';
	import {
		dropdownMenuSubMenuOffset,
		subMenuCaretAttrs,
		subMenuFlyoutAttrs,
		subMenuPopoverXstyle,
		subMenuTriggerXstyle
	} from './dropdown-menu-sub-menu.stylex.js';

	/**
	 * A single menu row that reveals a nested flyout of its own items. The row
	 * adopts `DropdownMenuItem` semantics (label / icon / description /
	 * isDisabled); its `children` become the flyout content. Place inside a
	 * `DropdownMenu` (or `ContextMenu`) alongside plain items.
	 *
	 * One component, not three — the row is promoted into a nested surface by
	 * having children, the way `SideNavItem` and `TreeListItem` do, rather than a
	 * Sub / SubTrigger / SubContent split. For data-driven menus don't use this
	 * directly: give a menu item a nested `items` array and `RenderDropdownItems`
	 * renders the submenu for you.
	 *
	 * Built on existing primitives — no bespoke floating code. Positioning is
	 * `useLayer` context mode (inline-end with viewport auto-flip, RTL-correct by
	 * default); pointer intent is `useMenuHover`; keyboard is a per-level
	 * `useListFocus` + `useTypeahead`.
	 *
	 * @example
	 * ```svelte
	 * <DropdownMenu button={{ label: 'Actions' }}>
	 *   {#snippet children()}
	 *     <DropdownMenuItem label="Rename" onClick={rename} />
	 *     <DropdownMenuSubMenu label="Move to" icon="folder">
	 *       <DropdownMenuItem label="Folder A" onClick={() => move('a')} />
	 *     </DropdownMenuSubMenu>
	 *   {/snippet}
	 * </DropdownMenu>
	 * ```
	 */
	const {
		icon,
		label,
		description,
		isDisabled = false,
		hasSpinner = false,
		menuWidth,
		onOpenChange,
		children,
		xstyle,
		class: className,
		style: styleProp,
		'data-testid': testId,
		menuDataTestId
	}: DropdownMenuSubMenuProps = $props();

	const menuCtx = useDropdownMenuContext();
	const menuSize = $derived(menuCtx()?.menuSize ?? 'md');
	const canOpen = $derived(!isDisabled);

	// Upstream mints `contentId` and `triggerId` with two `useId` calls and lets
	// `useLayer` mint a third internally. `$props.id()` may be called once, so all
	// three derive from a single uid — `ContextMenu`'s arrangement.
	const uid = $props.id();
	const layerId = `${uid}-layer`;
	const contentId = `${uid}-content`;
	const triggerId = `${uid}-trigger`;

	let triggerEl = $state<HTMLElement | null>(null);
	let menuEl = $state<HTMLElement | null>(null);
	let isOpen = $state(false);

	const layer = useLayer(() => ({
		mode: 'context',
		id: layerId,
		lightDismiss: false,
		onShow: () => {
			isOpen = true;
			onOpenChange?.(true);
		},
		onHide: () => {
			isOpen = false;
			onOpenChange?.(false);
		}
	}));

	function showLayer(): void {
		if (canOpen) {
			layer.show();
		}
	}

	function hideLayer(): void {
		layer.hide();
	}

	function open(options?: { focusFirst?: boolean }): void {
		if (!canOpen) {
			return;
		}
		layer.show();
		if (options?.focusFirst) {
			requestAnimationFrame(() => {
				// Move focus into the flyout. When it has no focusable items yet
				// (e.g. an async submenu showing only a disabled "Loading…" row via
				// hasSpinner), focusFirst() finds nothing — fall back to focusing the
				// flyout container itself so keyboard ownership still transfers off
				// the parent list. Otherwise the parent would keep focus, letting
				// arrow keys rove the parent while the empty flyout stays open.
				const focusedItem = list.focusFirst();
				if (!focusedItem) {
					menuEl?.focus();
				}
			});
		}
	}

	function close(options?: { focusTrigger?: boolean }): void {
		layer.hide();
		if (options?.focusTrigger !== false) {
			triggerEl?.focus();
		}
	}

	// Dedicated roving-focus + typeahead for this flyout level. The boundary
	// selector scopes item collection and key handling to this flyout's own
	// `role="menu"` — so a submenu nested inside this one (also inline, also
	// `role="menu"`) doesn't pollute this level's items or double-handle keys.
	const list = useListFocus(() => ({
		itemSelector: MENU_ITEM_SELECTOR,
		boundarySelector: MENU_BOUNDARY_SELECTOR,
		wrap: false,
		onEscape: () => close({ focusTrigger: true })
	}));

	const typeahead = useTypeahead(() => ({
		getItemLabels: () => list.getItems().map((el) => el.textContent),
		onMatch: list.focusItem,
		getCurrentIndex: () =>
			list
				.getItems()
				.findIndex((el) => el === document.activeElement || el.contains(document.activeElement))
	}));

	// Hover-intent: entering the trigger opens after a short delay; leaving
	// either surface closes after a delay. Hover-open does not steal focus.
	const menuHover = useMenuHover(() => ({
		show: showLayer,
		hide: hideLayer,
		isOpen,
		isEnabled: canOpen
	}));

	function handleTriggerClick(): void {
		if (isDisabled) {
			return;
		}
		// Click toggles the flyout, moving focus into it on open.
		if (isOpen) {
			close({ focusTrigger: true });
		} else {
			open({ focusFirst: true });
		}
	}

	// Move the single focus-driven highlight onto the trigger as the pointer
	// enters it, so a sibling item that still holds focus doesn't stay
	// highlighted alongside the hovered trigger. This is separate from the
	// hover-open intent (onmouseenter/onmouseleave) — the flyout still opens on
	// the hover delay; this only keeps the highlight single.
	function handlePointerMove(e: PointerEvent): void {
		focusMenuItemOnHover(e, isDisabled);
	}

	function handleTriggerKeyDown(e: KeyboardEvent): void {
		if (isDisabled) {
			return;
		}
		const openKey = isRtlElement(triggerEl) ? 'ArrowLeft' : 'ArrowRight';
		if (e.key === openKey || e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			// The trigger row is a direct child of the parent menu (not a nested
			// role="menu"), so the parent's key handler would otherwise also act on
			// this event (e.g. Enter clicking the focused row). Stop it here — this
			// level fully handles opening the flyout.
			e.stopPropagation();
			open({ focusFirst: true });
		}
	}

	// Enter/Space activate the focused row; typeahead jumps by first character;
	// the close key (Left, or Right in RTL) returns focus to the trigger;
	// arrows/Home/End defer to useListFocus (RTL-aware).
	//
	// The flyout renders inline (useLayer context mode is a native popover, not a
	// portal), so a submenu nested inside this one bubbles its key events up to
	// this handler. `ownsEvent` (from useListFocus, scoped by boundarySelector)
	// tells us whether the event originated in THIS flyout or a deeper one; we
	// only act on our own, letting the deeper level keep ownership. No manual
	// stopPropagation needed — each level self-filters.
	function handleContentKeyDown(e: KeyboardEvent): void {
		if (!list.ownsEvent(e)) {
			return;
		}
		// Escape closes just this submenu and returns focus to its trigger (APG:
		// Escape collapses the current level, not the whole stack). The root
		// popover's focus-trap listens for Escape at the document level and bails
		// when the event is already handled, so we mark it handled here (stop
		// propagation + preventDefault) to keep the parent menu open.
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			close({ focusTrigger: true });
			return;
		}
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			const focused = document.activeElement as HTMLElement | null;
			if (focused && MENU_ITEM_ROLES.has(focused.getAttribute('role') ?? '')) {
				focused.click();
			}
			return;
		}
		const closeKey = isRtlElement(menuEl) ? 'ArrowRight' : 'ArrowLeft';
		if (e.key === closeKey) {
			e.preventDefault();
			close({ focusTrigger: true });
			return;
		}
		if (typeahead.onKeyDown(e)) {
			e.preventDefault();
			return;
		}
		list.handleKeyDown(e);
	}

	// Re-provide the menu context so nested items behave exactly like top-level
	// ones. Selecting a leaf item must dismiss the WHOLE stack, not just this
	// flyout: close this level (without stealing focus back to the trigger) and
	// propagate up via the parent menu's closeMenu. Because every level
	// re-provides the context, this chains from the deepest flyout all the way to
	// the root DropdownMenu (whose closeMenu hides the popover).
	setDropdownMenuContext(() => ({
		menuSize,
		closeMenu: () => {
			close({ focusTrigger: false });
			menuCtx()?.closeMenu();
		}
	}));

	// Upstream's single `setTriggerEl` ref callback: store the row for focus
	// management AND wire it as the flyout's positioning anchor. `Item` spreads
	// its rest props onto the root, so the attachment travels there.
	const triggerAttach = {
		[createAttachmentKey()]: (el: HTMLElement) => {
			triggerEl = el;
			const detach = layer.attachTrigger(el);
			return () => {
				detach?.();
				triggerEl = null;
			};
		}
	};

	const itemTheme = $derived(themeProps('dropdown-menu-item', { size: menuSize }));
	const flyoutTheme = themeProps('dropdown-menu');
	const indicatorTheme = themeProps('dropdown-menu-indicator-icon');
	const caretAttrs = subMenuCaretAttrs();
	const flyoutAttrs = subMenuFlyoutAttrs();
	const triggerXstyle = $derived(subMenuTriggerXstyle(menuSize, isOpen, isDisabled, xstyle));
	const layerXstyle = $derived([subMenuPopoverXstyle(menuWidth), layerAnimations.end]);
</script>

{#snippet iconSlot()}
	{#if typeof icon === 'string'}
		<Icon {icon} size="sm" color="secondary" />
	{:else if icon}
		{@render icon()}
	{/if}
{/snippet}

{#snippet endAffordance()}
	<span
		{...indicatorTheme}
		class={cx(indicatorTheme.class, caretAttrs.class)}
		style={caretAttrs.style}
	>
		{#if hasSpinner}
			<Spinner size="sm" />
		{:else}
			<Icon icon="chevronRight" size="sm" color="secondary" />
		{/if}
	</span>
{/snippet}

<Item
	{...triggerAttach}
	id={triggerId}
	role="menuitem"
	tabindex={isDisabled ? undefined : -1}
	aria-haspopup="menu"
	aria-expanded={isOpen}
	aria-controls={isOpen ? contentId : undefined}
	aria-disabled={isDisabled || undefined}
	data-testid={testId}
	onmouseenter={menuHover.triggerProps.onmouseenter}
	onmouseleave={menuHover.triggerProps.onmouseleave}
	onpointermove={handlePointerMove}
	startContent={icon != null ? iconSlot : undefined}
	{label}
	{description}
	endContent={endAffordance}
	onclick={handleTriggerClick}
	onkeydown={handleTriggerKeyDown}
	{isDisabled}
	xstyle={triggerXstyle}
	class={cx(itemTheme.class, className)}
	style={styleProp as string | undefined}
	data-size={menuSize}
/>

<Layer
	{layer}
	placement="end"
	alignment="start"
	offset={dropdownMenuSubMenuOffset}
	xstyle={layerXstyle}
>
	<div
		bind:this={menuEl}
		{@attach list.attachList}
		id={contentId}
		role="menu"
		tabindex={-1}
		aria-labelledby={triggerId}
		onkeydown={handleContentKeyDown}
		onmouseenter={menuHover.contentProps.onmouseenter}
		onmouseleave={menuHover.contentProps.onmouseleave}
		data-testid={menuDataTestId}
		{...flyoutTheme}
		class={cx(flyoutTheme.class, flyoutAttrs.class)}
		style={flyoutAttrs.style}
	>
		{@render children()}
	</div>
</Layer>
