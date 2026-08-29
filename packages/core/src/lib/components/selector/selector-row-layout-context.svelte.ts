import { Context } from '../../internal/context.js';

/**
 * Ported from Astryx's `Selector/SelectorRowLayoutContext.ts`.
 *
 * The trigger inside an `InputGroup` is height-pinned by the group, so its
 * value box is clamped to one line and anything taller is cut off at the fold.
 * This context is how the rows the system draws itself avoid being cut: they
 * reflow label and description onto that one line instead. The geometry does
 * not depend on it — a node that ignores this context still cannot grow the
 * row.
 *
 * As every context here does, it stores a **getter** rather than the value: a
 * frozen value would strand a consumer at its mount-time state.
 *
 * Upstream's `Selector/index.ts` publishes neither the context object nor the
 * hook, so neither is re-exported from the barrel. `SelectorRowLayoutProvider`
 * stands in for React's `<SelectorRowLayoutContext value>` wrapper, which JSX
 * gets for free and setting context here does not.
 */

/** The row layout a host imposes on the options it renders. */
export type SelectorRowLayout = 'stacked' | 'inline';

/** Named as upstream names its context object, and module-private as it is there. */
export const SelectorRowLayoutContext = new Context<() => SelectorRowLayout>(
	'astryx.selectorRowLayout'
);

export function setSelectorRowLayoutContext(get: () => SelectorRowLayout): void {
	SelectorRowLayoutContext.set(get);
}

/**
 * The row layout a host imposes on the options it renders. `stacked` outside
 * any height-pinned host — upstream's context default, which a `SelectorOption`
 * rendered anywhere else legitimately reads.
 */
export function useSelectorRowLayout(): () => SelectorRowLayout {
	return SelectorRowLayoutContext.getOr(() => 'stacked');
}
