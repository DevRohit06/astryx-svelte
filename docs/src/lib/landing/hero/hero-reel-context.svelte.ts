import { getContext, setContext } from 'svelte';
import type { ThemeMode } from '@astryx-svelte/core';
import type { HeroThemeSlide } from './hero-theme-content.js';

/**
 * The hero reel's shared cycling state, ported from the context half of
 * upstream's `HeroThemeReel.tsx`.
 *
 * The wordmark, the cards and the dots are placed in different parts of the DOM
 * by the page, so the active index has to reach them through context rather than
 * props — that is upstream's reason and it survives the translation unchanged.
 *
 * **The context stores a getter**, per this port's convention (see core's
 * `AppShellMobileContext` for the same note). Svelte reads context once, at
 * init, so a plain value would freeze every consumer at the first slide; a getter
 * is what buys the re-render React's `useMemo`'d value gets for free.
 *
 * Core wraps this pattern in `runed`'s `Context`; the docs app does not depend on
 * `runed`, so this uses Svelte's own `getContext`/`setContext` with a symbol key.
 * Same contract, one fewer dependency.
 */
export interface HeroReelState {
	slides: ReadonlyArray<HeroThemeSlide>;
	index: number;
	goTo: (index: number) => void;
	/** Whether entrance/cycle animation should run (false under reduced-motion). */
	animate: boolean;
	setPaused: (paused: boolean) => void;
	/**
	 * The docsite's colour mode for theme rendering. `'system'` on the first
	 * paint (before the OS preference resolves) so slides keep
	 * `color-scheme: light dark` and their `light-dark()` tokens follow the OS —
	 * no flash.
	 */
	userMode: ThemeMode;
}

const HERO_REEL_KEY = Symbol('docs.heroReel');

/** Publish the reel state. Call at the provider's init. */
export function setHeroReel(get: () => HeroReelState): void {
	setContext(HERO_REEL_KEY, get);
}

/** Call at component init; read the returned getter reactively. */
export function useHeroReel(): () => HeroReelState | null {
	return getContext<(() => HeroReelState) | undefined>(HERO_REEL_KEY) ?? (() => null);
}

/**
 * The colour mode a slide should render in: dark-first themes (e.g. Gothic) are
 * always dark; every other theme follows the docsite's colour mode so the hero
 * respects the user's light/dark toggle (and the OS preference via `'system'`
 * before that resolves).
 */
export function effectiveMode(slide: HeroThemeSlide, userMode: ThemeMode): ThemeMode {
	return slide.isDark ? 'dark' : userMode;
}

/**
 * Whether the active hero slide should render with light text/nav. True when the
 * slide is a dark-first theme (e.g. Gothic) OR the docsite is in dark mode — in
 * both cases the hero sits on a dark body and its text/nav must go light.
 *
 * `'system'` is treated as not-dark here: the light-text overrides only apply
 * once the resolved dark mode is known, which avoids forcing light ink on a
 * slide that may still paint its light scheme.
 *
 * Returns a getter, so a consumer tracks the reel advancing.
 */
export function useHeroReelIsDark(): () => boolean {
	const reel = useHeroReel();
	return () => {
		const current = reel();
		if (!current || current.slides.length === 0) return false;
		const active = current.slides[current.index];
		if (!active) return false;
		return effectiveMode(active, current.userMode) === 'dark';
	};
}
