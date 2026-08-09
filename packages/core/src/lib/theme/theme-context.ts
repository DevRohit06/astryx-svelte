import { Context } from '../internal/context.js';
import type { DefinedTheme } from './define-theme.js';
import type { ThemeMode } from './types.js';

/**
 * The value `<Theme>` publishes — the theme object plus the `mode` prop it was
 * given, unresolved (`'system'` stays `'system'`; resolving it is the reader's
 * job, because that needs a media query).
 *
 * `@internal` upstream, but published all the same: `theme/index.ts` re-exports
 * both `ThemeContext` and `ThemeContextValue`, so ours does too.
 */
export interface ThemeContextValue {
	/** The defined theme object. */
	theme: DefinedTheme;
	/** The colour mode prop passed to `<Theme>`. */
	mode: ThemeMode;
}

/**
 * Context for the nearest `<Theme>`. Absent means no provider above this
 * component, which is upstream's `createContext(null)` default and the branch
 * `useThemeMode` falls through to `<html data-theme>` on.
 *
 * A getter, per the port's context convention: `mode` changes when a consumer
 * flips the toggle, and a stored value would freeze at the mount-time one.
 */
export const ThemeContext = new Context<() => ThemeContextValue>('astryx.theme');

export function setThemeContext(get: () => ThemeContextValue): void {
	ThemeContext.set(get);
}

/** Returns a getter, or null when there is no `<Theme>` ancestor. */
export function useThemeContext(): (() => ThemeContextValue) | null {
	return ThemeContext.getOr(null);
}

/**
 * Whether this `<Theme>` is nested inside another one. The root — and only the
 * root — syncs its attributes onto `<html>`.
 *
 * Upstream's counterpart is a second context defaulting to `false`; here the
 * presence of `ThemeContext` would almost serve, but not quite: it is set by
 * the same component during initialisation, and a component reads its *own*
 * context back after setting it. So nesting gets its own marker, read before
 * the set, exactly as upstream reads `ThemeNestingContext` before providing it.
 *
 * Module-private on both sides.
 */
const themeNestingContext = new Context<true>('astryx.theme-nesting');

export function isNestedTheme(): boolean {
	return themeNestingContext.getOr(false) === true;
}

export function markThemeNested(): void {
	themeNestingContext.set(true);
}
