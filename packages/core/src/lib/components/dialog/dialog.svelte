<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SpacingStep } from '../../internal/types.js';
	import type { DialogPosition } from './dialog.stylex.js';

	/**
	 * Extensible variant map for Dialog. Theme packages add custom variants via
	 * TypeScript module augmentation.
	 */
	export interface DialogVariantMap {
		standard: true;
		fullscreen: true;
	}

	export type DialogVariant = keyof DialogVariantMap;

	/**
	 * Dialog purpose — controls dismissal behavior.
	 * - `required`: mandatory flows — disables all exit methods
	 * - `form`: user forms — prevents backdrop click, allows Escape
	 * - `info`: informational — allows all exit methods
	 */
	export type DialogPurpose = 'required' | 'form' | 'info';

	export interface DialogProps extends BaseProps<HTMLDialogElement> {
		/** Whether the dialog is open. */
		isOpen: boolean;
		/**
		 * Renders dialog content inline without the `<dialog>` element, backdrop,
		 * modal behavior, or dialog-managed autofocus. For documentation previews
		 * and showcases only — not for production UIs.
		 * @default false
		 */
		isInline?: boolean;
		/**
		 * Fired when the dialog visibility changes. Called with `false` when the
		 * dialog requests to be hidden; when that fires depends on `purpose`.
		 */
		onOpenChange: (isOpen: boolean) => unknown;
		/**
		 * Width of the dialog. Numbers are pixels, strings pass through. Ignored
		 * when `variant` is `fullscreen`.
		 * @default 400
		 */
		width?: number | string;
		/**
		 * Maximum height; the actual height fits the content. Numbers are pixels,
		 * strings pass through. Ignored when `variant` is `fullscreen`.
		 * @default '75vh'
		 */
		maxHeight?: number | string;
		/**
		 * Static position. By default the dialog is centered. Ignored when
		 * `variant` is `fullscreen`.
		 */
		position?: Readonly<DialogPosition>;
		/**
		 * - `standard`: normal dialog with configurable dimensions
		 * - `fullscreen`: takes up the entire viewport
		 * @default 'standard'
		 */
		variant?: DialogVariant;
		/**
		 * Configures dismissals — see `DialogPurpose`.
		 * @default 'info'
		 */
		purpose?: DialogPurpose;
		/**
		 * Internal padding on the spacing scale. When omitted, uses the dialog
		 * theme default.
		 */
		padding?: SpacingStep;
		/** The content, typically a `Layout` with header/content/footer slots. */
		children: Snippet;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { devWarn } from '../../utils/dev-warning.js';
	import { useScrollLock } from '../../hooks/use-scroll-lock.svelte.js';
	import { hasActiveFocusTrapEscape, isImeKeyEvent } from '../../hooks/use-focus-trap.svelte.js';
	import { spacingStepToToken } from '../../internal/padding.stylex.js';
	import type { SpacingToken } from '../../internal/container.stylex.js';
	import { setDialogContext } from './dialog-context.svelte.js';
	import { dialogAttrs, dialogInlineAttrs, dialogInnerAttrs } from './dialog.stylex.js';

	/**
	 * A dialog on the native `<dialog>` element, driven imperatively through
	 * `showModal()`/`close()`. Designed to wrap a `Layout` for structured content;
	 * the browser's built-in modal behavior (top layer, backdrop, focus scoping)
	 * is what upstream relies on, so there is no `<Layer>` portal here.
	 *
	 * @example
	 * ```svelte
	 * <Dialog {isOpen} onOpenChange={(open) => (isOpen = open)}>
	 *   <Layout>
	 *     {#snippet header()}
	 *       <DialogHeader title="Title" onOpenChange={(open) => (isOpen = open)} />
	 *     {/snippet}
	 *     {#snippet content()}<LayoutContent>Content</LayoutContent>{/snippet}
	 *     {#snippet footer()}<LayoutFooter hasDivider>Actions</LayoutFooter>{/snippet}
	 *   </Layout>
	 * </Dialog>
	 * ```
	 */
	const {
		isOpen,
		isInline = false,
		onOpenChange,
		width = 400,
		maxHeight = '75vh',
		position,
		variant = 'standard',
		purpose = 'info',
		padding,
		children,
		xstyle,
		class: className,
		style: styleProp,
		onkeydown: onkeydownProp,
		...rest
	}: DialogProps = $props();

	// When no explicit padding, cascade from the dialog theme default.
	const useThemeDefault = $derived(padding == null);
	const effectivePadding = $derived<SpacingStep>(padding ?? 4);
	const paddingToken = $derived<SpacingToken>(spacingStepToToken[effectivePadding]);
	const isFullscreen = $derived(variant === 'fullscreen');

	// Derive dismissal behavior from purpose.
	const allowEscape = $derived(purpose !== 'required');
	const allowBackdropClick = $derived(purpose === 'info');

	const innerMaxHeight = $derived(
		isFullscreen ? undefined : typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight
	);

	// Default accessible name: publish a title id through the dialog context so a
	// `DialogHeader` applies it to its heading (mirroring `AlertDialog`'s explicit
	// id wiring). Whether to *emit* the default `aria-labelledby` is decided
	// imperatively in the attachment below, by checking whether the title element
	// actually rendered — so a dialog with no header never points at a missing id.
	const titleId = $props.id();

	// Read by `DialogHeader` to suppress autofocus in inline previews, and for the
	// id it puts on its heading.
	setDialogContext(() => ({ isInline, titleId }));

	// Consumer-provided labels always win over the DialogHeader default.
	const hasConsumerName = $derived(rest['aria-label'] != null || rest['aria-labelledby'] != null);

	/**
	 * Attachment on the `<dialog>`: point `aria-labelledby` at the DialogHeader
	 * title if one rendered, in the same flush and with no second render.
	 * Upstream's callback ref, and for its reason — the check is "did an element
	 * carrying `titleId` actually mount", which only the DOM can answer, and
	 * routing it back through state would cost an extra render at the dialog
	 * level. A consumer `aria-label`/`aria-labelledby` wins: when one is present
	 * the attribute is left to the `{...safeRest}` spread and never touched here.
	 *
	 * `untrack` around the DOM writes matters more here than upstream: an
	 * attachment re-runs on every change to anything it reads, and `setAttribute`
	 * on an element the template also owns would otherwise re-enter.
	 */
	const syncDefaultLabel: Attachment<HTMLDialogElement> = (node) => {
		const skip = hasConsumerName;
		untrack(() => {
			if (skip) {
				return;
			}
			const hasTitle = node.querySelector(`#${CSS.escape(titleId)}`) != null;
			if (hasTitle) {
				node.setAttribute('aria-labelledby', titleId);
			} else {
				node.removeAttribute('aria-labelledby');
			}
		});
	};

	// Dev-time guardrail: an open modal should always have an accessible name. The
	// header-title check reads the DOM, so this stays in an effect; the flag keeps
	// it to one warning per component instance.
	let warnedUnnamedDialog = false;
	$effect(() => {
		const open = isOpen;
		const inline = isInline;
		const named = hasConsumerName;
		untrack(() => {
			const hasHeaderTitle = dialogEl?.querySelector(`#${CSS.escape(titleId)}`) != null;
			if (open && !inline && !named && !hasHeaderTitle && !warnedUnnamedDialog) {
				warnedUnnamedDialog = true;
				devWarn(
					'Dialog',
					'open dialog has no accessible name. Add a DialogHeader ' +
						'with a `title`, or pass `aria-label`/`aria-labelledby`.'
				);
			}
		});
	});

	let dialogEl = $state<HTMLDialogElement>();
	// The element focused when the dialog opened — for the directional animation
	// origin and for focus restoration on close. Not reactive, mirroring upstream's ref.
	let triggerEl: HTMLElement | null = null;

	/**
	 * A normalized vector from the trigger toward the viewport center, scaled to
	 * `distance` — the origin of the entry animation.
	 */
	function getDialogDirection(
		triggerElement: HTMLElement,
		distance = 16
	): { x: number; y: number } {
		const r = triggerElement.getBoundingClientRect();
		const dx = r.left + r.width / 2 - window.innerWidth / 2;
		const dy = r.top + r.height / 2 - window.innerHeight / 2;
		const dist = Math.sqrt(dx * dx + dy * dy) || 1;
		return {
			x: Math.round((dx / dist) * distance),
			y: Math.round((dy / dist) * distance)
		};
	}

	// Open/close lifecycle — skipped inline. Effects never run on the server, so
	// upstream's `useIsomorphicLayoutEffect`/SSR guards are not needed.
	$effect(() => {
		if (isInline) return;
		const dialog = dialogEl;
		if (!dialog) return;

		if (isOpen) {
			triggerEl = document.activeElement as HTMLElement | null;
			const trigger = triggerEl;
			if (trigger && trigger !== document.body) {
				const dir = getDialogDirection(trigger);
				dialog.style.setProperty('--dialog-dir-x', `${dir.x}px`);
				dialog.style.setProperty('--dialog-dir-y', `${dir.y}px`);
			} else {
				dialog.style.setProperty('--dialog-dir-x', '0px');
				dialog.style.setProperty('--dialog-dir-y', '16px');
			}

			if (!dialog.open) {
				dialog.showModal();
				// React's autoFocus fires before showModal makes the dialog visible,
				// so upstream focuses the first [data-autofocus] itself. Same here.
				const autofocusTarget = dialog.querySelector<HTMLElement>('[data-autofocus]');
				if (autofocusTarget) autofocusTarget.focus();
			}
		} else {
			if (dialog.open) dialog.close();
			triggerEl?.focus();
			triggerEl = null;
		}
	});

	// Lock body scroll while open (iOS Safari workaround); skipped inline.
	useScrollLock(() => isOpen && !isInline);

	/**
	 * Escape handling, plus the consumer's own `onkeydown`.
	 *
	 * Upstream does not put this in the element's props — it is
	 * `dialog.addEventListener('keydown', …)` from an effect, precisely so a
	 * consumer `onKeyDown` arriving through `{...safeProps}` still reaches the
	 * DOM. Svelte has one `onkeydown` slot per element and the explicit attribute
	 * wins over the spread, so the two are composed here instead. The order
	 * reproduces upstream's: React delegates `onKeyDown` to the root container, so
	 * the dialog's own bubble-phase listener runs *first* and the consumer's after
	 * — unconditionally, since `preventDefault` does not stop propagation. The
	 * consumer's call sits outside the `isOpen` guard because upstream installs
	 * its listener only while open, leaving `onKeyDown` live on a closed dialog.
	 */
	function handleKeyDown(event: KeyboardEvent): void {
		handleEscape(event);
		onkeydownProp?.(event as KeyboardEvent & { currentTarget: EventTarget & HTMLDialogElement });
	}

	function handleEscape(event: KeyboardEvent): void {
		if (!isOpen) return;
		if (event.key === 'Escape') {
			// Ignore IME composition-cancel, and defer to any popover/menu layered on
			// top so a single Escape closes only the top-most layer.
			if (isImeKeyEvent(event) || hasActiveFocusTrapEscape()) {
				return;
			}
			event.preventDefault();
			if (allowEscape) onOpenChange(false);
		}
	}

	function handleCancel(event: Event): void {
		event.preventDefault();
		if (hasActiveFocusTrapEscape()) return;
		if (allowEscape) onOpenChange(false);
	}

	function handleClick(event: MouseEvent): void {
		// A ::backdrop click targets the <dialog> itself; child clicks target the
		// child. The equality guard also avoids false positives from native popups.
		if (event.target === event.currentTarget && allowBackdropClick) {
			onOpenChange(false);
		}
	}

	const theme = $derived(themeProps('dialog', { variant }));
	const root = $derived(dialogAttrs({ isOpen, isFullscreen, width, maxHeight, position, xstyle }));
	const inlineRoot = $derived(dialogInlineAttrs({ isFullscreen, width, maxHeight, xstyle }));
	const inner = $derived(
		dialogInnerAttrs({ useThemeDefault, paddingToken, effectivePadding, maxHeight: innerMaxHeight })
	);

	// Strip the native `open` attribute from rest props — passing it to a modal
	// <dialog> throws InvalidStateError; open state is driven imperatively.
	const safeRest = $derived.by(() => {
		const r = { ...rest } as Record<string, unknown>;
		delete r.open;
		return r;
	});
</script>

{#snippet innerContent()}
	<div class={inner.class} style={inner.style}>
		{@render children()}
	</div>
{/snippet}

{#if isInline}
	{#if isOpen}
		<div
			{...safeRest}
			{...theme}
			class={cx(theme.class, inlineRoot.class, className)}
			style={mergeStyle(inlineRoot.style, styleProp as string | undefined)}
			onkeydown={onkeydownProp as unknown as (e: KeyboardEvent) => void}
		>
			{@render innerContent()}
		</div>
	{/if}
{:else}
	<dialog
		bind:this={dialogEl}
		{...safeRest}
		{...theme}
		class={cx(theme.class, root.class, className)}
		style={mergeStyle(root.style, styleProp as string | undefined)}
		onclick={handleClick}
		oncancel={handleCancel}
		onkeydown={handleKeyDown}
		aria-modal="true"
		{...purpose === 'required' ? { role: 'alertdialog' } : {}}
		{@attach syncDefaultLabel}
	>
		{@render innerContent()}
	</dialog>
{/if}
