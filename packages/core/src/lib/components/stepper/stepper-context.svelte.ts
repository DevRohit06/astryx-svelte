import { Context } from '../../internal/context.js';

/**
 * Svelte equivalent of Astryx's `Stepper/StepperContext.ts` — the channel a
 * `Step` reads to learn where it sits in the flow.
 *
 * As every context here does, it stores a **getter** rather than the value:
 * `activeStep` and `previousActiveStep` change on every navigation, and a frozen
 * value would strand a step at its mount-time progress. The provider
 * (`setStepperContext`) closes over the stepper's reactive state; consumers call
 * `useStepperContext()` at init and read the returned getter inside `$derived`.
 *
 * Upstream's `index.ts` publishes `useStepperContext` and the value/orientation/
 * position types but not the context object itself, so this module exports the
 * same surface — `setStepperContext` stands in for React's
 * `<StepperContext value>`.
 */
export type StepperOrientation = 'horizontal' | 'vertical';
export type StepperDensity = 'compact' | 'balanced' | 'spacious';

/**
 * Controls where each step's indicator sits relative to the connector track.
 * - 'separated': indicator lives in the label row, distinct from the progress
 *   bar (Astryx's original layout).
 * - 'on-track': indicator is slotted *into* the connector line as a node on the
 *   track, with the label beside (vertical) or below (horizontal). Aligns with
 *   the on-track stepper design.
 */
export type StepperIndicatorPosition = 'separated' | 'on-track';

export interface StepperContextValue {
	activeStep: number;
	/**
	 * The `activeStep` this stepper last rendered with, so a Step can tell
	 * whether the change it is reacting to was a single step forward — the one
	 * change that animates the connector fill — and which span that change
	 * crossed (see the CONNECTOR FILL block in `step.stylex.ts`). Equal to
	 * `activeStep` on the first render, which is what keeps a stepper that mounts
	 * mid-flow from animating its way to the step it opened on.
	 *
	 * Internal: not part of the public API, and deliberately not a Stepper prop.
	 * When the connector animates is behaviour the stepper owns, not something a
	 * consumer configures.
	 */
	previousActiveStep: number;
	orientation: StepperOrientation;
	isNonLinear: boolean;
	onStepClick: ((index: number) => void) | null;
	density: StepperDensity;
	indicatorPosition: StepperIndicatorPosition;
	/**
	 * Dev-mode index registration. Each Step calls this on mount with its `step`
	 * index. The Stepper tracks the set and warns if two Steps share the same
	 * index. Returns a cleanup function to call on unmount.
	 */
	registerStep: (index: number) => () => void;
}

const StepperContext = new Context<() => StepperContextValue>('astryx.stepper');

export function setStepperContext(get: () => StepperContextValue): void {
	StepperContext.set(get);
}

/** Returns the stepper getter, throwing when the step is not inside a `Stepper`. */
export function useStepperContext(): () => StepperContextValue {
	const ctx = StepperContext.getOr(null);
	if (ctx == null) {
		throw new Error(
			'useStepperContext must be used within Stepper. ' + 'Wrap your Step in <Stepper>.'
		);
	}
	return ctx;
}
