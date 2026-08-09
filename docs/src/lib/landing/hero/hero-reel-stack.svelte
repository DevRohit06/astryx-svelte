<script lang="ts">
	import { Theme } from '@astryx-svelte/core';
	import { effectiveMode, useHeroReel } from './hero-reel-context.svelte.js';
	import HeroFloatingCards from './hero-floating-cards.svelte';

	/**
	 * Narrow-screen (collage) variant of the hero cards, placed after the hero
	 * text on the page. Self-hides at ≥1024px, where `HeroReelCards` (overlap)
	 * takes over. Ported from upstream's `HeroReelStack`.
	 */
	const reel = useHeroReel();

	const reelState = $derived(reel());
	const active = $derived(
		reelState && reelState.slides.length > 0 ? reelState.slides[reelState.index] : null
	);
</script>

{#if active && reelState}
	<Theme theme={active.theme} mode={effectiveMode(active, reelState.userMode)}>
		<HeroFloatingCards content={active.content} mounted layout="stack" />
	</Theme>
{/if}
