import { useMediaQuery } from '../hooks/use-media-query.svelte.js';
import { useThemeContext } from '../theme/theme-context.js';

/**
 * The resolved colour mode — the `mode` half of Astryx's `useTheme()`.
 *
 * The public hook is `theme/use-theme.svelte.ts`, which is this plus token
 * resolution; both landed in batch 8. This stays `internal/` because it is a
 * *half* rather than a hook of its own — `hooks/` mirrors upstream's 19-hook
 * barrel, and upstream publishes `useTheme` from `theme/`, not from there.
 * `Toast` reads this directly, because the resolved mode is all it needs.
 *
 * Upstream resolves the effective mode as:
 *
 * ```
 * mode          = ThemeContext?.mode ?? <html data-theme> ?? 'system'
 * effectiveMode = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode
 * ```
 *
 * All three terms are present: `<Theme>` publishes the first, and a consumer
 * with no `<Theme>` above it falls through to the two below exactly as
 * upstream's no-provider path does.
 *
 * Note `effectiveMode` is never `'system'`: `'system'` is a configuration
 * value, and every consumer wants the resolved surface. `Toast` reads this to
 * pick the inverted `MediaTheme` mode for its surface.
 */

// Every no-context consumer wants the same `<html data-theme>` attribute, so
// one MutationObserver — refcounted via this listener set — serves all of them
// instead of one per consumer. Ported from upstream's `useTheme.ts`.
// A module-level subscriber registry, not reactive state: nothing reads it in a
// render or an effect, it only refcounts the shared observer. `SvelteSet` would
// add signal bookkeeping to every subscribe/unsubscribe for no reader.
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const rootThemeAttrListeners = new Set<() => void>();
let rootThemeAttrObserver: MutationObserver | null = null;

function readRootThemeAttr(): 'light' | 'dark' | null {
	if (typeof document === 'undefined') {
		return null;
	}
	const attr = document.documentElement.getAttribute('data-theme');
	return attr === 'light' || attr === 'dark' ? attr : null;
}

function subscribeRootThemeAttr(onChange: () => void): () => void {
	rootThemeAttrListeners.add(onChange);

	if (rootThemeAttrListeners.size === 1 && typeof MutationObserver !== 'undefined') {
		rootThemeAttrObserver = new MutationObserver(() => {
			for (const listener of rootThemeAttrListeners) {
				listener();
			}
		});
		rootThemeAttrObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});
	}

	return () => {
		rootThemeAttrListeners.delete(onChange);
		if (rootThemeAttrListeners.size === 0 && rootThemeAttrObserver) {
			rootThemeAttrObserver.disconnect();
			rootThemeAttrObserver = null;
		}
	};
}

export interface ThemeModeState {
	/** The resolved colour mode. Never `'system'`. */
	readonly current: 'light' | 'dark';
}

export function useThemeMode(): ThemeModeState {
	const themeContext = useThemeContext();
	let rootAttrMode = $state<'light' | 'dark' | null>(null);
	const prefersDark = useMediaQuery(() => '(prefers-color-scheme: dark)');

	// Only the no-context path observes the attribute, which is what upstream's
	// `hasCtx` store switch buys: a consumer under a `<Theme>` never touches the
	// DOM or joins the shared observer.
	//
	// `$effect.pre` for the reason `useMediaQuery` gives: it does not run during
	// SSR, and on a client-only mount it runs before the first DOM write, so the
	// resolved mode is correct in the same cases React's render-time snapshot is.
	$effect.pre(() => {
		if (themeContext) return;

		const sync = (): void => {
			rootAttrMode = readRootThemeAttr();
		};
		sync();
		return subscribeRootThemeAttr(sync);
	});

	return {
		get current(): 'light' | 'dark' {
			const mode = themeContext?.().mode ?? rootAttrMode ?? 'system';
			return mode === 'system' ? (prefersDark.matches ? 'dark' : 'light') : mode;
		}
	};
}
