<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { StyleArg } from '../../internal/sx.js';
	// Aliased locally only so the imports and the re-exports below do not name
	// the same bindings twice in one module.
	import type { BottomSheetHeight as BottomSheetHeightValue } from './bottom-sheet-panel.stylex.js';
	import type { BottomSheetSnapPoint as BottomSheetSnapPointValue } from './snap-offsets.js';

	// Both types live beside this module on either side, and upstream's
	// `BottomSheetPanel.tsx` re-exports them from the component module, so this
	// port does too — `BottomSheet.tsx` reads them from here.
	export type { BottomSheetHeight } from './bottom-sheet-panel.stylex.js';
	export type { BottomSheetSnapPoint } from './snap-offsets.js';

	export type BottomSheetPanelMotion = 'entering' | 'aligning' | 'fading' | 'exiting';

	export type BottomSheetPanelState =
		| { kind: 'hidden' }
		| { kind: 'open'; entering: boolean }
		| {
				kind: 'retained';
				motion: 'covered' | 'aligning' | 'fading';
				alignmentOffset: number;
		  }
		| { kind: 'exiting' };

	export interface BottomSheetPanelProps extends BaseProps<HTMLDivElement> {
		/**
		 * Upstream calls this prop `state`. Renamed because Svelte's compiler asks
		 * for it: a local binding named `state` in a scope that also uses the
		 * `$state` rune emits `store_rune_conflict`, whose message is *"Referencing
		 * a local variable with a `$` prefix will create a store subscription.
		 * Please rename `state` to avoid the ambiguity"*. This component is
		 * internal and unexported, so no published API changes.
		 *
		 * **This comment used to say Svelte "errors on it", and that was wrong.**
		 * `store_rune_conflict` is a *warning*; the component compiles either way,
		 * on both the client and server generations. A parity audit challenged the
		 * rename on exactly that overstatement, compiled a replica of this file's
		 * shape, saw it compile, and concluded the justification did not reproduce
		 * — which is the right conclusion from a wrong premise, and cost a round
		 * trip to settle. The rename stands on the warning, not on an error.
		 */
		panelState: BottomSheetPanelState;
		height: BottomSheetHeightValue | number | string;
		children: Snippet;
		snapPoints?: ReadonlyArray<BottomSheetSnapPointValue>;
		isSwipeDismissAllowed?: boolean;
		/** Whether the host has locked page scrolling (a modal, scrim-backed sheet). */
		isPageScrollLocked?: boolean;
		onDismiss: () => void;
		onScrimOpacity: (opacity: number) => void;
		onElementChange?: (element: HTMLDivElement | null) => void;
		onMotionStart?: (motion: BottomSheetPanelMotion) => void;
		onMotionComplete?: (motion: BottomSheetPanelMotion) => void;
		xstyle?: StyleArg;
	}

	function motionForState(panelState: BottomSheetPanelState): BottomSheetPanelMotion | null {
		if (panelState.kind === 'open') {
			return panelState.entering ? 'entering' : null;
		}
		if (panelState.kind === 'retained') {
			return panelState.motion === 'covered' ? null : panelState.motion;
		}
		return panelState.kind === 'exiting' ? 'exiting' : null;
	}
</script>

<script lang="ts">
	import { cx, mergeStyle } from '../../internal/sx.js';
	import { themeProps } from '../../internal/theme-props.js';
	import { useDevWarning } from '../../hooks/use-dev-warning.svelte.js';
	import { isValidSnapPoint, resolveSnapPoints } from './snap-offsets.js';
	import { useMobileKeyboard } from './use-mobile-keyboard.svelte.js';
	import { useSheetGestures } from './use-sheet-gestures.svelte.js';
	import { waitForTransition } from './wait-for-transition.js';
	import {
		HEIGHT_BUDGETS,
		MOBILE_KEYBOARD_BOTTOM_CLEARANCE,
		OVERSCROLL_PADDING,
		bottomSheetBodyAttrs,
		bottomSheetHandleBarAttrs,
		bottomSheetHandlePillAttrs,
		bottomSheetPanelAttrs
	} from './bottom-sheet-panel.stylex.js';

	/**
	 * Ported from Astryx's `BottomSheet/BottomSheetPanel.tsx`.
	 *
	 * The visual and gesture surface shared by every `BottomSheet` host. It owns
	 * everything intrinsic to a sheet surface: height budgets, drag and snap
	 * gestures, the handle and scrolling body, motion styles, and transition
	 * completion. It deliberately does not own a dialog, focus, inert state, or
	 * switcher registration; those belong to the hosting controller.
	 *
	 * Not exported from the barrel — upstream keeps it internal.
	 */
	let {
		panelState,
		height,
		children,
		snapPoints,
		class: className,
		style: styleProp,
		tabindex,
		xstyle,
		isSwipeDismissAllowed = true,
		isPageScrollLocked = false,
		onDismiss,
		onScrimOpacity,
		onElementChange,
		onMotionStart,
		onMotionComplete,
		...rest
	}: BottomSheetPanelProps = $props();

	let element = $state<HTMLDivElement | null>(null);

	// Plain `let`s: motion bookkeeping nothing renders from.
	// Seeded at init on purpose — upstream's `useRef(state)` does the same, and the
	// `$effect.pre` below is what keeps it current from then on.
	// svelte-ignore state_referenced_locally
	let previousState: BottomSheetPanelState = panelState;
	let reactivatedEntrance = false;
	let startedMotion: BottomSheetPanelMotion | null = null;
	let pendingMotionComplete: BottomSheetPanelMotion | null = null;

	const isEntering = $derived(panelState.kind === 'open' && panelState.entering);
	const isInteractive = $derived(panelState.kind === 'open');
	const isPresented = $derived(panelState.kind !== 'hidden');
	const isRetained = $derived(panelState.kind === 'retained');
	const isInactive = $derived(isRetained || panelState.kind === 'exiting');
	const isClosing = $derived(panelState.kind === 'exiting');
	const isFading = $derived(
		isRetained && panelState.kind === 'retained' && panelState.motion === 'fading'
	);
	const alignmentOffset = $derived(panelState.kind === 'retained' ? panelState.alignmentOffset : 0);

	// Upstream computes this during render, comparing against the previous state
	// it holds in a ref. `$effect.pre` is the counterpart: it runs before the DOM
	// updates, which is the same point in the cycle.
	$effect.pre(() => {
		const wasEntering = previousState.kind === 'open' && previousState.entering;
		if (isEntering && !wasEntering) {
			reactivatedEntrance = previousState.kind === 'retained';
		} else if (!isEntering) {
			reactivatedEntrance = false;
		}
		previousState = panelState;
	});

	// The resolver is rebuilt only when the *points* change, not on every drag
	// frame: its identity is what tells `useSheetGestures` the stops moved. It
	// reads `snapPoints` at call time, so it resolves against whatever the
	// viewport is then rather than what it was when the resolver was built.
	//
	// Measure the same viewport the height budgets are written against. Those are
	// `dvh`, which the virtual keyboard does not shrink, so reading
	// `visualViewport` here would make the two disagree by exactly the keyboard's
	// height: every detent would move while the sheet it measures did not. A
	// keyboard is `useMobileKeyboard`'s business — it holds the sheet still and
	// scrolls the body — and it does not redefine the sheet's detents.
	function layoutViewportHeight(): number {
		return typeof window === 'undefined' ? 0 : window.innerHeight;
	}

	/**
	 * A stable identity for a set of snap points. Type-tagged, so the fraction
	 * `0.5` and the (invalid) string `'0.5'` cannot collide on one key.
	 */
	const snapPointsKey = $derived(
		(snapPoints ?? []).map((point) => `${typeof point}:${point}`).join('|')
	);

	const snapHeights = $derived.by(() => {
		// Read the key so a change to the points rebuilds the resolver; the points
		// themselves are read inside it, at call time.
		const key = snapPointsKey;
		if (key === '') {
			return undefined;
		}
		return () => resolveSnapPoints(snapPoints ?? [], layoutViewportHeight());
	});

	const ignoredSnapPointsMessage = $derived.by(() => {
		const ignored = (snapPoints ?? []).filter((point) => !isValidSnapPoint(point));
		return ignored.length === 0
			? ''
			: `snapPoints ignored ${JSON.stringify(ignored)}. A snap point is a viewport fraction above 0 and up to 1 (0.5 is half the screen), a px length ('320px'), or a percentage ('50%').`;
	});

	useDevWarning(
		'BottomSheet',
		() => ignoredSnapPointsMessage,
		() => ignoredSnapPointsMessage !== ''
	);

	const gestures = useSheetGestures({
		isOpen: () => isInteractive,
		canDismiss: () => isSwipeDismissAllowed,
		offscreenBlockEndInset: () => OVERSCROLL_PADDING,
		onDismiss: () => onDismiss(),
		snapHeights: () => snapHeights,
		onScrimOpacity: (opacity) => onScrimOpacity(opacity)
	});

	useMobileKeyboard({
		body: () => gestures.bodyElement,
		bottomClearance: () => MOBILE_KEYBOARD_BOTTOM_CLEARANCE,
		isEnabled: () => height === 'tall',
		isFullyExpanded: () => gestures.settledOffset === 0,
		isPageScrollLocked: () => isPageScrollLocked,
		isSheetTraveling: () => gestures.isDragging && gestures.dragOffset !== gestures.settledOffset,
		isOpen: () => isInteractive,
		isPresented: () => isPresented,
		sheet: () => element
	});

	// Reports `null` on teardown as well, which is the half of upstream's ref
	// callback a bare effect drops: React calls `setElement(null)` when the panel
	// unmounts, and a switcher learns that its sheet has gone only from that call.
	// Without it a flow whose sheet unmounts on close — a sheet rendered behind an
	// `{#if}` — leaves the shared dialog open with nothing in it.
	$effect(() => {
		onElementChange?.(element);
		return () => onElementChange?.(null);
	});

	const motion = $derived(motionForState(panelState));

	/**
	 * Both effects below are upstream's `useLayoutEffect`s, and both are `$effect`
	 * here rather than `$effect.pre` — the mapping this port uses everywhere else.
	 *
	 * The usual counterpart holds for a layout effect that *writes* before paint.
	 * These two **read** the element they act on: `waitForTransition` measures its
	 * computed transition and attaches a listener to it. `$effect.pre` runs before
	 * the DOM update, so it would read the style of the render that is being
	 * replaced — during a drag that style carries the hook's inline
	 * `transition: none`, and the settle would resolve on the spot instead of
	 * waiting for the snap it was supposed to follow. It would also run before
	 * `bind:this` had assigned the element at all, and `waitForTransition(null)`
	 * completes immediately by contract, reporting every entrance finished on the
	 * frame it started.
	 *
	 * React's `useLayoutEffect` runs after the DOM is committed and before paint,
	 * which is where Svelte's `$effect` runs. Declaration order then keeps
	 * upstream's arming-before-recording sequence, since both are post effects.
	 */
	$effect(() => {
		const current = motion;
		const sheet = element;
		if (current == null || sheet == null) {
			return;
		}
		startedMotion = null;
		pendingMotionComplete = null;
		if (current === 'entering' && reactivatedEntrance) {
			pendingMotionComplete = current;
			return;
		}
		return waitForTransition(sheet, current === 'fading' ? 'opacity' : 'transform', () => {
			if (startedMotion === current) {
				onMotionComplete?.(current);
			} else {
				pendingMotionComplete = current;
			}
		});
	});

	// The snap is transform-only; the layout height reconciles when it lands.
	// `waitForTransition` — the same helper the motion states use — resolves that
	// even when no `transitionend` is coming: inline or computed `transition:
	// none`, a zero duration, and a timer backstop otherwise.
	$effect(() => {
		const sheet = element;
		if (gestures.settlingLayoutOffset == null || sheet == null) {
			return;
		}
		return waitForTransition(sheet, 'transform', gestures.completeScrollAreaSettle);
	});

	$effect(() => {
		const current = motion;
		if (current == null || element == null) {
			return;
		}
		onMotionStart?.(current);
		startedMotion = current;
		if (pendingMotionComplete === current) {
			pendingMotionComplete = null;
			onMotionComplete?.(current);
		}
		return () => {
			if (startedMotion === current) {
				startedMotion = null;
			}
			if (pendingMotionComplete === current) {
				pendingMotionComplete = null;
			}
		};
	});

	const isNamedHeight = $derived(typeof height === 'string' && height in HEIGHT_BUDGETS);
	const budget = $derived(
		isNamedHeight
			? HEIGHT_BUDGETS[height as BottomSheetHeightValue]
			: typeof height === 'number'
				? `${height}px`
				: (height as string)
	);

	/**
	 * The hook hands its style over as a declaration *string*, where upstream
	 * hands over an object and the panel rebuilds it with `{...contentProps.style,
	 * transform: gestureTransform}`. That spread does two things a concatenation
	 * cannot: it replaces the hook's transform when the panel has one of its own,
	 * and it **removes** the transform when the panel has none — which is exactly
	 * the state a sheet settled on a detent is in, its travel having moved from
	 * the transform into the layout height. Appending would leave the hook's
	 * translate as the last writer and pin the settled sheet a detent too low.
	 *
	 * So the transform is split out of the string here, and the two halves are
	 * reassembled below in the panel's own order.
	 */
	const hookTransform = $derived(
		/transform:\s*([^;]+)/.exec(gestures.contentProps.style)?.[1]?.trim()
	);
	const hookStyleWithoutTransform = $derived(
		gestures.contentProps.style
			.split(';')
			.map((declaration) => declaration.trim())
			.filter((declaration) => declaration !== '' && !declaration.startsWith('transform:'))
			.join('; ')
	);

	// The sheet's travel is split across two properties: `layoutOffset` is the
	// part the scrolling area gives up as layout height, and the remainder is a
	// compositor transform. Live gestures and snaps only ever move the transform —
	// the layout height changes at rest, in one reconciling render whose visible
	// geometry is identical (see `use-sheet-gestures`).
	//   - dragging above the base restores the full height below the viewport
	//   - a peek settles with layout 0, so it slides rather than reflowing
	const geometry = $derived.by(() => {
		if (gestures.sheetHeight <= 0) {
			// Unmeasured: the hook's own transform stands, as upstream's
			// `gestureTransform = contentProps.style.transform` seed does.
			return {
				transform: hookTransform,
				height: undefined as string | undefined
			};
		}
		const layoutOffset = gestures.isDragging
			? gestures.dragOffset < gestures.settledOffset
				? 0
				: gestures.settledLayoutOffset
			: (gestures.settlingLayoutOffset ?? gestures.settledLayoutOffset);
		const activeOffset = gestures.isDragging ? gestures.dragOffset : gestures.settledOffset;
		const translation = activeOffset - layoutOffset;

		// At layout 0 the sheet is its natural height, so leave that to CSS — `hug`
		// sheets must stay fit-content. While the sheet is in motion it is pinned in
		// px instead: content reflowing mid-gesture would move the surface out from
		// under the finger, or under the snap.
		const isTraveling = gestures.isDragging || gestures.settlingLayoutOffset != null;
		return {
			transform: translation !== 0 ? `translateY(${translation}px)` : undefined,
			height:
				layoutOffset > 0 || isTraveling
					? `${Math.max(0, gestures.sheetHeight - Math.max(0, layoutOffset))}px`
					: undefined
		};
	});

	const retainedTransform = $derived(
		alignmentOffset > 0
			? [geometry.transform, `translateY(${alignmentOffset}px)`].filter(Boolean).join(' ')
			: geometry.transform
	);

	const panelAttrs = $derived(
		bottomSheetPanelAttrs(
			isClosing,
			isFading,
			isInactive,
			height === 'hug',
			height !== 'hug',
			xstyle
		)
	);
	const theme = themeProps('bottom-sheet');
	const handleBarAttrs = bottomSheetHandleBarAttrs();
	const handlePillAttrs = bottomSheetHandlePillAttrs();
	const bodyAttrs = $derived(bottomSheetBodyAttrs(height === 'tall'));

	/** The panelState-dependent half of the inline style, as upstream's spread is. */
	const stateStyle = $derived(
		isInteractive
			? [
					hookStyleWithoutTransform,
					geometry.transform && `transform: ${geometry.transform}`,
					geometry.height && `height: ${geometry.height}`
				]
			: isRetained
				? [
						retainedTransform && `transform: ${retainedTransform}`,
						geometry.height && `height: ${geometry.height}`
					]
				: isClosing
					? [geometry.height && `height: ${geometry.height}`]
					: []
	);

	const inlineStyle = $derived(
		[`--_sheet-budget: ${budget}`, ...stateStyle.filter(Boolean)].join('; ')
	);
</script>

<div
	{...rest}
	bind:this={element}
	tabindex={tabindex ?? -1}
	{...theme}
	{...gestures.sheetAttachment}
	class={cx(theme.class, panelAttrs.class, className)}
	style={mergeStyle(mergeStyle(panelAttrs.style, inlineStyle), styleProp as string | undefined)}
>
	<!--
		`handleProps` carries its own `style` (the touch-action and grab cursor the
		drag needs), so it is merged rather than spread over the handle bar's own —
		upstream's spread order lets one silently win, which is only harmless there
		because the stylex half happens to be empty.
	-->
	<div
		class={handleBarAttrs.class}
		{...gestures.handleProps}
		style={mergeStyle(handleBarAttrs.style, gestures.handleProps.style)}
		aria-hidden="true"
	>
		<div class={handlePillAttrs.class} style={handlePillAttrs.style}></div>
	</div>
	<div
		class={bodyAttrs.class}
		style={mergeStyle(
			bodyAttrs.style,
			gestures.scrollPreservationInset > 0
				? `padding-block-end: ${gestures.scrollPreservationInset}px`
				: undefined
		)}
		{...gestures.bodyProps}
	>
		{@render children()}
	</div>
</div>
