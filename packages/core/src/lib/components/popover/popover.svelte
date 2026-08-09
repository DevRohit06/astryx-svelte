<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { BaseProps } from '../../base-props.js';
	import type { LayerAlignment, LayerPlacement } from '../layer/use-layer.svelte.js';

	/**
	 * Props passed to the render-prop `trigger` snippet for explicit trigger
	 * wiring. Upstream's `PopoverTriggerRenderProps`.
	 *
	 * `ref` is upstream's ref callback, translated to an `Attachment` (this port's
	 * universal ref-callback replacement) — apply it with `{@attach}`. `onClick`
	 * is a plain handler the consumer wires to `onclick`. The ARIA fields are set
	 * on the trigger element by the consumer.
	 */
	export interface PopoverTriggerRenderProps {
		/** Attach to the trigger element for anchor positioning. Upstream's `ref`. */
		ref: Attachment<HTMLElement>;
		/** Toggle the popover open/closed. */
		onClick: () => void;
		/** ARIA attribute: indicates the element triggers a dialog. */
		'aria-haspopup': 'dialog';
		/** ARIA attribute: whether the popover is currently open. */
		'aria-expanded': boolean;
		/** ARIA attribute: ID of the controlled popover element. */
		'aria-controls': string;
	}

	export interface PopoverProps extends Pick<BaseProps, 'xstyle' | 'class' | 'style'> {
		/**
		 * The trigger content (automatic mode). Must contain a `<button>` or
		 * `[role="button"]` element — the popover locates it and applies
		 * click/keydown handlers and ARIA attributes automatically. Components that
		 * consume `InteractiveRoleContext` (e.g. `Token`) render as a button here.
		 *
		 * Upstream's `children` is `ReactNode | (props => ReactNode)` — a single
		 * prop discriminated by `typeof children === 'function'`. Svelte wraps both
		 * content and render-functions as snippets, so the two cannot be told
		 * apart; the render-function branch is split out to `trigger`, exactly as
		 * `Tooltip`'s string branch is split to a prop. Recorded under "Known debts".
		 */
		children?: Snippet;

		/**
		 * Explicit-mode trigger (upstream's render-function `children`). Receives
		 * `PopoverTriggerRenderProps` — the consumer attaches `ref`, wires
		 * `onClick`, and sets the ARIA attributes on their own trigger element. Use
		 * for custom triggers or third-party components.
		 */
		trigger?: Snippet<[PopoverTriggerRenderProps]>;

		/**
		 * External element to use as the popover anchor (sibling mode). When
		 * provided (and no `children`/`trigger`), the popover attaches to this
		 * element instead of wrapping content. The element must be a `<button>` or
		 * `[role="button"]` — the popover applies click/keydown handlers and ARIA
		 * to it directly. Bind it with `bind:this` in the consumer.
		 *
		 * Upstream's `anchorRef: RefObject<HTMLElement>` — a React ref object;
		 * here the element itself, the port's translation of a `.current` read.
		 */
		anchorRef?: HTMLElement | null;

		/** Content to display inside the popover. */
		content: Snippet;

		/**
		 * Position placement relative to the trigger.
		 * @default 'below'
		 */
		placement?: LayerPlacement;

		/**
		 * Alignment along the placement axis.
		 * @default 'start'
		 */
		alignment?: LayerAlignment;

		/**
		 * Whether the popover is open (controlled mode).
		 * Omit for uncontrolled behavior.
		 */
		isOpen?: boolean;

		/** Callback fired when the popover visibility changes. */
		onOpenChange?: (isOpen: boolean) => void;

		/**
		 * Whether the popover is enabled. When false, trigger interactions are
		 * ignored.
		 * @default true
		 */
		isEnabled?: boolean;

		/**
		 * Width of the popover container. Numbers are px, strings used as-is.
		 * @default 'auto'
		 */
		width?: number | string;

		/**
		 * Accessible label for the popover dialog. Recommended for accessibility
		 * when `role` is `'dialog'` (used as `aria-label` on the dialog).
		 */
		label?: string;

		/**
		 * ARIA role stamped on the popover content wrapper.
		 *
		 * Use `'dialog'` for dialog-style popovers. Use `'none'` when the popup
		 * content owns its own role, such as a child `role="menu"` or
		 * `role="listbox"`.
		 *
		 * @default 'dialog'
		 */
		role?: 'dialog' | 'none';

		/**
		 * Whether a dialog-style popover is modal (`aria-modal`). Only applies when
		 * `role` is `'dialog'`.
		 *
		 * @default true
		 */
		isModal?: boolean;

		/**
		 * Whether to include a hidden close button for accessibility.
		 * @default true
		 */
		hasCloseButton?: boolean;

		/**
		 * Label for the hidden close button.
		 * @default "Close popover"
		 */
		closeButtonLabel?: string;

		/**
		 * Whether to auto-focus the first focusable element when the popover opens.
		 * @default true
		 */
		hasAutoFocus?: boolean;

		/**
		 * Whether clicking outside dismisses the popover.
		 * @default true
		 */
		hasLightDismiss?: boolean;

		/**
		 * Whether pressing Escape dismisses the popover.
		 * @default true
		 */
		hasEscapeDismiss?: boolean;

		/** Test ID for the popover container. */
		'data-testid'?: string;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment as AttachmentType } from 'svelte/attachments';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { devWarn } from '../../utils/dev-warning.js';
	import PopoverAnchor from './popover-anchor.svelte';
	import PopoverLayer from './popover-layer.svelte';
	import {
		popoverAnchorWrapperAttrs,
		popoverContentAttrs,
		popoverLayerXstyle
	} from './popover.stylex.js';
	import { usePopover } from './use-popover.svelte.js';

	/**
	 * A click-triggered popover for interactive content anchored to a trigger,
	 * ported from Astryx's `Popover/Popover.tsx`.
	 *
	 * Implements the button + dialog ARIA pattern. The trigger must contain a
	 * `<button>` or `[role="button"]`; the popover finds it and applies handlers
	 * and ARIA automatically (automatic mode), or the consumer wires them
	 * (`trigger` render-prop / `anchorRef` sibling modes).
	 *
	 * Upstream's three `useIsomorphicLayoutEffect`s become two attachments and one
	 * `$effect`:
	 *
	 * - **Children mode** is an attachment on the anchor wrapper (`attachAnchor`) —
	 *   an attachment is upstream's ref-callback lifecycle, and finds the button
	 *   after its subtree has mounted, so `querySelector` sees it.
	 * - **Sibling mode** stays an `$effect` because `anchorRef` is an external
	 *   element the component only reads (upstream's `anchorRef.current`).
	 * - **`aria-expanded` sync** is its own `$effect`: upstream re-runs its whole
	 *   attach on every render (its `popover` dep churns) purely to re-stamp
	 *   `aria-expanded`; here the static ARIA/listeners bind once and only
	 *   `aria-expanded` follows `isOpen` reactively.
	 *
	 * Note `hasCloseButton`/`closeButtonLabel`/`hasAutoFocus`/`isModal` are **not**
	 * defaulted here — they pass through to `usePopover`, which supplies the
	 * defaults, exactly as upstream leaves them `undefined` at this layer. `role`
	 * is the exception upstream also makes: it is defaulted here to `'dialog'`
	 * because the render-prop branch reads it.
	 */
	const {
		children,
		trigger,
		anchorRef,
		content,
		placement = 'below',
		alignment = 'start',
		isOpen,
		onOpenChange,
		isEnabled = true,
		width,
		label,
		role = 'dialog',
		isModal,
		hasCloseButton,
		closeButtonLabel,
		hasAutoFocus,
		hasLightDismiss = true,
		hasEscapeDismiss = true,
		xstyle,
		class: className,
		style,
		'data-testid': testId
	}: PopoverProps = $props();

	const id = $props.id();

	const BUTTON_SELECTOR = 'button, [role="button"]';

	/**
	 * Find the trigger button inside a container — either the element itself or the
	 * first matching descendant. Upstream's `findTriggerButton`.
	 */
	function findTriggerButton(el: HTMLElement): HTMLElement | null {
		if (el.matches(BUTTON_SELECTOR)) {
			return el;
		}
		return el.querySelector<HTMLElement>(BUTTON_SELECTOR);
	}

	const isControlled = $derived(isOpen !== undefined);
	// Track when the popover was last hidden by light dismiss to prevent the
	// trigger click from immediately re-opening it. Upstream's `lastHideTimeRef`.
	let lastHideTime = 0;

	const popover = usePopover(() => ({
		id,
		dialogLabel: label,
		role,
		isModal,
		hasLightDismiss,
		hasEscapeDismiss,
		hasCloseButton,
		closeButtonLabel,
		hasAutoFocus,
		onShow: () => onOpenChange?.(true),
		onHide: () => {
			lastHideTime = Date.now();
			onOpenChange?.(false);
		}
	}));

	// Shared click handler for the trigger button.
	function handleTriggerClick(): void {
		if (!isEnabled) {
			return;
		}
		// If the popover was just closed by light dismiss (clicking outside), the
		// trigger click fires in the same event — skip re-opening.
		if (Date.now() - lastHideTime < 50) {
			return;
		}
		popover.toggle();
	}

	// Shared keydown handler for role="button" elements. Native <button>
	// synthesizes click on Enter/Space; role="button" does not.
	function handleTriggerKeyDown(e: KeyboardEvent): void {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleTriggerClick();
		}
	}

	// The found trigger button — the `aria-expanded` effect syncs it. In
	// automatic mode the anchor attachment sets it; in sibling mode the effect does.
	let triggerButton = $state<HTMLElement | null>(null);

	/**
	 * Bind static ARIA + event handlers to a trigger button. `aria-haspopup` and
	 * `aria-expanded` are handled by the reactive effect below, not here — see the
	 * component comment. Neither may be read in this function: it runs inside an
	 * attachment, and `popover.triggerProps` reads `isOpen`, which would re-run the
	 * whole attachment (rebinding listeners) on every open and close.
	 */
	function wireTriggerButton(button: HTMLElement): () => void {
		button.setAttribute('aria-controls', popover.id);
		button.addEventListener('click', handleTriggerClick);
		const needsKeyDown = button.tagName !== 'BUTTON' && button.getAttribute('role') === 'button';
		if (needsKeyDown) {
			button.addEventListener('keydown', handleTriggerKeyDown);
		}
		triggerButton = button;

		return () => {
			button.removeAttribute('aria-haspopup');
			button.removeAttribute('aria-expanded');
			button.removeAttribute('aria-controls');
			button.removeEventListener('click', handleTriggerClick);
			if (needsKeyDown) {
				button.removeEventListener('keydown', handleTriggerKeyDown);
			}
			if (triggerButton === button) {
				triggerButton = null;
			}
		};
	}

	// Automatic (children) mode: the wrapper is the CSS anchor, find the button
	// inside for ARIA + handlers. Upstream's children-mode layout effect.
	const attachAnchor: AttachmentType<HTMLElement> = (wrapper) => {
		const detachAnchor = popover.attachTrigger(wrapper);

		const button = findTriggerButton(wrapper);
		if (!button) {
			devWarn(
				'Popover',
				'children must contain a <button> or [role="button"] element. ' +
					'The popover trigger implements the button + dialog ARIA pattern.'
			);
			return detachAnchor;
		}

		const detachButton = wireTriggerButton(button);
		return () => {
			detachButton();
			detachAnchor?.();
		};
	};

	// Sibling mode: attach to the external anchorRef element itself, find the
	// button inside for ARIA + handlers. Upstream's anchorRef layout effect.
	$effect(() => {
		const el = anchorRef;
		if (!el || children !== undefined || trigger !== undefined) {
			return;
		}

		return untrack(() => {
			const button = findTriggerButton(el);
			if (!button) {
				devWarn(
					'Popover',
					'anchorRef must reference a <button> or [role="button"] element. ' +
						'The popover trigger implements the button + dialog ARIA pattern.'
				);
				return;
			}

			// Anchor positioning on the anchorRef element itself.
			const detachAnchor = popover.attachTrigger(el);
			const detachButton = wireTriggerButton(button);
			return () => {
				detachButton();
				detachAnchor?.();
			};
		});
	});

	// `aria-haspopup` follows `role` and `aria-expanded` follows `isOpen`, once a
	// trigger button is wired. Upstream re-runs its whole attach on every render
	// and re-stamps both from `popover.triggerProps`; here the static ARIA and the
	// listeners bind once in `wireTriggerButton` and only these two follow.
	$effect(() => {
		const button = triggerButton;
		const { 'aria-haspopup': hasPopup, 'aria-expanded': open } = popover.triggerProps;
		if (button) {
			button.setAttribute('aria-haspopup', hasPopup);
			button.setAttribute('aria-expanded', String(open));
		}
	});

	// Sync controlled state.
	$effect(() => {
		if (!isControlled) {
			return;
		}
		const open = isOpen;
		untrack(() => {
			if (open && !popover.isOpen) {
				popover.show();
			} else if (!open && popover.isOpen) {
				popover.hide();
			}
		});
	});

	// Mode is decided by which trigger the consumer supplied, NOT by `anchorRef`'s
	// value: upstream keys sibling mode on the *presence* of the `anchorRef` prop
	// (a stable RefObject, truthy even when `.current` is null), but here `anchorRef`
	// is the element itself — null until it mounts — so reading its value would
	// misdetect not-yet-mounted sibling mode as automatic and warn about a missing
	// button. Automatic mode is the one that renders a wrapper around `children`;
	// with no inline trigger (`children`/`trigger`), the popover attaches to the
	// external `anchorRef` whenever it arrives. This mirrors upstream's branch order
	// (render-prop → sibling → automatic) without depending on the ref value.
	const mode = $derived(trigger ? 'render' : children !== undefined ? 'automatic' : 'sibling');

	const anchorAttrs = popoverAnchorWrapperAttrs();
	const contentAttrs = $derived(popoverContentAttrs(xstyle));
	const themeClass = themeProps('popover').class;
	const layerXstyle = $derived(popoverLayerXstyle(width, placement));

	// `aria-haspopup` is the literal `'dialog'` here, NOT `popover.triggerProps`'s
	// role-derived value, and `PopoverTriggerRenderProps` types it as that literal.
	// That is upstream 0.3.0 verbatim: it routed the automatic/sibling paths through
	// `popover.triggerProps` when it added `role`, and left the render-prop branch
	// hard-coded. Deliberately not "fixed" here — see the parity rule.
	const renderTriggerProps = $derived<PopoverTriggerRenderProps>({
		ref: popover.attachTrigger,
		onClick: handleTriggerClick,
		'aria-haspopup': 'dialog',
		'aria-expanded': popover.isOpen,
		'aria-controls': popover.id
	});
</script>

{#if mode === 'automatic'}
	<PopoverAnchor attach={attachAnchor} class={anchorAttrs.class} style={anchorAttrs.style}>
		{@render children?.()}
	</PopoverAnchor>
{:else if mode === 'render'}
	{@render trigger?.(renderTriggerProps)}
{/if}

<PopoverLayer {popover} {placement} {alignment} xstyle={layerXstyle}>
	<div
		data-testid={testId}
		class={cx(themeClass, contentAttrs.class, className)}
		style={mergeStyle(contentAttrs.style, style)}
	>
		{@render content()}
	</div>
</PopoverLayer>
