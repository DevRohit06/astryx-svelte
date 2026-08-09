import { getContext, setContext } from 'svelte';
import type { ThemeMode } from '@astryx-svelte/core';

/**
 * The docs site's colour-mode preference, ported from the `ThemeModeContext`
 * half of upstream's `app/providers.tsx`.
 *
 * Upstream's shape, kept exactly, because the split is load-bearing:
 *
 * - **`themeMode`** is the raw, system-aware value handed to `<Theme mode>`. It
 *   stays `'system'` on the first paint so every `<Theme>` scope keeps
 *   `color-scheme: light dark` and its `light-dark()` tokens follow the OS
 *   before any JavaScript runs — no flash, no blocking script.
 * - **`mode`** is the resolved `'light' | 'dark'` that UI consumers read (the
 *   toggle's label, and the hero reel's dark-slide decision). `'system'` only
 *   survives until the effect below resolves it.
 *
 * `toggle` is upstream's `toggleMode`: it marks the preference manual — which
 * stops OS tracking — and flips light↔dark. There is no three-way cycle back to
 * `'system'`; `'system'` is the *unresolved* state, not a third choice.
 *
 * **One thing here is not upstream's: persistence.** Upstream writes the note
 * that a fully SSR-correct manual toggle would need a server-read cookie and
 * leaves it out of scope, so its choice is lost on reload. This port already
 * stored the preference in `localStorage` before this pass, and dropping it
 * would be a regression for a reader who set dark mode two pages ago. The read
 * happens in `$effect.pre` — after first paint, client-only, since
 * `localStorage` does not exist on the server — so it costs nothing at SSR.
 *
 * **And it is why `app.html` carries a blocking stamp.** The claim above that
 * this design has "no flash, no blocking script" holds only for a reader with no
 * stored preference. Give one to a reader whose OS says the opposite and the
 * first paint is necessarily wrong: the server cannot read `localStorage`, so it
 * renders `system`, and this pre-effect only runs after that paint. Measured on
 * `/docs/tokens` with a light OS and a stored `dark`, the page background was
 * `rgb(248, 244, 237)` — light — for the whole pre-hydration window. The inline
 * script in `app.html` stamps `<html data-theme>` from *this* key before the
 * first paint; the pre-effect below still runs and lands on the same value, so
 * the two agree and nothing moves.
 */

/**
 * Duplicated verbatim by the blocking script in `app.html`, which cannot import
 * it. `assertStampKeyMatches` fails in dev if the two ever drift — a silent
 * drift would restore the flash with nothing else looking wrong.
 */
const STORAGE_KEY = 'astryx-svelte:color-mode';

/** Dev-only: the pre-paint stamp published the key it read; it must be ours. */
function assertStampKeyMatches(): void {
	if (!import.meta.env.DEV) return;
	const stamped = document.documentElement.getAttribute('data-color-mode-key');
	if (stamped !== STORAGE_KEY) {
		throw new Error(
			`app.html's pre-paint colour-mode stamp reads "${stamped}" but useColorMode() writes ` +
				`"${STORAGE_KEY}". They must match or a stored preference flashes the wrong mode.`
		);
	}
}

function isMode(value: string | null): value is ThemeMode {
	return value === 'light' || value === 'dark' || value === 'system';
}

export interface ColorModeState {
	/** Resolved colour mode for UI consumers (toggle label, hero reel). */
	mode: 'light' | 'dark';
	/** Raw, system-aware mode for `<Theme mode>`. `'system'` until resolved. */
	themeMode: ThemeMode;
	/** Mark the preference manual and flip light↔dark. Upstream's `toggleMode`. */
	toggle: () => void;
}

export function useColorMode(): ColorModeState {
	let raw = $state<ThemeMode>('system');
	let isManual = $state(false);

	// A stored preference is a manual one, so restoring it also stops OS
	// tracking — otherwise the media-query effect below would immediately
	// overwrite what the reader chose.
	$effect.pre(() => {
		assertStampKeyMatches();
		const stored = localStorage.getItem(STORAGE_KEY);
		if (isMode(stored) && stored !== 'system') {
			raw = stored;
			isManual = true;
		}
	});

	// Resolve `'system'` to a concrete mode and track OS changes until the
	// reader toggles. Visually identical to what the first paint already showed,
	// so nothing flips.
	$effect(() => {
		if (isManual) return;
		const query = window.matchMedia('(prefers-color-scheme: dark)');
		const sync = () => {
			raw = query.matches ? 'dark' : 'light';
		};
		sync();
		query.addEventListener('change', sync);
		return () => query.removeEventListener('change', sync);
	});

	return {
		get mode(): 'light' | 'dark' {
			return raw === 'dark' ? 'dark' : 'light';
		},
		get themeMode(): ThemeMode {
			return raw;
		},
		toggle(): void {
			isManual = true;
			raw = raw === 'dark' ? 'light' : 'dark';
			localStorage.setItem(STORAGE_KEY, raw);
		}
	};
}

const COLOR_MODE_KEY = Symbol('docs.colorMode');

/**
 * Publish the one colour-mode instance to the tree. Upstream's
 * `<ThemeModeContext value={…}>` in `providers.tsx`.
 *
 * **This exists because `useColorMode()` is a factory, not a store.** Every call
 * builds its own `$state`, so a second call gives you a second, unrelated
 * preference — the nav toggles one and the hero reel reads the other, and the
 * hero simply never changes mode. The root layout creates the instance once and
 * publishes it here; everything else reads it.
 */
export function setColorModeContext(state: ColorModeState): void {
	setContext(COLOR_MODE_KEY, state);
}

/** Read the shared colour mode. Call at component init. */
export function getColorModeContext(): ColorModeState {
	const state = getContext<ColorModeState | undefined>(COLOR_MODE_KEY);
	if (!state) {
		throw new Error('getColorModeContext() called outside the root layout’s provider');
	}
	return state;
}
