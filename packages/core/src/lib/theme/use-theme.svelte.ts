import { dataAttr } from '../internal/naming.js';
import { useThemeMode } from '../internal/theme-mode.svelte.js';
import { useThemeContext } from './theme-context.js';
import { getRegisteredTheme } from './theme-registry.js';
import { resolveThemeTokens } from './tokens.js';
import type { DefinedTheme } from './define-theme.js';

/**
 * Ported from Astryx's `src/theme/useTheme.ts`.
 *
 * Gives synchronous access to theme token values resolved for the current
 * colour mode — for canvas, SVG and data-viz consumers that need concrete
 * values rather than `var()` references.
 *
 * The mode half is `internal/theme-mode.svelte.ts`, which already implements
 * upstream's three-term resolution (`<Theme>` context → `<html data-theme>` →
 * OS preference) and its shared refcounted `MutationObserver`. This adds the
 * token half on top, so there is one mode resolver rather than two.
 *
 * The *theme* half resolves the same way: `<Theme>` context → the registry
 * entry named by `<html data-astryx-theme>` → the bare token defaults. So a
 * consumer with no `<Theme>` above it — a detached root, `useToast`'s fallback
 * viewport — still resolves the app's theme rather than the defaults.
 *
 * Upstream keeps the two root attributes on **two** refcounted observers, one
 * per `attributeFilter`, not one observer watching both: `useThemeName` wants
 * only the name, and pairing the filters would wake it on every mode flip. So
 * a no-context `useTheme()` joins both — two observers for any number of
 * consumers, which is what its lifecycle suite counts.
 *
 * Must be called during component initialisation, like every context-reading
 * hook in this port; the returned object stays live.
 *
 * `useThemeName` is the other half upstream declares here — theme *identity*
 * without the token resolution, for consumers that only need the name.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useTheme } from '@astryx-svelte/core';
 *   const theme = useTheme();
 * <\/script>
 *
 * <svg>
 *   <rect fill={theme.token('--color-accent')} />
 *   <text fill={theme.token('--color-text-primary')}>Sales</text>
 * </svg>
 * ```
 */

/** Resolved theme data returned by `useTheme`. */
export interface UseThemeReturn {
	/**
	 * Theme name — the nearest `<Theme>`'s, or the root one's via
	 * `<html data-astryx-theme>`, or `'default'` when neither names a theme the
	 * registry knows.
	 */
	readonly name: string;
	/** Resolved effective mode — never `'system'`. */
	readonly mode: 'light' | 'dark';
	/**
	 * Resolve a token to its raw CSS value for the current colour mode.
	 *
	 * For `[light, dark]` tuples this returns the side matching the mode; for
	 * single-value tokens, the value as-is. Falls back to the token defaults when
	 * the theme does not override the name, and to `''` when nothing declares it.
	 *
	 * @example
	 * ```ts
	 * const accent = theme.token('--color-accent'); // "#0064E0" in light mode
	 * const spacing = theme.token('--spacing-4');   // "16px"
	 * ```
	 */
	token: (name: string) => string;
	/**
	 * Every token resolved for the current colour mode: the defaults merged with
	 * the theme's overrides, with `light-dark()` values reduced to one side.
	 *
	 * A `$derived`, so the reference is stable until the theme or the effective
	 * mode changes — which is what upstream's `useMemo` buys.
	 */
	readonly tokens: Record<string, string>;
}

// The name half's shared, refcounted `MutationObserver`, mirroring the mode
// half's in `internal/theme-mode.svelte.ts`: every no-context consumer wants the
// same `<html data-astryx-theme>` attribute, so one observer serves all of them.
// A plain `Set` for the reason that one gives — it refcounts the observer and
// nothing reads it in a render.
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const rootNameAttrListeners = new Set<() => void>();
let rootNameAttrObserver: MutationObserver | null = null;

function readRootThemeNameAttr(): string | null {
	if (typeof document === 'undefined') {
		return null;
	}
	return document.documentElement.getAttribute(dataAttr('theme'));
}

function subscribeRootNameAttr(onChange: () => void): () => void {
	rootNameAttrListeners.add(onChange);

	if (rootNameAttrListeners.size === 1 && typeof MutationObserver !== 'undefined') {
		rootNameAttrObserver = new MutationObserver(() => {
			for (const listener of rootNameAttrListeners) {
				listener();
			}
		});
		rootNameAttrObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: [dataAttr('theme')]
		});
	}

	return () => {
		rootNameAttrListeners.delete(onChange);
		if (rootNameAttrListeners.size === 0 && rootNameAttrObserver) {
			rootNameAttrObserver.disconnect();
			rootNameAttrObserver = null;
		}
	};
}

/**
 * The live `<html data-astryx-theme>` value, or `null` when a `<Theme>` is in
 * context.
 *
 * Upstream's `useRootThemeNameAttr(hasCtx)`, shared by `useThemeName` and
 * `useTheme` so the two hooks refcount **one** name observer between them
 * rather than one each. `hasCtx` swaps in the no-op store exactly as upstream's
 * does: a consumer on the provider path never touches the DOM or joins the
 * observer, so the value it would shadow is never read anyway.
 */
function useRootThemeNameAttr(hasCtx: boolean): { readonly current: string | null } {
	let rootAttrName = $state<string | null>(null);

	// `$effect.pre` for the reason `useThemeMode` gives — it does not run during
	// SSR, and on a client-only mount it runs before the first DOM write.
	$effect.pre(() => {
		if (hasCtx) return;

		const sync = (): void => {
			rootAttrName = readRootThemeNameAttr();
		};
		sync();
		return subscribeRootNameAttr(sync);
	});

	return {
		get current(): string | null {
			return hasCtx ? null : rootAttrName;
		}
	};
}

/** The live theme name returned by `useThemeName`. */
export interface UseThemeNameReturn {
	/** The nearest theme's name, or `null` when nothing names one. */
	readonly current: string | null;
}

/**
 * The nearest active Astryx theme's *name*.
 *
 * Reads `ThemeContext` when there is a `<Theme>` above, and otherwise follows
 * the root `<Theme>`'s `<html data-astryx-theme>` attribute. Deliberately
 * lighter than `useTheme()` for consumers that only need theme identity — a
 * name-keyed `getIcon(name, themeName)` lookup, say — since it resolves no
 * tokens and never touches the media query.
 *
 * Upstream returns the string itself, because React re-runs the component body;
 * here it comes back on a live object, per the port's hook convention. Call
 * during component initialisation, like every context-reading hook here.
 */
export function useThemeName(): UseThemeNameReturn {
	const themeContext = useThemeContext();
	const rootThemeName = useRootThemeNameAttr(themeContext != null);

	return {
		get current(): string | null {
			return themeContext?.().theme.name ?? rootThemeName.current;
		}
	};
}

export function useTheme(): UseThemeReturn {
	const themeContext = useThemeContext();
	const themeMode = useThemeMode();
	// The theme half of the no-context fallback the mode half already had: with
	// no `<Theme>` above, follow the root one's `<html data-astryx-theme>` into
	// the registry instead of resolving the bare defaults.
	const rootThemeName = useRootThemeNameAttr(themeContext != null);

	const theme = $derived<DefinedTheme | null>(
		themeContext?.().theme ?? getRegisteredTheme(rootThemeName.current)
	);
	const tokens = $derived(resolveThemeTokens(theme, { mode: themeMode.current }));

	return {
		get name(): string {
			return theme?.name ?? 'default';
		},
		get mode(): 'light' | 'dark' {
			return themeMode.current;
		},
		token: (name: string): string => tokens[name] ?? '',
		get tokens(): Record<string, string> {
			return tokens;
		}
	};
}
