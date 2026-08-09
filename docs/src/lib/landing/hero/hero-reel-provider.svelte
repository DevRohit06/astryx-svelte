<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ThemeMode } from '@astryx-svelte/core';
	import { useMediaQuery } from '@astryx-svelte/core/hooks';
	import { setHeroReel, type HeroReelState } from './hero-reel-context.svelte.js';
	import {
		HERO_THEME_SLIDES,
		REEL_FONT_SPECIFIERS,
		REEL_IMAGE_SRCS
	} from './hero-theme-content.js';

	/**
	 * Owns the cycling state + auto-advance clock and publishes them via context.
	 * Renders no DOM of its own beyond the hover/focus wrapper the hero uses to
	 * pause cycling while the reader interacts with it.
	 *
	 * Ported from upstream's `HeroReelProvider` in `HeroThemeReel.tsx`.
	 */
	interface Props {
		/** The docsite's raw colour mode — `'system'` until the OS resolves. */
		userMode: ThemeMode;
		children: Snippet;
	}

	const { userMode, children }: Props = $props();

	// How long each theme stays on screen before auto-advancing (ms).
	const ADVANCE_INTERVAL_MS = 4500;
	// Auto-advance carousel master switch.
	const AUTOPLAY_ENABLED = true;
	const SWIPE_THRESHOLD_PX = 45;

	const slides = HERO_THEME_SLIDES;

	let index = $state(0);
	let paused = $state(false);

	const reduceMotion = useMediaQuery(() => '(prefers-reduced-motion: reduce)');
	// Auto-advance is desktop-only; on mobile the reel stays manual (swipe + dots)
	// so the cards don't move on their own while the reader reads/scrolls.
	const isNarrow = useMediaQuery(() => '(max-width: 1023px)');

	function goTo(next: number): void {
		const count = slides.length;
		if (count === 0) return;
		index = ((next % count) + count) % count;
	}

	function setPaused(next: boolean): void {
		paused = next;
	}

	// Touch swipe (mobile): swipe left → next theme, right → previous.
	let touchStart: { x: number; y: number } | null = null;

	function onTouchStart(event: TouchEvent): void {
		const touch = event.touches[0];
		if (!touch) return;
		touchStart = { x: touch.clientX, y: touch.clientY };
		// Touch devices have no hover, so pause auto-advance while the finger is down.
		paused = true;
	}

	function onTouchEnd(event: TouchEvent): void {
		paused = false;
		const start = touchStart;
		touchStart = null;
		if (!start || slides.length <= 1) return;
		const touch = event.changedTouches[0];
		if (!touch) return;
		const dx = touch.clientX - start.x;
		const dy = touch.clientY - start.y;
		// Only a mostly-horizontal gesture counts, so vertical scroll isn't a swipe.
		if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) return;
		goTo(dx < 0 ? index + 1 : index - 1);
	}

	$effect(() => {
		if (
			!AUTOPLAY_ENABLED ||
			reduceMotion.matches ||
			isNarrow.matches ||
			paused ||
			slides.length <= 1
		) {
			return;
		}
		const id = window.setInterval(() => {
			index = (index + 1) % slides.length;
		}, ADVANCE_INTERVAL_MS);
		return () => window.clearInterval(id);
	});

	$effect(() => {
		const onVisibility = () => {
			paused = document.hidden;
		};
		document.addEventListener('visibilitychange', onVisibility);
		return () => document.removeEventListener('visibilitychange', onVisibility);
	});

	// Warm the reel's per-theme assets once, after first paint, so first-time
	// visitors don't see fonts flash (FOUT) and product photos pop in as the reel
	// auto-advances. The @font-face rules ship in the root layout's Google Fonts
	// <link>, but a family's woff2 is only fetched when a glyph using it first
	// paints — and the remote card photos aren't fetched until their slide
	// renders; both happen mid-swap on a cold cache. Kicking the fetches off here
	// (off the critical path, scoped to just the reel's fonts and photos) gets
	// them into cache before the first advance without touching initial LCP.
	$effect(() => {
		// Defer to idle time so warming never competes with first paint / LCP.
		const schedule =
			window.requestIdleCallback?.bind(window) ??
			((callback: () => void) => window.setTimeout(callback, 200));
		const cancel = window.cancelIdleCallback?.bind(window) ?? window.clearTimeout;

		const handle = schedule(() => {
			// Fonts: ask the CSS Font Loading API to load each reel family. This
			// pulls the woff2 the @font-face rule points at without hardcoding
			// gstatic's hashed URLs (which rotate). Failures (e.g. a family not in
			// the sheet) are non-fatal — the slide just paints its fallback.
			if (document.fonts?.load) {
				for (const spec of REEL_FONT_SPECIFIERS) {
					document.fonts.load(spec).catch(() => {});
				}
			}
			// Images: prime the browser cache with the reel's product photos so
			// they are decoded by the time their slide swaps in.
			for (const src of REEL_IMAGE_SRCS) {
				const image = new Image();
				image.decoding = 'async';
				image.src = src;
			}
		});

		return () => cancel(handle as never);
	});

	const reelState = $derived<HeroReelState>({
		slides,
		index,
		goTo,
		animate: !reduceMotion.matches,
		setPaused,
		userMode
	});

	setHeroReel(() => reelState);
</script>

<!--
	The hover/focus/touch wrapper. `touch-action: pan-y` so a horizontal swipe
	goes to our handler rather than the page's side-pan.

	a11y: this is a pause affordance layered over decorative art, not an
	interactive control — the dots below it are the real controls, and they carry
	the keyboard interface. There is nothing to focus here and nothing to
	activate, which is why it takes pointer/focus events without a role.
-->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="swipe-area"
	onmouseenter={() => (paused = true)}
	onmouseleave={() => (paused = false)}
	onfocusin={() => (paused = true)}
	onfocusout={() => (paused = false)}
	ontouchstart={onTouchStart}
	ontouchend={onTouchEnd}
>
	{@render children()}
</div>

<style>
	.swipe-area {
		touch-action: pan-y;
	}
</style>
