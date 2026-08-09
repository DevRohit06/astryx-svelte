import { Context } from '../../internal/context.js';

/**
 * Ported from Astryx's `Layout/LayoutDividerContext.ts`.
 *
 * A container-set default for `LayoutHeader`/`LayoutFooter`'s `hasDivider`. An
 * explicit prop always wins; with none, the nearest `Layout` that set
 * `defaultHasDividers` decides.
 */

export interface LayoutDividerContextValue {
	defaultHasDividers: boolean;
}

/** Named as upstream names its context object, and public for the same reason. */
export const LayoutDividerContext = new Context<() => LayoutDividerContextValue | null>(
	'astryx.layoutDivider'
);

export function setLayoutDividerContext(get: () => LayoutDividerContextValue | null): void {
	LayoutDividerContext.set(get);
}

/** Returns a getter, or `null` when there is no `Layout` above. */
export function useLayoutDivider(): () => LayoutDividerContextValue | null {
	return LayoutDividerContext.getOr(() => null);
}
