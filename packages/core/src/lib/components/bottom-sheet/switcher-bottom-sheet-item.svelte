<script lang="ts" module>
	import type { BottomSheetPanelState } from './bottom-sheet-panel.svelte';
	import type {
		BottomSheetSwitcherContextValue,
		BottomSheetSwitcherPhase
	} from './bottom-sheet-switcher-context.svelte.js';
	import type { SwitcherBottomSheetProps } from './bottom-sheet.svelte';

	export interface SwitcherBottomSheetItemProps extends SwitcherBottomSheetProps {
		/**
		 * The enclosing switcher, read from context by `BottomSheet` and handed
		 * down, as upstream hands it down. A getter, so the item sees the
		 * switcher's current phase rather than the one it held at mount.
		 */
		switcher: () => BottomSheetSwitcherContextValue;
	}

	function panelStateForSwitcherPhase(
		phase: BottomSheetSwitcherPhase,
		alignmentOffset: number
	): BottomSheetPanelState {
		switch (phase) {
			case 'active':
				return { kind: 'open', entering: false };
			case 'entering':
				return { kind: 'open', entering: true };
			case 'covered':
			case 'aligning':
			case 'fading':
				return { kind: 'retained', motion: phase, alignmentOffset };
			case 'exiting':
				return { kind: 'exiting' };
			case 'hidden':
				return { kind: 'hidden' };
		}
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import BottomSheetPanel, { type BottomSheetPanelMotion } from './bottom-sheet-panel.svelte';
	import { setBottomSheetSwitcherContext } from './bottom-sheet-switcher-context.svelte.js';
	import { bottomSheetPositionerAttrs } from './bottom-sheet.stylex.js';
	import { focusPanel } from './focus-panel.js';
	import { useDevWarning } from '../../hooks/use-dev-warning.svelte.js';

	/**
	 * Ported from the private `SwitcherBottomSheetItem` in Astryx's
	 * `BottomSheet/BottomSheet.tsx`.
	 *
	 * The host for a sheet that participates in a `BottomSheetSwitcher`'s shared
	 * dialog. It owns no dialog of its own: the switcher decides which sheet is
	 * active and what phase each one is in, and this host translates that phase
	 * into the panel's state, registers itself with the switcher, and reports its
	 * transitions back.
	 *
	 * Its own file because Svelte allows one component per module where upstream
	 * declares both hosts beside the router. Not exported from the barrel.
	 */
	let {
		switcher,
		sheetId,
		label,
		children,
		height = 'capped',
		snapPoints,
		purpose = 'info',
		xstyle,
		...rest
	}: SwitcherBottomSheetItemProps = $props();

	/**
	 * A sheet's own content starts a fresh ownership scope, so a `BottomSheet`
	 * nested inside this one is standalone unless it establishes a switcher of
	 * its own — upstream's `<BottomSheetSwitcherContext value={null}>` wrapper.
	 *
	 * Setting it here rather than around the children is the Svelte counterpart:
	 * context resolves at the **render site**, and the consumer's `children`
	 * snippet renders inside this component's subtree, so a `BottomSheet` written
	 * in it reads this null and not the switcher above.
	 */
	setBottomSheetSwitcherContext(() => null);

	// A plain `let`, mirroring upstream's ref: the panel element this host focuses
	// into. Nothing renders from it.
	let panelEl: HTMLDivElement | null = null;

	const hasValidSheetId = $derived(typeof sheetId === 'string' && sheetId.length > 0);
	const phase = $derived<BottomSheetSwitcherPhase>(
		hasValidSheetId ? switcher().getSheetPhase(sheetId) : 'hidden'
	);
	const alignmentOffset = $derived(
		hasValidSheetId ? switcher().getSheetAlignmentOffset(sheetId) : 0
	);
	const panelState = $derived(panelStateForSwitcherPhase(phase, alignmentOffset));

	const isInteractive = $derived(phase === 'active' || phase === 'entering');
	const isInactive = $derived(
		phase === 'covered' || phase === 'aligning' || phase === 'fading' || phase === 'exiting'
	);
	const isPresented = $derived(phase !== 'hidden');
	const isTopSheet = $derived(phase === 'active' || phase === 'entering');

	/**
	 * The panel invokes every callback below from inside its *own* effects, so
	 * anything they read would become a dependency of the panel's effect — a
	 * coupling React cannot express, because a callback in a dependency array
	 * contributes its identity and never its reads. Each body is therefore
	 * untracked. The reads stay current: `untrack` suspends subscription, not
	 * evaluation.
	 */
	function dismissOnSwipe(): void {
		untrack(() => {
			const { activeSheet, onActiveSheetChange } = switcher();
			if (purpose === 'info' && hasValidSheetId && activeSheet === sheetId) {
				onActiveSheetChange(null);
			}
		});
	}

	function handlePanelElementChange(element: HTMLDivElement | null): void {
		untrack(() => {
			panelEl = element;
			if (hasValidSheetId) {
				switcher().registerSheetElement(sheetId, element);
			}
		});
	}

	function handleMotionStart(motion: BottomSheetPanelMotion): void {
		untrack(() => {
			if (motion === 'entering' && hasValidSheetId) {
				switcher().onSheetEnterStart(sheetId);
			}
		});
	}

	function handleMotionComplete(motion: BottomSheetPanelMotion): void {
		untrack(() => {
			if (hasValidSheetId) {
				switcher().onSheetTransitionComplete({ sheetId, phase: motion });
			}
		});
	}

	function handleScrimOpacity(opacity: number): void {
		untrack(() => {
			if (hasValidSheetId) {
				switcher().onSheetScrimOpacityChange(sheetId, opacity);
			}
		});
	}

	// Registration. `$effect.pre` is upstream's `useLayoutEffect`: the switcher
	// must know this sheet's label and purpose before it paints a shared dialog
	// around them. The registrars are stable members of the switcher's value, so
	// only `sheetId` and the registered value are dependencies, as upstream.
	$effect.pre(() => {
		if (!hasValidSheetId) {
			return;
		}
		const { registerSheetLabel } = untrack(switcher);
		registerSheetLabel(sheetId, label);
		return () => registerSheetLabel(sheetId, null);
	});

	$effect.pre(() => {
		if (!hasValidSheetId) {
			return;
		}
		const { registerSheetPurpose } = untrack(switcher);
		registerSheetPurpose(sheetId, purpose);
		return () => registerSheetPurpose(sheetId, null);
	});

	/**
	 * Focus on presentation.
	 *
	 * Upstream splits this in two: a layout effect writes the current phase into
	 * a ref, and a passive effect reads the value captured during *render* —
	 * which is the phase before that write. One effect that reads its own
	 * previous value and updates it last is the same thing, and keeping them
	 * separate here would not be: `$effect.pre` runs before `$effect` in the same
	 * flush, so the update would land before the read.
	 */
	// svelte-ignore state_referenced_locally
	let previousPhase: BottomSheetSwitcherPhase = phase;
	let hasPresented = false;

	$effect(() => {
		const currentPhase = phase;
		const interactive = isInteractive;
		const { hasScrim } = switcher();
		const wasInteractive = previousPhase === 'active' || previousPhase === 'entering';

		if (interactive) {
			if (!hasPresented || !wasInteractive) {
				focusPanel(panelEl, hasScrim);
			}
			hasPresented = true;
		} else if (currentPhase === 'hidden') {
			hasPresented = false;
		}

		previousPhase = currentPhase;
	});

	useDevWarning(
		'BottomSheet',
		'requires a non-empty `label` for an accessible name; the open sheet ' +
			'has no built-in heading to derive one from.',
		() => isInteractive && !label
	);

	const positionerAttrs = $derived(bottomSheetPositionerAttrs(!isPresented, isTopSheet));
</script>

<div
	class={positionerAttrs.class}
	style={positionerAttrs.style}
	hidden={!isPresented}
	aria-hidden={isInactive ? 'true' : undefined}
	inert={isInactive ? true : undefined}
>
	<BottomSheetPanel
		{...rest}
		{panelState}
		{height}
		{snapPoints}
		{xstyle}
		{children}
		isSwipeDismissAllowed={purpose === 'info'}
		isPageScrollLocked={switcher().hasScrim}
		onDismiss={dismissOnSwipe}
		onScrimOpacity={handleScrimOpacity}
		onElementChange={handlePanelElementChange}
		onMotionStart={handleMotionStart}
		onMotionComplete={handleMotionComplete}
	/>
</div>
