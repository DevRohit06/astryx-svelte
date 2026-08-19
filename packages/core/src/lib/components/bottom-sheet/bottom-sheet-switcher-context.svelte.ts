import { Context } from '../../internal/context.js';
import type { DialogPurpose } from '../dialog/dialog.svelte';

/**
 * Ported from Astryx's `BottomSheet/BottomSheetSwitcherContext.ts`.
 *
 * The private coordination layer for mutually exclusive `BottomSheet`s: a
 * `BottomSheetSwitcher` owns which sheet is active and what phase each one is
 * in, and every `BottomSheet` beneath it reads its own phase out of here rather
 * than owning entry/exit itself.
 *
 * Not published from the barrel — upstream exports neither the context nor its
 * value type, and a consumer coordinates sheets by nesting them in a
 * `BottomSheetSwitcher`, not by reading this.
 *
 * The context stores a **getter**, for the reason `internal/contexts.svelte.ts`
 * sets out: context is read once at init, so a plain value would freeze every
 * sheet at whatever phase the switcher held on mount — which is precisely the
 * state this context exists to change.
 */

/**
 * Where a sheet is in the switcher's choreography.
 *
 * - `entering` — sliding up for the first time
 * - `active` — the frontmost sheet, interactive
 * - `covered` — still mounted behind a sheet that replaced it
 * - `aligning` — resizing to match the incoming sheet's height
 * - `fading` — crossfading out under its replacement
 * - `exiting` — sliding down and away
 * - `hidden` — mounted but not shown
 */
export type BottomSheetSwitcherPhase =
	'entering' | 'active' | 'covered' | 'aligning' | 'fading' | 'exiting' | 'hidden';

/** Reported by a sheet when one of its choreographed transitions finishes. */
export interface BottomSheetSwitcherTransitionEvent {
	sheetId: string;
	phase: 'entering' | 'aligning' | 'fading' | 'exiting';
}

export interface BottomSheetSwitcherContextValue {
	activeSheet: string | null;
	hasScrim: boolean;
	onActiveSheetChange: (sheetId: string | null) => void;
	getSheetPhase: (sheetId: string) => BottomSheetSwitcherPhase;
	getSheetAlignmentOffset: (sheetId: string) => number;
	registerSheetElement: (sheetId: string, element: HTMLElement | null) => void;
	registerSheetLabel: (sheetId: string, label: string | null) => void;
	registerSheetPurpose: (sheetId: string, purpose: DialogPurpose | null) => void;
	onSheetEnterStart: (sheetId: string) => void;
	onSheetTransitionComplete: (event: BottomSheetSwitcherTransitionEvent) => void;
	onSheetScrimOpacityChange: (sheetId: string, opacity: number) => void;
}

export const BottomSheetSwitcherContext = new Context<() => BottomSheetSwitcherContextValue>(
	'astryx.bottomSheetSwitcher'
);

export function setBottomSheetSwitcherContext(get: () => BottomSheetSwitcherContextValue): void {
	BottomSheetSwitcherContext.set(get);
}

/**
 * The enclosing switcher's value, or `null` when the sheet stands alone.
 *
 * Upstream's context defaults to `null` and every consumer null-checks it; a
 * standalone `BottomSheet` owns its own visibility, which is what that branch
 * expresses.
 */
export function useBottomSheetSwitcher(): () => BottomSheetSwitcherContextValue | null {
	return BottomSheetSwitcherContext.getOr(() => null);
}
