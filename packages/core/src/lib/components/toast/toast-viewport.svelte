<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ToastPosition } from './types.js';

	export interface ToastViewportProps {
		/** @default 'bottomEnd' */
		position?: ToastPosition;
		/** @default 5 */
		maxVisible?: number;
		inset?: { top?: number; bottom?: number; start?: number; end?: number };
		/**
		 * Promote viewport to CSS top layer via popover="manual".
		 * Set to false when inside a dialog or other top-layer element.
		 * @default true
		 */
		isTopLayer?: boolean;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import Toast from './toast.svelte';
	import { setToastContext, type ToastContextValue } from './toast-context.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useAnnounce } from '../../hooks/use-announce.js';
	import { INTERACTIVE_SELECTORS } from '../../hooks/use-clickable-container.svelte.js';
	import { mergeStyle } from '../../internal/sx.js';
	import type { ToastEntry, ToastDismissReason, ToastContent } from './types.js';
	import {
		toastViewportAttrs,
		toastWrapperAttrs,
		toastWrapperInnerAttrs
	} from './toast-viewport.stylex.js';

	/**
	 * Container that renders and manages toast notifications. Place at the root
	 * of your app to enable `useToast()`. Toasts stack with enter/exit animations
	 * and auto-promote to the CSS top layer.
	 *
	 * @example
	 * ```svelte
	 * <ToastViewport position="bottomEnd" maxVisible={3}>
	 *   <App />
	 * </ToastViewport>
	 * ```
	 */
	const {
		position = 'bottomEnd',
		maxVisible = 5,
		inset,
		isTopLayer = true,
		children
	}: ToastViewportProps = $props();

	const t = useTranslator();

	/**
	 * Announce toasts through `useAnnounce`'s persistent singleton live regions.
	 * Each `<Toast>` also renders its own `role="status"`/`"alert"` region, but
	 * that region is *born with content* — mounted together with its text — which
	 * many screen readers do not announce (see `use-announce.ts`); the singleton
	 * regions are mounted empty and only mutated afterwards, so they are what
	 * actually guarantees the announcement. The per-toast markup is kept for
	 * browse-mode discoverability.
	 *
	 * The announcement happens in `addToast` — the imperative dispatch path
	 * invoked once per `showToast()` call from an event handler, never from
	 * render — so each toast is announced exactly once by construction,
	 * independent of the render lifecycle: viewport re-renders and unrelated list
	 * changes never re-announce. It is client-only (`addToast` never runs during
	 * SSR), so it is SSR-safe.
	 */
	const announce = useAnnounce();

	/**
	 * Upstream flattens the toast body's `ReactNode` tree to plain text with a
	 * recursive `getNodeText`, walking `children` through every element. Its
	 * counterpart here is one line, and the reason is a limit rather than a
	 * simplification: `ToastContent` is `string | Snippet` (see `types.ts`), and a
	 * `Snippet` is an opaque function — there is no children tree to walk and no
	 * way to obtain its text without *rendering* it, which would run consumer code
	 * a second time and move the announcement out of the dispatch path that makes
	 * it exactly-once.
	 *
	 * So a string body is announced through the singleton regions, and a snippet
	 * body falls back to the toast's own (born-with-content) region — i.e. exactly
	 * the behaviour this port had before, with no regression, but without the
	 * 0.3.0 gain. **This deferral belongs in port/todo.md → Known debts, beside the
	 * `ToastContent` entry it descends from; it is not recorded there yet.**
	 */
	function toastText(body: ToastContent): string {
		return typeof body === 'string' ? body : '';
	}

	/**
	 * `$state.raw`, not `$state`: every mutation below is a whole-array
	 * reassignment, and upstream treats an entry as an opaque value. Deep-proxying
	 * would additionally make a consumer mutating the `ToastOptions` object it
	 * passed to `showToast()` re-render our toast, which React does not do.
	 */
	let toasts = $state.raw<ToastEntry[]>([]);
	/**
	 * Ids whose exit has begun. Upstream keeps this twice — a ref for the
	 * synchronous `onHide` double-fire guard, and state to drive the exit
	 * animation — because a React state update is not readable until the next
	 * render. A `SvelteSet` mutation is readable immediately, so one set does
	 * both jobs and `toastsRef`/`exitingIdsRef` disappear with it.
	 *
	 * Upstream replaces the set (`new Set(prev).add(id)`) because React needs a
	 * fresh reference to re-render; Svelte tracks the mutation itself, so the
	 * copy has no counterpart here.
	 */
	const exitingIds = new SvelteSet<string>();

	let viewportEl = $state<HTMLDivElement | null>(null);

	// Upstream's refs, and plain `let` for the same reason they are refs: no
	// render reads them, and the focus-handoff effect must re-run on `toasts`
	// alone, exactly as its dependency list says.
	let prevFocus: HTMLElement | null = null;
	let focusHandoffId: string | null = null;
	let pendingFocus: string | 'restore' | null = null;

	/**
	 * Collect a focusable control within a toast node, if any. Reuses the
	 * canonical `INTERACTIVE_SELECTORS` list (native controls plus role-based
	 * interactive elements) instead of a hand-rolled subset, then narrows to the
	 * first candidate that can actually receive focus — excluding elements opted
	 * out with `tabindex="-1"` and disabled controls.
	 */
	function getFocusable(container: HTMLElement | null): HTMLElement | null {
		if (!container) {
			return null;
		}
		const candidates = container.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTORS);
		for (const candidate of candidates) {
			if (
				candidate.getAttribute('tabindex') === '-1' ||
				candidate.hasAttribute('disabled') ||
				candidate.getAttribute('aria-disabled') === 'true'
			) {
				continue;
			}
			return candidate;
		}
		return null;
	}

	/**
	 * Every mutator below reads the current list through `untrack`.
	 *
	 * Upstream never reads `toasts` while producing the next value — `addToast`
	 * is `useCallback(entry => setToasts(prev => …), [])`, and the current list
	 * is reachable only through `toastsRef`, which is inert. That is what makes
	 * the documented consumer pattern legal:
	 *
	 * ```
	 * useEffect(() => { if (error) toast({body: error, type: 'error'}); }, [error]);
	 * ```
	 *
	 * These functions are invoked through the context from the *caller's* stack
	 * frame, so a plain read would subscribe the caller's `$effect` to `toasts`;
	 * the write then dirties it, it re-runs, and Svelte aborts the tree with
	 * `effect_update_depth_exceeded`. `untrack` here — inside the viewport, where
	 * upstream put the functional updater — restores the ref semantics without
	 * asking every call site to opt out.
	 */
	function addToast(entry: ToastEntry): void {
		const { uniqueID, collisionBehavior = 'overwrite' } = entry.options;
		const list = untrack(() => toasts);
		// Resolve an ignored collision first, so a suppressed toast is neither
		// shown nor announced.
		if (
			uniqueID &&
			collisionBehavior === 'ignore' &&
			list.some((item) => item.options.uniqueID === uniqueID)
		) {
			return;
		}
		const text = toastText(entry.options.body);
		if (text) {
			// Error toasts map to the assertive region (role="alert"); everything
			// else to the polite region (role="status") — mirrors `toast.svelte`.
			announce(text, entry.options.type === 'error' ? 'assertive' : 'polite');
		}
		if (uniqueID) {
			const existing = list.find((item) => item.options.uniqueID === uniqueID);
			if (existing) {
				// An ignored collision already returned above; overwrite in place.
				toasts = list.map((item) => (item.options.uniqueID === uniqueID ? entry : item));
				return;
			}
		}
		toasts = [...list, entry];
	}

	function removeToast(id: string, reason: ToastDismissReason): void {
		// An exiting toast stays in `toasts` until its exit transition ends, so a
		// second dismissal inside that window (double-click, or the auto-timer
		// plus a manual dismiss) would re-fire `onHide`. Claiming the id first is
		// what makes the second call a no-op.
		if (untrack(() => exitingIds.has(id))) {
			return;
		}
		exitingIds.add(id);

		const list = untrack(() => toasts);
		const entry = list.find((item) => item.id === id);
		if (entry) {
			entry.options.onHide?.(reason);
		}

		// If focus currently lives inside the toast being dismissed, remember that
		// its removal must hand focus off to a neighbour (or the element focused
		// before the user entered the viewport) rather than <body>.
		const el = untrack(() => viewportEl);
		const active = document.activeElement;
		const dismissedNode = el?.querySelector<HTMLElement>(`[data-toast-id="${id}"]`) ?? null;
		if (dismissedNode && active instanceof Node && dismissedNode.contains(active)) {
			focusHandoffId = id;
			// Pick the neighbour to receive focus while the DOM is still intact:
			// prefer the next toast, then the previous, else restore.
			const remaining = list.filter((item) => item.id !== id);
			if (remaining.length > 0) {
				const dismissedIndex = list.findIndex((item) => item.id === id);
				const next = list[dismissedIndex + 1] ?? list[dismissedIndex - 1];
				pendingFocus = next ? next.id : 'restore';
			} else {
				pendingFocus = 'restore';
			}
		}
	}

	function handleExited(id: string): void {
		exitingIds.delete(id);
		toasts = untrack(() => toasts).filter((item) => item.id !== id);
	}

	function findByUniqueID(uid: string): ToastEntry | undefined {
		return untrack(() => toasts).find((item) => item.options.uniqueID === uid);
	}

	const contextValue: ToastContextValue = { addToast, removeToast, findByUniqueID };
	setToastContext(() => contextValue);

	// After a dismissed toast unmounts, hand focus off so it never falls to
	// <body>. Runs once the toast list no longer contains the dismissed toast.
	$effect(() => {
		const list = toasts;
		const handoffId = focusHandoffId;
		const target = pendingFocus;
		if (handoffId == null || target == null) {
			return;
		}
		// Wait until the dismissed toast is actually gone from the list.
		if (list.some((item) => item.id === handoffId)) {
			return;
		}
		focusHandoffId = null;
		pendingFocus = null;

		const el = viewportEl;
		if (target !== 'restore' && el) {
			const nextNode = el.querySelector<HTMLElement>(`[data-toast-id="${target}"]`);
			const focusable = getFocusable(nextNode) ?? nextNode;
			if (focusable) {
				focusable.focus();
				return;
			}
		}
		// No remaining toast to receive focus — restore the previously-focused
		// element if it's still connected, else fall back to the container.
		const previous = prevFocus;
		prevFocus = null;
		if (previous && previous.isConnected) {
			previous.focus();
		} else if (el) {
			el.focus();
		}
	});

	// Show the popover on mount so it enters the top layer.
	$effect(() => {
		if (!isTopLayer) {
			return;
		}
		const el = viewportEl;
		if (el && typeof el.showPopover === 'function') {
			try {
				el.showPopover();
			} catch {
				/* already showing */
			}
		}
	});

	// F6 jumps focus into the toast viewport — the standard "go to notifications"
	// affordance. Focus the first control in the newest toast, or the viewport
	// container if none. Toasts are non-modal, so this only moves focus in;
	// Shift+Tab / Escape let focus leave naturally.
	const hasToasts = $derived(toasts.length > 0);
	$effect(() => {
		if (!hasToasts) {
			return;
		}
		const handleKeyDown = (e: KeyboardEvent): void => {
			if (e.key !== 'F6') {
				return;
			}
			const el = viewportEl;
			if (!el) {
				return;
			}
			// Already inside the viewport — nothing to do.
			const active = document.activeElement;
			if (active instanceof Node && el.contains(active)) {
				return;
			}
			e.preventDefault();
			// Remember where focus was so it can be restored on dismiss.
			if (active instanceof HTMLElement) {
				prevFocus = active;
			}
			// Newest toast is the last one rendered in the DOM.
			const toastNodes = el.querySelectorAll<HTMLElement>('[data-toast-id]');
			const newest = toastNodes[toastNodes.length - 1] ?? null;
			const focusable = getFocusable(newest) ?? newest ?? el;
			focusable.focus();
		};
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	});

	const visibleToasts = $derived(toasts.slice(-maxVisible));

	// Upstream builds this with truthiness checks, so an inset of `0` is ignored.
	// Replicated rather than fixed — see port/todo.md → Known debts.
	const insetStyle = $derived.by(() => {
		const parts: string[] = [];
		if (inset?.top) parts.push(`top:${inset.top}px`);
		if (inset?.bottom) parts.push(`bottom:${inset.bottom}px`);
		if (inset?.start) parts.push(`inset-inline-start:${inset.start}px`);
		if (inset?.end) parts.push(`inset-inline-end:${inset.end}px`);
		return parts.length > 0 ? parts.join(';') : undefined;
	});

	const viewport = $derived(toastViewportAttrs(position));
	const wrapperInner = toastWrapperInnerAttrs();
</script>

{@render children?.()}

<div
	bind:this={viewportEl}
	role="region"
	aria-label={t('@astryx.toast.viewport')}
	tabindex="-1"
	popover={isTopLayer ? 'manual' : undefined}
	class={viewport.class}
	style={mergeStyle(viewport.style, insetStyle)}
>
	{#each visibleToasts as entry (entry.id)}
		{@const options = entry.options}
		{@const type = options.type ?? 'info'}
		{@const isAutoHide = options.isAutoHide ?? (type === 'error' ? false : true)}
		{@const isExiting = exitingIds.has(entry.id)}
		{@const wrapper = toastWrapperAttrs(isExiting)}
		<div
			data-toast-id={entry.id}
			class={wrapper.class}
			style={wrapper.style}
			ontransitionend={isExiting
				? (e: TransitionEvent) => {
						if (e.propertyName === 'grid-template-rows') {
							handleExited(entry.id);
						}
					}
				: undefined}
		>
			<div class={wrapperInner.class} style={wrapperInner.style}>
				<Toast
					{type}
					body={options.body}
					endContent={options.endContent}
					{isAutoHide}
					autoHideDuration={options.autoHideDuration ?? 5000}
					{isExiting}
					onDismiss={(reason) => removeToast(entry.id, reason)}
				/>
			</div>
		</div>
	{/each}
</div>
