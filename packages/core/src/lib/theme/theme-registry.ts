import type { DefinedTheme } from './define-theme.js';

/**
 * The theme registry, ported from Astryx's `src/theme/themeRegistry.ts`.
 *
 * A module-level name → `DefinedTheme` map, so code can resolve theme data by
 * its stable name without a component context. Upstream's motivation is RSC —
 * `use(ThemeContext)` is unavailable there, so the *name* travels instead of the
 * object. Here the equivalent path is a plain `.ts` module with no component
 * above it: `getIcon(name, 'brand')` resolves through this rather than needing a
 * `<Theme>` in scope.
 *
 * Deliberately **not** reactive state. Nothing renders from this map: `Icon` and
 * `useIcon` read the nearest `<Theme>` off Svelte's context — which is a signal
 * already — and reach the registry only through the string arm of
 * `IconRegistrySource`, which no component in this package passes. A `SvelteMap`
 * would add signal bookkeeping for no reader, the same call `theme.svelte`'s
 * `injectedThemes` and `theme-mode.svelte.ts`'s listener set make.
 */
const themeRegistry = new Map<string, DefinedTheme>();

/**
 * Register a defined theme under its `name`.
 *
 * Registration is idempotent and replaces any previous theme with the same
 * name. Called by `defineTheme` and by `<Theme>`; call it directly for a built
 * theme that ships as a plain object.
 */
export function registerTheme(theme: DefinedTheme): void {
	themeRegistry.set(theme.name, theme);
}

/** A previously registered theme by name, or `null`. */
export function getRegisteredTheme(name: string | null | undefined): DefinedTheme | null {
	if (name == null || name === '') {
		return null;
	}
	return themeRegistry.get(name) ?? null;
}

/** Every registered theme, keyed by theme name. A fresh snapshot per call. */
export function getRegisteredThemes(): ReadonlyMap<string, DefinedTheme> {
	return new Map(themeRegistry);
}

/**
 * Reset the theme registry. For testing only.
 * @internal
 */
export function resetThemes(): void {
	themeRegistry.clear();
}
