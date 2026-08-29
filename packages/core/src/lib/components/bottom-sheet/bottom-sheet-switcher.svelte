<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { StyleArg } from '../../internal/sx.js';
	import type { DialogPurpose } from '../dialog/dialog.svelte';
	import type { BottomSheetSwitcherPhase } from './bottom-sheet-switcher-context.svelte.js';

	export interface BottomSheetSwitcherProps extends BaseProps<HTMLDialogElement> {
		/**
		 * ID of the interactive BottomSheet, or null when the flow should close.
		 * Must match a nested BottomSheet's `sheetId`. The previous sheet may
		 * remain visually present and inert while the new sheet enters, moving
		 * downward at the same time if the new sheet is shorter, then fade away.
		 */
		activeSheet: string | null;

		/** Called with null when the active sheet requests dismissal. */
		onActiveSheetChange: (sheetId: string | null) => void;

		/**
		 * Whether to open the shared dialog modally with its native `::backdrop`.
		 * Disable for a viewport-anchored, non-modal flow over an interactive page.
		 * @default true
		 */
		hasScrim?: boolean;

		/** BottomSheets identified by unique `sheetId` values. */
		children: Snippet;

		xstyle?: StyleArg;
	}

	/**
	 * Upstream also declares `ref` (forwarded to the shared dialog) and `onCancel`
	 * on this interface. Neither is redeclared here: an `{@attach}` on this
	 * component reaches the `<dialog>` through the rest spread — this port's
	 * standing ref translation — and `oncancel` already arrives from `BaseProps`,
	 * where Svelte's `HTMLAttributes<HTMLDialogElement>` types it. Redeclaring it
	 * would only narrow that type and break assignment from the spread.
	 */

	type RetainedSheetPhase = 'covered' | 'aligning' | 'fading' | 'exiting';

	interface SheetTransitionState {
		enteringSheet: string | null;
		retainedSheet: string | null;
		retainedPhase: RetainedSheetPhase | null;
		alignmentOffset: number;
		isAlignmentComplete: boolean;
	}

	const IDLE_TRANSITION: SheetTransitionState = {
		enteringSheet: null,
		retainedSheet: null,
		retainedPhase: null,
		alignmentOffset: 0,
		isAlignmentComplete: false
	};

	const ALIGNMENT_THRESHOLD_PX = 1;

	function transitionForActiveSheetChange(
		previousSheet: string | null,
		nextSheet: string | null
	): SheetTransitionState {
		if (previousSheet == null) {
			return IDLE_TRANSITION;
		}
		if (nextSheet == null) {
			return {
				enteringSheet: null,
				retainedSheet: previousSheet,
				retainedPhase: 'exiting',
				alignmentOffset: 0,
				isAlignmentComplete: false
			};
		}
		return {
			enteringSheet: nextSheet,
			retainedSheet: previousSheet,
			retainedPhase: 'covered',
			alignmentOffset: 0,
			isAlignmentComplete: false
		};
	}

	function alignmentOffsetForElements(
		enteringElement: HTMLElement | undefined,
		retainedElement: HTMLElement | undefined
	): number {
		if (enteringElement == null || retainedElement == null) {
			return 0;
		}
		const enteringPositioner = enteringElement.parentElement;
		const enteringTop =
			enteringPositioner?.getBoundingClientRect().top ??
			enteringElement.getBoundingClientRect().top;
		return Math.max(0, enteringTop - retainedElement.getBoundingClientRect().top);
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { cx, mergeStyle } from '../../internal/sx.js';
	import BottomSheetEdgeTint from './bottom-sheet-edge-tint.svelte';
	import {
		setBottomSheetSwitcherContext,
		type BottomSheetSwitcherContextValue,
		type BottomSheetSwitcherTransitionEvent
	} from './bottom-sheet-switcher-context.svelte.js';
	import { bottomSheetDialogAttrs } from './bottom-sheet.stylex.js';
	import { hasActiveFocusTrapEscape, useFocusTrap } from '../../hooks/use-focus-trap.svelte.js';
	import { useScrollLock } from '../../hooks/use-scroll-lock.svelte.js';
	import { isImeKeyEvent } from '../../utils/ime.js';

	/**
	 * Ported from Astryx's `BottomSheet/BottomSheetSwitcher.tsx`.
	 *
	 * Turns a set of declaratively nested `BottomSheet`s into a controlled
	 * single-selection group: `activeSheet` names the one interactive child, or is
	 * null when the flow is closed. During a handoff the new sheet enters above
	 * the previous one; if it is shorter, the previous sheet moves down at the
	 * same time until their top edges align, otherwise it stays put. The previous
	 * sheet fades only once both motions complete.
	 *
	 * Every child sheet renders as a panel inside one switcher-owned `<dialog>`. A
	 * scrim flow calls `showModal()` once and keeps that native top-layer dialog
	 * open across every handoff; a no-scrim flow calls `show()` on the same
	 * non-modal shell. One modal boundary, one native `::backdrop`, no portal.
	 */
	let {
		activeSheet,
		onActiveSheetChange,
		hasScrim = true,
		children,
		xstyle,
		class: className,
		style: styleProp,
		oncancel: oncancelProp,
		onclick: onclickProp,
		onkeydown: onkeydownProp,
		...rest
	}: BottomSheetSwitcherProps = $props();

	let dialogEl = $state<HTMLDialogElement>();

	/**
	 * Upstream's refs, and plain `let`s for the same reason: bookkeeping nothing
	 * renders from. `sheetElements` is written by child registration on every
	 * mount and unmount, and read only when measuring an alignment — making it
	 * reactive would invalidate the whole switcher on each child's mount for no
	 * observable difference.
	 */
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const sheetElements = new Map<string, HTMLElement>();
	let dialogMode: 'modal' | 'non-modal' | null = null;
	let triggerEl: HTMLElement | null = null;
	// svelte-ignore state_referenced_locally
	let committedActiveSheet: string | null = activeSheet;

	/**
	 * `$state.raw` throughout: upstream replaces each of these wholesale and never
	 * mutates one in place, and its updaters deliberately return the *current*
	 * value to skip a re-render when nothing changed. Raw state reproduces both —
	 * assignment is the only signal, so returning the same reference invalidates
	 * nothing, exactly as React bails out of an equal `setState`.
	 *
	 * That is also why the registrars below build a plain `new Map`/`new Set`
	 * copy rather than reaching for `SvelteMap`/`SvelteSet`: the collection is
	 * never mutated in place, so a reactive one would have nothing to observe,
	 * and mutating a shared instance would lose exactly the identity comparison
	 * the bail-out depends on. Each copy carries its own disable for that reason.
	 */
	let sheetLabels = $state.raw<ReadonlyMap<string, string>>(new Map());
	let sheetPurposes = $state.raw<ReadonlyMap<string, DialogPurpose>>(new Map());
	let unmountedSheetIds = $state.raw<ReadonlySet<string>>(new Set());
	let transition = $state.raw<SheetTransitionState>(IDLE_TRANSITION);

	/**
	 * The `setState(current => next)` form, with its bail-out.
	 *
	 * The read is untracked because these run from child callbacks, which the
	 * panel invokes from inside *its* effects — a tracked read would make the
	 * child's effect depend on the switcher's state and re-enter it. React cannot
	 * express that coupling: a callback contributes its identity to a dependency
	 * array and never its reads.
	 */
	function updateTransition(update: (current: SheetTransitionState) => SheetTransitionState): void {
		const current = untrack(() => transition);
		const next = update(current);
		if (next !== current) {
			transition = next;
		}
	}

	const activeSheetChanged = $derived(committedActiveSheet !== activeSheet);
	const visibleTransition = $derived(
		activeSheetChanged
			? transitionForActiveSheetChange(committedActiveSheet, activeSheet)
			: transition
	);
	const isFlowVisible = $derived(
		(activeSheet != null && !unmountedSheetIds.has(activeSheet)) ||
			(visibleTransition.retainedSheet != null &&
				!unmountedSheetIds.has(visibleTransition.retainedSheet))
	);
	const isModal = $derived(hasScrim && isFlowVisible);
	const activeSheetPurpose = $derived<DialogPurpose>(
		(activeSheet == null ? null : sheetPurposes.get(activeSheet)) ?? 'info'
	);
	const allowsEscapeDismiss = $derived(activeSheetPurpose !== 'required');
	const allowsLightDismiss = $derived(activeSheetPurpose === 'info');

	// Commit the active-sheet change. `$effect.pre` is upstream's
	// `useLayoutEffect`, and `activeSheet` is its only dependency; the rest is
	// ref-and-updater bookkeeping, read untracked.
	$effect.pre(() => {
		const nextActiveSheet = activeSheet;
		untrack(() => {
			const previousActiveSheet = committedActiveSheet;
			if (previousActiveSheet === nextActiveSheet) {
				return;
			}
			committedActiveSheet = nextActiveSheet;
			const nextTransition = transitionForActiveSheetChange(previousActiveSheet, nextActiveSheet);
			transition =
				nextTransition.retainedSheet != null && !sheetElements.has(nextTransition.retainedSheet)
					? IDLE_TRANSITION
					: nextTransition;
		});
	});

	function dismissOnEscape(): void {
		if (allowsEscapeDismiss) {
			onActiveSheetChange(null);
		}
	}

	function dismissOnLightInteraction(): void {
		if (allowsLightDismiss) {
			onActiveSheetChange(null);
		}
	}

	const focusTrap = useFocusTrap(() => ({
		isActive: isModal,
		onEscape: dismissOnEscape
	}));
	useScrollLock(() => isModal);

	/**
	 * Whatever opened the flow, captured before anything can move focus off it.
	 *
	 * Upstream captures this inside the layout effect that opens the dialog.
	 * That works in jsdom, which never performs the focus trap's initial focus —
	 * every element reads as unperceivable there. In a browser the trap activates
	 * in the same flush and pulls focus to the first control *inside* the sheet,
	 * so a capture from a post effect records that control as the trigger, and
	 * closing the flow then "restores" focus into the sheet it just dismissed.
	 * A pre effect runs before the DOM update and before every post effect, which
	 * is the only point where the answer is still the page's.
	 */
	$effect.pre(() => {
		const visible = isFlowVisible;
		const scrim = hasScrim;
		untrack(() => {
			if (visible && scrim && triggerEl == null) {
				triggerEl = document.activeElement as HTMLElement | null;
			}
		});
	});

	/**
	 * One shared shell for the whole flow. A modal flow enters the native top
	 * layer once and handoffs only swap panels inside it. The final panel owns the
	 * exit timing, so `isFlowVisible` goes false only when it is safe to close the
	 * dialog and restore focus.
	 *
	 * `$effect`, not `$effect.pre`, and `dialogEl` is read *tracked*. Upstream's
	 * `useLayoutEffect` runs after the commit, with `dialogRef.current` already
	 * populated; Svelte's `bind:this` is an effect of its own, created after this
	 * script's, so a pre effect would run first with no dialog to open and never
	 * hear about the one that arrived. A flow that was active on mount would then
	 * render a closed dialog and only open on the next unrelated change.
	 */
	$effect(() => {
		const visible = isFlowVisible;
		const scrim = hasScrim;
		const dialog = dialogEl;
		if (dialog == null) {
			return;
		}
		untrack(() => {
			if (visible) {
				const nextMode = scrim ? 'modal' : 'non-modal';
				if (dialog.open && dialogMode !== nextMode) {
					dialog.close();
				}
				if (!dialog.open) {
					if (scrim) {
						dialog.showModal();
					} else {
						dialog.show();
					}
				}
				dialogMode = nextMode;
				return;
			}

			if (dialog.open) {
				dialog.close();
			}
			if (dialogMode === 'modal') {
				triggerEl?.focus();
			}
			triggerEl = null;
			dialogMode = null;
		});
	});

	function getSheetPhase(sheetId: string): BottomSheetSwitcherPhase {
		if (sheetId === activeSheet) {
			return sheetId === visibleTransition.enteringSheet ? 'entering' : 'active';
		}
		if (sheetId === visibleTransition.retainedSheet) {
			return visibleTransition.retainedPhase ?? 'hidden';
		}
		return 'hidden';
	}

	function getSheetAlignmentOffset(sheetId: string): number {
		return visibleTransition.retainedSheet === sheetId ? visibleTransition.alignmentOffset : 0;
	}

	function registerSheetElement(sheetId: string, element: HTMLElement | null): void {
		if (element == null) {
			sheetElements.delete(sheetId);
			const current = untrack(() => unmountedSheetIds);
			if (!current.has(sheetId)) {
				// eslint-disable-next-line svelte/prefer-svelte-reactivity
				const next = new Set(current);
				next.add(sheetId);
				unmountedSheetIds = next;
			}
			updateTransition((state) => (state.retainedSheet === sheetId ? IDLE_TRANSITION : state));
		} else {
			sheetElements.set(sheetId, element);
			const current = untrack(() => unmountedSheetIds);
			if (current.has(sheetId)) {
				// eslint-disable-next-line svelte/prefer-svelte-reactivity
				const next = new Set(current);
				next.delete(sheetId);
				unmountedSheetIds = next;
			}
		}
	}

	function registerSheetLabel(sheetId: string, label: string | null): void {
		const current = untrack(() => sheetLabels);
		if (label == null) {
			if (!current.has(sheetId)) {
				return;
			}
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const next = new Map(current);
			next.delete(sheetId);
			sheetLabels = next;
			return;
		}
		if (current.get(sheetId) === label) {
			return;
		}
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const next = new Map(current);
		next.set(sheetId, label);
		sheetLabels = next;
	}

	function registerSheetPurpose(sheetId: string, purpose: DialogPurpose | null): void {
		const current = untrack(() => sheetPurposes);
		if (purpose == null) {
			if (!current.has(sheetId)) {
				return;
			}
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const next = new Map(current);
			next.delete(sheetId);
			sheetPurposes = next;
			return;
		}
		if (current.get(sheetId) === purpose) {
			return;
		}
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const next = new Map(current);
		next.set(sheetId, purpose);
		sheetPurposes = next;
	}

	// Clear a retained sheet once its panel has unmounted.
	$effect.pre(() => {
		const unmounted = unmountedSheetIds;
		updateTransition((state) =>
			state.retainedSheet != null && unmounted.has(state.retainedSheet) ? IDLE_TRANSITION : state
		);
	});

	function onSheetEnterStart(sheetId: string): void {
		updateTransition((state) => {
			if (
				state.enteringSheet !== sheetId ||
				state.retainedSheet == null ||
				state.retainedPhase !== 'covered'
			) {
				return state;
			}
			const alignmentOffset = alignmentOffsetForElements(
				sheetElements.get(sheetId),
				sheetElements.get(state.retainedSheet)
			);
			if (alignmentOffset <= ALIGNMENT_THRESHOLD_PX) {
				return state;
			}
			return {
				...state,
				retainedPhase: 'aligning',
				alignmentOffset,
				isAlignmentComplete: false
			};
		});
	}

	function onSheetTransitionComplete({ sheetId, phase }: BottomSheetSwitcherTransitionEvent): void {
		updateTransition((state) => {
			if (phase === 'entering') {
				if (state.enteringSheet !== sheetId) {
					return state;
				}
				if (state.retainedSheet == null) {
					return IDLE_TRANSITION;
				}
				if (state.retainedPhase === 'aligning' && !state.isAlignmentComplete) {
					return { ...state, enteringSheet: null };
				}
				return { ...state, enteringSheet: null, retainedPhase: 'fading' };
			}

			if (
				phase === 'aligning' &&
				state.retainedSheet === sheetId &&
				state.retainedPhase === 'aligning'
			) {
				return state.enteringSheet == null
					? { ...state, retainedPhase: 'fading' }
					: { ...state, isAlignmentComplete: true };
			}

			if (
				(phase === 'fading' || phase === 'exiting') &&
				state.retainedSheet === sheetId &&
				state.retainedPhase === phase
			) {
				return IDLE_TRANSITION;
			}

			return state;
		});
	}

	function setScrimOpacity(opacity: number): void {
		untrack(() => dialogEl)?.style.setProperty('--_sheet-scrim-opacity', String(opacity));
	}

	function onSheetScrimOpacityChange(sheetId: string, opacity: number): void {
		// A pointer captured by the outgoing sheet can keep delivering gesture
		// events after a handoff. Only the currently committed sheet owns the
		// shared backdrop, so stale gesture updates must not reach the dialog.
		if (sheetId !== committedActiveSheet) {
			return;
		}
		setScrimOpacity(opacity);
	}

	// Also waits for the element, for the reason above: on mount there is nothing
	// to set the property on until `bind:this` has run.
	$effect(() => {
		const target = activeSheet == null ? 0 : 1;
		if (dialogEl == null) {
			return;
		}
		setScrimOpacity(target);
	});

	/**
	 * The context value is a **stable object with accessor properties**, not a
	 * `$derived` one. A child reads `switcher()` in its own `$derived`s, and a
	 * fresh object each time would make every one of them recompute on any
	 * switcher state change; with accessors, a child subscribes to exactly the
	 * field it read — `activeSheet` here, the transition inside `getSheetPhase`.
	 * Upstream's `useMemo` dependency list is doing the same job in reverse.
	 */
	const contextValue: BottomSheetSwitcherContextValue = {
		get activeSheet() {
			return activeSheet;
		},
		get hasScrim() {
			return hasScrim;
		},
		onActiveSheetChange: (sheetId) => onActiveSheetChange(sheetId),
		getSheetPhase,
		getSheetAlignmentOffset,
		registerSheetElement,
		registerSheetLabel,
		registerSheetPurpose,
		onSheetEnterStart,
		onSheetTransitionComplete,
		onSheetScrimOpacityChange
	};
	setBottomSheetSwitcherContext(() => contextValue);

	const activeLabel = $derived(
		(activeSheet == null ? null : sheetLabels.get(activeSheet)) ??
			(visibleTransition.retainedSheet == null
				? undefined
				: sheetLabels.get(visibleTransition.retainedSheet))
	);

	/**
	 * Upstream composes each handler with the consumer's through
	 * `composeEventHandlers`, which runs the consumer's first and stops if it
	 * calls `preventDefault`. Reproduced explicitly here, in that order — a
	 * `{...rest}` spread beside an explicit handler for the same event is one
	 * object literal, and the last key would silently win.
	 */
	function handleCancel(event: Event): void {
		oncancelProp?.(event as Parameters<NonNullable<typeof oncancelProp>>[0]);
		if (event.defaultPrevented) {
			return;
		}
		event.preventDefault();
		dismissOnEscape();
	}

	function handleClick(event: MouseEvent): void {
		onclickProp?.(event as Parameters<NonNullable<typeof onclickProp>>[0]);
		if (event.defaultPrevented) {
			return;
		}
		if (hasScrim && event.target === event.currentTarget) {
			dismissOnLightInteraction();
		}
	}

	function handleKeyDown(event: KeyboardEvent): void {
		onkeydownProp?.(event as Parameters<NonNullable<typeof onkeydownProp>>[0]);
		if (event.defaultPrevented) {
			return;
		}
		// Modal Escape is owned by the focus trap so nested traps can win. A
		// non-modal switcher has no outer trap, so it keeps local dismissal while
		// deferring to an active nested layer and ignoring IME cancellation.
		if (
			!isModal &&
			event.key === 'Escape' &&
			!isImeKeyEvent(event) &&
			!hasActiveFocusTrapEscape()
		) {
			event.preventDefault();
			dismissOnEscape();
		}
	}

	const dialogAttrs = $derived(
		bottomSheetDialogAttrs(isFlowVisible, hasScrim, isFlowVisible && activeSheet == null, xstyle)
	);
	const ariaLabel = $derived(
		(rest['aria-label'] as string | undefined) ??
			(rest['aria-labelledby'] == null ? activeLabel : undefined)
	);
</script>

<dialog
	{...rest}
	bind:this={dialogEl}
	class={cx(dialogAttrs.class, className)}
	style={mergeStyle(dialogAttrs.style, styleProp as string | undefined)}
	aria-label={ariaLabel}
	aria-modal={isModal ? 'true' : undefined}
	oncancel={handleCancel}
	onclick={handleClick}
	onkeydown={handleKeyDown}
	{...activeSheetPurpose === 'required' ? { role: 'alertdialog' } : {}}
	{@attach focusTrap.attachContainer}
>
	{@render children()}
	<!-- A modal flow's `::backdrop` already answers Safari's edge sampler. -->
	{#if !hasScrim}
		<BottomSheetEdgeTint />
	{/if}
</dialog>
