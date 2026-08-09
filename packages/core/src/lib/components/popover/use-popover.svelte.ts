import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { StyleArg } from '../../internal/sx.js';
import { useFocusTrap } from '../../hooks/use-focus-trap.svelte.js';
import { useTranslator } from '../../i18n/use-translator.svelte.js';
import { useLayer, type ContextLayerReturn } from '../layer/use-layer.svelte.js';
import { devWarn } from '../../utils/dev-warning.js';

/**
 * Popover dialogs with focus trapping, ported from Astryx's
 * `Popover/usePopover.tsx`.
 *
 * Combines `useLayer` (CSS anchor positioning over the native Popover API) with
 * `useFocusTrap`, adds auto-focus-on-open, Escape-to-close, and a hidden close
 * button that reveals on focus. Used by `Popover`, and later by `Selector`,
 * `DropdownMenu`, `DateInput`, etc.
 *
 * The translations this port has already made everywhere apply here too:
 *
 * **`render` is gone; `<PopoverLayer>` replaces it.** A Svelte hook cannot
 * return markup, so upstream's `render(children, props)` becomes a component and
 * the hook hands it what the closure captured — the `layer`, the focus-trap
 * container attachment, the resolved dialog semantics (`role`/`isModal`/
 * `dialogLabel`), the surface flags (`hasSurface`/`hasCloseButton`/
 * `closeButtonLabel`), and the option `xstyle`. This is the same split
 * `useLayer`→`<Layer>` and `useHoverCard`→`<HoverCardLayer>` took.
 *
 * **`triggerRef` becomes `attachTrigger`.** Upstream's combined ref callback set
 * `triggerElementRef.current` and called `layer.ref(el)`; the element ref was
 * never read anywhere in the hook (dead), so `attachTrigger` is `layer.attachTrigger`
 * directly. It stays usable both declaratively (`{@attach}`) and imperatively —
 * the component calls it with an element and the returned cleanup to detach, as
 * upstream calls `triggerRef(el)`/`triggerRef(null)`.
 *
 * **`contentRef` becomes `attachContent`** — `useFocusTrap`'s `attachContainer`.
 *
 * **The id is minted by `useLayer`**, which requires it be passed in; see that
 * module. `usePopover` does not take an `id` option upstream (it calls `useId`
 * inside `useLayer`), so the hook accepts one here and every component consumer
 * passes `$props.id()`.
 *
 * **Every option is read at use time through the getter**, which is what
 * upstream's `useCallback`/`useEffect` dependency arrays buy.
 */

/**
 * Options for `usePopover`.
 */
export interface UsePopoverOptions {
	/**
	 * SSR-stable unique id for the popover layer — the `aria-controls` target the
	 * trigger points at. Pass `$props.id()` from the calling component; see
	 * `useLayer` for why the hook cannot mint it itself. (Upstream has no `id`
	 * option because `useLayer` calls `useId` internally; this port cannot.)
	 */
	id: string;

	/** Callback fired when popover is shown. */
	onShow?: () => void;

	/**
	 * Callback fired when popover is hidden.
	 * Use this to return focus to the trigger element.
	 */
	onHide?: () => void;

	/**
	 * StyleX styles applied to the popover's content wrapper.
	 * Merges after the surface styles (when hasSurface is true), so these
	 * can override background, radius, etc.
	 *
	 * For styles on the layer's positioned element (e.g., animations using
	 * `:popover-open`), pass `xstyle` via `<PopoverLayer>` instead.
	 */
	xstyle?: StyleArg;

	/**
	 * Whether clicking outside should dismiss the popover.
	 * @default true
	 */
	hasLightDismiss?: boolean;

	/**
	 * Whether pressing Escape dismisses the popover.
	 *
	 * Takes effect together with `hasLightDismiss: false`: with light dismiss
	 * on, the native popover uses `popover="auto"`, whose browser-level light
	 * dismiss also closes on Escape, so Escape handling stays registered to
	 * keep topmost-only dismissal intact. Set both to `false` for
	 * explicit-dismiss-only surfaces like onboarding coachmarks.
	 *
	 * @default true
	 */
	hasEscapeDismiss?: boolean;

	/**
	 * Whether to automatically focus the first focusable element when opened.
	 * @default true
	 */
	hasAutoFocus?: boolean;

	/**
	 * Whether to include a hidden close button for accessibility.
	 * The button appears when keyboard users tab past the last element.
	 * @default true
	 */
	hasCloseButton?: boolean;

	/**
	 * Label for the hidden close button.
	 * @default "Close popover"
	 */
	closeButtonLabel?: string;

	/**
	 * Accessible label for the dialog.
	 * Required for screen readers to announce the dialog purpose
	 * (only applies when `role` is `'dialog'`).
	 */
	dialogLabel?: string;

	/**
	 * ARIA role stamped on the popover content wrapper.
	 *
	 * - `'dialog'` (default): the wrapper is a `role="dialog"` and, when
	 *   `isModal` is true, carries `aria-modal`. Use for genuine dialog content.
	 * - `'none'`: the wrapper carries no role or `aria-modal`, so the popup's own
	 *   content role (e.g. a child `role="listbox"` or `role="menu"`) is the
	 *   exposed semantics. Use for comboboxes, listboxes, and menus — their
	 *   trigger keeps DOM focus, so announcing an unnamed modal dialog around
	 *   them is incorrect.
	 *
	 * @default 'dialog'
	 */
	role?: 'dialog' | 'none';

	/**
	 * Whether the dialog is modal (`aria-modal`). Only applies when `role` is
	 * `'dialog'`. Set to `false` for non-modal dialogs that do not inert the rest
	 * of the page.
	 *
	 * @default true
	 */
	isModal?: boolean;

	/**
	 * Whether to apply the default popover surface (background, border-radius,
	 * box-shadow) to the content wrapper.
	 *
	 * Set to false when the popover content provides its own surface styling
	 * (e.g., mega menus with custom layouts). If you find yourself opting out,
	 * consider whether useLayer is a better fit.
	 *
	 * @default true
	 */
	hasSurface?: boolean;
}

/**
 * Return type for `usePopover`.
 */
export interface UsePopoverReturn {
	/**
	 * Attach to the trigger element — sets up CSS anchor positioning. Upstream's
	 * `triggerRef`. Usable via `{@attach}` or imperatively (call with the element,
	 * call the returned cleanup to detach).
	 */
	readonly attachTrigger: Attachment<HTMLElement>;

	/**
	 * Attach to the popover content container — sets up focus trapping.
	 * `<PopoverLayer>` applies this. Upstream's `contentRef`.
	 */
	readonly attachContent: Attachment<HTMLElement>;

	/**
	 * The CSS anchor name to use for positioning.
	 * Use when you need to set anchorName manually (e.g., display:contents wrapper).
	 */
	readonly anchorId: string;

	/**
	 * Show the popover.
	 * @param options.skipAutoFocus - If true, don't auto-focus the first element.
	 *   Useful when triggered by mouse click on an input that should retain focus.
	 */
	show: (options?: { skipAutoFocus?: boolean }) => void;

	/** Hide the popover. */
	hide: () => void;

	/** Toggle the popover open/closed. */
	toggle: () => void;

	/** Whether the popover is currently open. */
	readonly isOpen: boolean;

	/** Unique ID for aria-controls / aria-describedby. */
	readonly id: string;

	/** ARIA attributes to spread on the trigger element. */
	readonly triggerProps: {
		'aria-haspopup': 'dialog' | 'true';
		'aria-expanded': boolean;
		'aria-controls': string;
	};

	/** The underlying layer. `<PopoverLayer>` hands it to `<Layer>`. */
	readonly layer: ContextLayerReturn;

	/** Resolved `role` — `<PopoverLayer>` stamps the content wrapper. */
	readonly role: 'dialog' | 'none';

	/** Resolved `isModal` — drives `aria-modal` on a dialog wrapper. */
	readonly isModal: boolean;

	/** The dialog's accessible label, when `role` is `'dialog'`. */
	readonly dialogLabel: string | undefined;

	/** Whether the default surface styles apply to the content wrapper. */
	readonly hasSurface: boolean;

	/** Whether the hidden close button renders. */
	readonly hasCloseButton: boolean;

	/** Resolved label for the hidden close button. */
	readonly closeButtonLabel: string;

	/** The option `xstyle` — merged onto the content wrapper after the surface. */
	readonly xstyle: StyleArg;
}

/**
 * Hook for creating popover dialogs with focus trapping.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const id = $props.id();
 *   const popover = usePopover(() => ({ id, dialogLabel: 'Settings' }));
 * </script>
 *
 * <button {@attach popover.attachTrigger} onclick={popover.toggle} {...popover.triggerProps}>
 *   Open
 * </button>
 * <PopoverLayer {popover} placement="below" alignment="start">
 *   <SettingsPanel />
 * </PopoverLayer>
 * ```
 */
export function usePopover(options: () => UsePopoverOptions): UsePopoverReturn {
	const t = useTranslator();

	const role = $derived(options().role ?? 'dialog');
	const isModal = $derived(options().isModal ?? true);
	const hasSurface = $derived(options().hasSurface ?? true);
	const hasCloseButton = $derived(options().hasCloseButton ?? true);
	const closeButtonLabel = $derived(options().closeButtonLabel ?? t('@astryx.popover.close'));

	// Core layer for popover positioning.
	const layer = useLayer(() => ({
		mode: 'context',
		id: options().id,
		lightDismiss: options().hasLightDismiss ?? true,
		onShow: options().onShow,
		onHide: options().onHide
	}));

	// Track whether to skip auto-focus for the current open event. Upstream's
	// `skipAutoFocusRef` — a plain `let`, no reactivity needed.
	let skipAutoFocus = false;

	// Focus trap for the popover content. Escape stays registered while light
	// dismiss is on (native popover="auto" closes on Escape regardless), so a
	// host Dialog keeps deferring to this trap instead of double-dismissing.
	// Note the `||`, not `&&`.
	const trap = useFocusTrap(() => ({
		isActive: layer.isOpen,
		onEscape:
			(options().hasEscapeDismiss ?? true) || (options().hasLightDismiss ?? true)
				? layer.hide
				: undefined
	}));

	// Auto-focus first element when popover opens (unless skipped). Upstream's
	// effect is keyed `[layer.isOpen, hasAutoFocus, focusFirst]`; we track only
	// `layer.isOpen` and read the rest untracked at the transition, so a stray
	// option change does not re-fire it. `focusFirst` is stable. The one divergence:
	// flipping `hasAutoFocus` false→true *while already open* re-fires upstream
	// (stealing focus to the first element) but not here — React lists the dep out
	// of stale-closure necessity, not intent, so declining to mirror it is deliberate.
	$effect(() => {
		const isOpen = layer.isOpen;
		untrack(() => {
			if (isOpen && (options().hasAutoFocus ?? true) && !skipAutoFocus) {
				// requestAnimationFrame to ensure the DOM is ready.
				requestAnimationFrame(() => {
					trap.focusFirst();
				});
			}
			if (!isOpen) {
				skipAutoFocus = false;
			}
		});
	});

	function show(showOptions?: { skipAutoFocus?: boolean }): void {
		skipAutoFocus = showOptions?.skipAutoFocus ?? false;
		layer.show();
	}

	function toggle(): void {
		if (layer.isOpen) {
			layer.hide();
		} else {
			show();
		}
	}

	// Dev-time guardrail: a dialog popover should always be labeled. Upstream's
	// effect is keyed `[role, dialogLabel]` with a ref latch, so it warns the
	// first time the pair becomes unnamed — including a `label` supplied then
	// cleared, not only at mount. The plain `warned` latch reproduces that:
	// tracked reads of `role`/`dialogLabel`, fired at most once per instance.
	// SSR never reaches the warning (effects are client-only).
	let warnedUnnamedDialog = false;
	$effect(() => {
		if (
			!warnedUnnamedDialog &&
			(options().role ?? 'dialog') === 'dialog' &&
			!options().dialogLabel
		) {
			warnedUnnamedDialog = true;
			devWarn(
				'usePopover',
				'role="dialog" without a `dialogLabel` renders an unnamed ' +
					'dialog. Pass `dialogLabel`, or use `role: "none"` for listbox/menu ' +
					'popups whose content already carries its own role.'
			);
		}
	});

	return {
		attachTrigger: layer.attachTrigger,
		attachContent: trap.attachContainer,
		get anchorId() {
			return layer.anchorId;
		},
		show,
		hide: layer.hide,
		toggle,
		get isOpen() {
			return layer.isOpen;
		},
		get id() {
			return layer.id;
		},
		get triggerProps() {
			return {
				'aria-haspopup': role === 'dialog' ? ('dialog' as const) : ('true' as const),
				'aria-expanded': layer.isOpen,
				'aria-controls': layer.id
			};
		},
		layer,
		get role() {
			return role;
		},
		get isModal() {
			return isModal;
		},
		get dialogLabel() {
			return options().dialogLabel;
		},
		get hasSurface() {
			return hasSurface;
		},
		get hasCloseButton() {
			return hasCloseButton;
		},
		get closeButtonLabel() {
			return closeButtonLabel;
		},
		get xstyle() {
			return options().xstyle;
		}
	};
}
