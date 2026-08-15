<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { ButtonProps } from '../button/button.svelte';
	import type { LayerAlignment, LayerPlacement } from '../layer/use-layer.svelte.js';
	import type { DropdownMenuOption } from './dropdown-menu-types.js';

	/** The trigger button's props, minus its click handler (owned internally). */
	export type DropdownMenuButtonProps = Omit<ButtonProps, 'onclick'>;

	export interface DropdownMenuProps extends BaseProps {
		/** Props for the trigger `Button`. Defaults to a localized "Menu" label. */
		button?: DropdownMenuButtonProps;
		/** Controlled open state. Omit for uncontrolled. */
		isMenuOpen?: boolean;
		/** Fired when the menu opens or closes. */
		onOpenChange?: (isOpen: boolean) => void;
		/** Menu width. Numbers are px, strings pass through. Defaults to the anchor width. */
		menuWidth?: number | string;
		/** Fired when the trigger is clicked (before open/close). */
		onClick?: () => void;
		/**
		 * Show the trailing chevron on the trigger (ignored when icon-only or when
		 * the button sets its own `endContent`).
		 * @default true
		 */
		hasChevron?: boolean;
		/**
		 * Placement of the menu relative to the trigger.
		 * @default 'below'
		 */
		placement?: LayerPlacement;
		/**
		 * Alignment along the placement axis.
		 * Uses the same alignment values as other Astryx layer-based components.
		 * @default 'start'
		 */
		alignment?: LayerAlignment;
		/** Data mode: the menu items. Mutually exclusive with `children`. */
		items?: DropdownMenuOption[];
		/** Compound mode: `DropdownMenuItem`s and friends. Mutually exclusive with `items`. */
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { createAttachmentKey } from 'svelte/attachments';
	import Button from '../button/button.svelte';
	import Icon from '../icon/icon.svelte';
	import PopoverLayer from '../popover/popover-layer.svelte';
	import RenderDropdownItems from './render-dropdown-items.svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { usePopover } from '../popover/use-popover.svelte.js';
	import { useListFocus } from '../../hooks/use-list-focus.svelte.js';
	import { useTypeahead } from '../../hooks/use-typeahead.js';
	import { layerAnimations } from '../layer/layer-animations.stylex.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { setDropdownMenuContext } from './dropdown-menu-context.svelte.js';
	import {
		MENU_BOUNDARY_SELECTOR,
		MENU_ITEM_ROLES,
		MENU_ITEM_SELECTOR
	} from './menu-item-roles.js';
	import {
		dropdownMenuAttrs,
		dropdownPopoverWidthStyle,
		dropdownPopoverGapStyle
	} from './dropdown-menu.stylex.js';

	/**
	 * A dropdown menu of actionable items, ported from Astryx's `DropdownMenu`.
	 *
	 * Two modes share one keyboard/focus path (`useListFocus` + `useTypeahead`):
	 * pass `items` for a data-driven menu, or `DropdownMenuItem` children for a
	 * compound one. Built on `Popover` (`role: 'none'` so the inner `role="menu"`
	 * is the exposed semantics), following the APG menu-button pattern.
	 *
	 * Initial focus on open follows the input modality: a keyboard open (Enter /
	 * Space / ArrowDown on the trigger) focuses the first enabled item (APG
	 * menu-button); a pointer open focuses the menu container itself so no item
	 * reads as pre-selected, and the first ArrowDown then moves to item 1.
	 */
	const {
		button: buttonFromProps,
		isMenuOpen: controlledIsOpen,
		onOpenChange,
		menuWidth,
		onClick,
		hasChevron = true,
		placement = 'below',
		alignment = 'start',
		items,
		children,
		class: className,
		style: styleProp,
		xstyle,
		'data-testid': testId,
		...rest
	}: DropdownMenuProps = $props();

	const t = useTranslator();
	const button = $derived(buttonFromProps ?? { label: t('@astryx.dropdownMenu.label') });

	// Two ids, as upstream has two. `usePopover` here *requires* one for the layer
	// (see `useLayer` for why the hook cannot mint it), where upstream's mints its
	// own — so passing the menu's id through would point `aria-controls` at the
	// layer wrapper instead of the `role="menu"` div upstream names. `$props.id()`
	// may be called only once per component, so the second is derived from it;
	// `TabMenu` already mints its `-menu` id exactly this way.
	const uid = $props.id();
	const layerId = uid;
	const menuId = `${uid}-menu`;
	const menuSize = $derived(button.size ?? 'md');

	// Open state — controlled iff `isMenuOpen` is defined.
	const isControlled = $derived(controlledIsOpen !== undefined);
	let internalIsOpen = $state(false);
	const isOpen = $derived(isControlled ? (controlledIsOpen as boolean) : internalIsOpen);

	// Suppress a trigger click that lands in the same tick as a light dismiss
	// (iOS Safari fires pointerdown → hide before the click), which would re-open.
	let lastHideTime = 0;

	// `onOpenChange` fires for BOTH modes, so an uncontrolled menu still reports a
	// native open/close transition (light dismiss, Escape, the popover's own
	// toggle) that never passes through `handleButtonClick`. In controlled mode a
	// button click therefore reports twice — once optimistically from the click,
	// once when the layer commits — which is upstream's behaviour as of 0.3.0.
	function handleLayerHide(): void {
		lastHideTime = Date.now();
		onOpenChange?.(false);
		if (!isControlled) internalIsOpen = false;
		buttonEl?.focus();
	}
	function handleLayerShow(): void {
		onOpenChange?.(true);
		if (!isControlled) internalIsOpen = true;
	}

	const popover = usePopover(() => ({
		id: layerId,
		// The popup's own role="menu" is the exposed semantics; a dialog wrapper
		// would announce an unnamed dialog around the menu.
		role: 'none',
		hasLightDismiss: true,
		hasCloseButton: false,
		hasAutoFocus: false,
		onShow: handleLayerShow,
		onHide: handleLayerHide
	}));

	function closeMenu(): void {
		popover.hide();
	}

	const list = useListFocus(() => ({
		itemSelector: MENU_ITEM_SELECTOR,
		boundarySelector: MENU_BOUNDARY_SELECTOR,
		wrap: false,
		onEscape: closeMenu
	}));

	// First-character typeahead reuses the hook's scoped item collection, so an
	// inline submenu flyout's items aren't swept into this level's targets.
	const getMenuItems = list.getItems;

	const typeahead = useTypeahead(() => ({
		getItemLabels: () => getMenuItems().map((el) => el.textContent),
		onMatch: list.focusItem,
		getCurrentIndex: () =>
			getMenuItems().findIndex(
				(el) => el === document.activeElement || el.contains(document.activeElement)
			)
	}));

	// Defer item focus until the layer has committed open, so focus restore
	// captures the trigger instead of the first menu item. Upstream's
	// `shouldFocusOnOpenRef`; a plain `let`, since a ref is not reactive state and
	// the effect below must fire on `popover.isOpen` alone.
	let shouldFocusOnOpen = false;

	// The menu container — the focus target for a pointer open, and the fallback
	// when no item is focusable. `DropdownMenuSubMenu`'s flyout has the same pair.
	let menuEl = $state<HTMLElement | null>(null);

	// How the next open was initiated. Keyboard (and programmatic) opens focus the
	// first enabled item per the APG menu-button pattern; pointer opens focus the
	// menu container instead, so no item is visually highlighted as if
	// pre-selected (#4477). Reset to 'keyboard' after every open so programmatic
	// controlled opens keep the item-focus behavior. A plain `let` — upstream's
	// `openModalityRef`, and like `shouldFocusOnOpen` it must not be a dependency
	// of the focus effect below.
	let openModality: 'keyboard' | 'pointer' = 'keyboard';

	// Sync controlled open state → popover.
	$effect(() => {
		if (!isControlled) return;
		const open = controlledIsOpen;
		untrack(() => {
			if (open && !popover.isOpen) {
				shouldFocusOnOpen = true;
				popover.show();
			} else if (!open && popover.isOpen) {
				popover.hide();
			}
		});
	});

	// Move focus into the menu only after the layer has committed open, honoring
	// the input modality: keyboard (and programmatic) opens land on the first
	// enabled item per the APG menu-button pattern; pointer opens focus the menu
	// container itself (`tabindex={-1}`) so no item is highlighted as if
	// pre-selected (#4477). Container focus keeps arrows, typeahead, Escape and
	// Tab in the menu's `onkeydown`, and is also the fallback when no item is
	// focusable (e.g. all disabled), mirroring the submenu flyout fallback.
	//
	// `popover.isOpen` is the sole tracked read — `shouldFocusOnOpen` and
	// `openModality` are plain `let`s, so testing them here creates no dependency
	// and needs no `untrack`.
	$effect(() => {
		if (!popover.isOpen || !shouldFocusOnOpen) return;
		shouldFocusOnOpen = false;
		requestAnimationFrame(() => {
			if (openModality === 'pointer' || !list.focusFirst()) {
				menuEl?.focus();
			}
			openModality = 'keyboard';
		});
	});

	function openAndFocus(modality: 'keyboard' | 'pointer' = 'keyboard'): void {
		openModality = modality;
		shouldFocusOnOpen = true;
		popover.show();
	}

	function handleButtonClick(e: MouseEvent): void {
		if (Date.now() - lastHideTime < 50) return;
		onClick?.();
		// `detail === 0` marks a synthesized click (screen reader / AT activation):
		// treat it as keyboard so those users still land on the first item. Real
		// pointer clicks report detail >= 1. Upstream tests the event here rather
		// than reading `utils/interaction-modality.ts` — followed as written.
		const modality = e.detail === 0 ? 'keyboard' : 'pointer';
		if (isControlled) {
			if (!controlledIsOpen) openModality = modality;
			onOpenChange?.(!controlledIsOpen);
		} else if (popover.isOpen) {
			popover.hide();
		} else {
			openAndFocus(modality);
		}
	}

	function handleButtonKeyDown(e: KeyboardEvent): void {
		if (!popover.isOpen && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			openAndFocus();
		}
	}

	// Enter/Space activation + Tab-closes + typeahead layered over roving nav.
	function listKeyDown(e: KeyboardEvent): void {
		// A submenu flyout renders inline inside this menu; its key events bubble
		// up here. Let that level own them — only handle events from this level.
		if (!list.ownsEvent(e)) {
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
		// APG menu-button: Tab closes and restores focus to the trigger; the
		// browser's default Tab then continues from there. Do NOT preventDefault.
		if (e.key === 'Tab') {
			closeMenu();
			return;
		}
		if (typeahead.onKeyDown(e)) {
			e.preventDefault();
			return;
		}
		list.handleKeyDown(e);
	}

	// The trigger element — captured for focus restoration, and the popover anchor.
	let buttonEl = $state<HTMLButtonElement>();
	const triggerAttachKey = createAttachmentKey();
	const buttonAttach = {
		[triggerAttachKey]: (el: HTMLElement) => {
			buttonEl = el as HTMLButtonElement;
			return popover.attachTrigger(el);
		}
	};

	const isIconOnly = $derived(button.isIconOnly === true);

	// Context for compound items.
	setDropdownMenuContext(() => ({ closeMenu, menuSize }));

	const menuAttrs = $derived(dropdownMenuAttrs(xstyle));
	const themeClass = themeProps('dropdown-menu').class;
	const layerXstyle = $derived([
		dropdownPopoverWidthStyle(menuWidth),
		dropdownPopoverGapStyle(placement === 'above' || placement === 'below'),
		layerAnimations[placement]
	]);
</script>

{#snippet chevron()}
	<Icon icon="chevronDown" size="sm" color="inherit" />
{/snippet}

<Button
	{...button}
	{...buttonAttach}
	tooltip={isOpen ? undefined : button.tooltip}
	endContent={button.endContent ?? (hasChevron && !isIconOnly ? chevron : undefined)}
	onclick={handleButtonClick}
	onkeydown={handleButtonKeyDown}
	aria-haspopup="menu"
	aria-expanded={isOpen}
	aria-controls={menuId}
	data-testid={testId}
/>

<PopoverLayer {popover} {placement} {alignment} xstyle={layerXstyle}>
	<!--
		`rest` is spread **first**, upstream's position for it as of 0.2.0, so the
		menu's own `role`/`aria-label`/`id` cannot be overwritten by a consumer
		attribute — the same hazard `Divider`'s spread-order fix addresses. This
		port spread it last while upstream dropped rest here entirely.
	-->
	<div
		{...rest}
		bind:this={menuEl}
		id={menuId}
		role="menu"
		tabindex={-1}
		aria-label={button.label}
		onkeydown={listKeyDown}
		class={cx(themeClass, menuAttrs.class, className)}
		style={mergeStyle(menuAttrs.style, styleProp as string | undefined)}
		{@attach list.attachList}
	>
		{#if items !== undefined}
			<RenderDropdownItems {items} />
		{:else}
			{@render children?.()}
		{/if}
	</div>
</PopoverLayer>
