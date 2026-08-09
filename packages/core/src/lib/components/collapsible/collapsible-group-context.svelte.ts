import { Context } from '../../internal/context.js';

/**
 * The two contexts a `CollapsibleGroup` provides, ported from upstream's
 * `CollapsibleGroupContext.tsx`. Both are stored as **getters** so members stay
 * reactive. Neither context object is re-exported from the barrel (upstream keeps
 * them module-private); only the `CollapsibleGroupDensity` type is public.
 */

/** Coordinates open/close state across a group's collapsibles. */
export interface CollapsibleGroupContextValue {
	/** Whether a given value is currently open. */
	isOpen: (value: string) => boolean;
	/** Toggle the open state of a given value. */
	toggle: (value: string) => void;
}

/**
 * Row density for a group's items, controlling trigger/content block padding.
 * Shares the repo-wide density vocabulary (Table, List, Item).
 */
export type CollapsibleGroupDensity = 'compact' | 'balanced' | 'spacious';

/**
 * Lets each `Collapsible` draw its own group chrome (StyleX has no child
 * selectors, so the group can't style items from outside).
 */
export interface CollapsibleGroupPresentationValue {
	/** Whether items draw hairline dividers between one another. */
	hasDividers: boolean;
	/** Resolved row density, or null for the default unpadded look. */
	density: CollapsibleGroupDensity | null;
}

const CollapsibleGroupContext = new Context<() => CollapsibleGroupContextValue | null>(
	'astryx.collapsibleGroup'
);

// Kept separate from the coordination context so `Collapsible` can reset it to
// `null` around its children (nested collapsibles stay chrome-free) without
// touching the state API.
const CollapsibleGroupPresentationContext = new Context<
	() => CollapsibleGroupPresentationValue | null
>('astryx.collapsibleGroupPresentation');

export function setCollapsibleGroupContext(get: () => CollapsibleGroupContextValue | null): void {
	CollapsibleGroupContext.set(get);
}

export function useCollapsibleGroupContext(): () => CollapsibleGroupContextValue | null {
	return CollapsibleGroupContext.getOr(() => null);
}

export function setCollapsibleGroupPresentationContext(
	get: () => CollapsibleGroupPresentationValue | null
): void {
	CollapsibleGroupPresentationContext.set(get);
}

export function useCollapsibleGroupPresentationContext(): () => CollapsibleGroupPresentationValue | null {
	return CollapsibleGroupPresentationContext.getOr(() => null);
}
