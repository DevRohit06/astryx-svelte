import { Context } from './context.js';

/**
 * Svelte equivalents of Astryx's React contexts.
 *
 * The important difference from React: Svelte reads context once, during
 * component initialisation. Storing a plain value would freeze descendants at
 * whatever the container held on mount. So every context here stores a **getter
 * function**; the provider closes over its own reactive state and consumers call
 * the getter inside `$derived`, which re-runs.
 *
 * Consumers must still call `use*()` at init (not inside `$derived`), then read
 * the returned getter reactively. Calling `getContext` outside init is a Svelte
 * error waiting to happen.
 */

/** Standard element sizes used across interactive components. */
export type ElementSize = 'sm' | 'md' | 'lg';

/**
 * Lets container components (Toolbar, TopNav, Card headers) cascade a default
 * size to interactive children. An explicit `size` prop always wins.
 */
/**
 * Upstream publishes the context object itself from `SizeContext/index.ts`
 * alongside its provider and hook, so this is public under that name — the
 * arrangement `LayoutAreaContext` already uses. `setSizeContext` stands in for
 * upstream's `SizeProvider`.
 */
export const SizeContext = new Context<() => ElementSize | null>('astryx.size');

export function setSizeContext(get: () => ElementSize | null): void {
	SizeContext.set(get);
}

/**
 * Reads the inherited size at init and returns a resolver.
 *
 * Mirrors Astryx's `useSize(sizeProp, defaultSize)` precedence: explicit prop >
 * inherited container size > component default.
 */
export function useSize(): (explicit?: ElementSize, fallback?: ElementSize) => ElementSize {
	const inherited = SizeContext.getOr(null);

	return (explicit, fallback = 'md') => explicit ?? inherited?.() ?? fallback;
}

/** Orientation of a button group. Upstream publishes this name. */
export type ButtonGroupOrientation = 'horizontal' | 'vertical';

/**
 * The value a `ButtonGroup` publishes to its children.
 *
 * Named for the *value*, as upstream names it: `ButtonGroupContext` is its
 * React context **object**, which `ButtonGroup/index.ts` does not re-export, so
 * publishing the interface under that name would have claimed the wrong symbol.
 */
export interface ButtonGroupContextValue {
	orientation: ButtonGroupOrientation;
	isDisabled: boolean;
}

const buttonGroupContext = new Context<() => ButtonGroupContextValue>('astryx.buttonGroup');

export function setButtonGroupContext(get: () => ButtonGroupContextValue): void {
	buttonGroupContext.set(get);
}

/** Returns a getter, or null when the component is not inside a ButtonGroup. */
export function useButtonGroup(): (() => ButtonGroupContextValue) | null {
	return buttonGroupContext.getOr(null);
}
