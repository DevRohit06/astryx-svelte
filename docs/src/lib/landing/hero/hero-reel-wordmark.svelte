<script lang="ts">
	import { Theme } from '@astryx-svelte/core';
	import AstryxWordmark from '../../shell/astryx-wordmark.svelte';
	import { effectiveMode, useHeroReel } from './hero-reel-context.svelte.js';

	/**
	 * Themed, recolourable Astryx wordmark for the centred content column.
	 * Ported from upstream's `HeroReelWordmark`.
	 *
	 * The fallback branch is upstream's and matters more here than there: with no
	 * theme packages registered the reel would be empty, and the hero still needs
	 * a brand mark.
	 */
	const reel = useHeroReel();

	const reelState = $derived(reel());
	const active = $derived(
		reelState && reelState.slides.length > 0 ? reelState.slides[reelState.index] : null
	);
</script>

{#if active && reelState}
	<Theme theme={active.theme} mode={effectiveMode(active, reelState.userMode)}>
		<div class="wordmark-wrap" style="color: {active.wordmarkColor}">
			<AstryxWordmark class="wordmark" />
		</div>
	</Theme>
{:else}
	<!--
		Fallback: render the static brand wordmark in the default accent so the
		hero still has a brand mark even if no themes are registered.
	-->
	<div class="wordmark-wrap" style="color: var(--color-text-accent)">
		<AstryxWordmark class="wordmark" />
	</div>
{/if}

<style>
	/* Centres the wordmark SVG; it paints with currentColor (set per-slide). */
	.wordmark-wrap {
		position: relative;
		z-index: 1;
		display: flex;
		justify-content: center;
		transition-property: color;
		transition-duration: var(--duration-medium, 300ms);
		transition-timing-function: var(--ease-standard, ease);
	}

	/* Hero-scale wordmark, smaller on narrow screens. */
	.wordmark-wrap :global(.wordmark) {
		width: min(360px, 70%);
		height: auto;
	}

	@media (min-width: 768px) {
		.wordmark-wrap :global(.wordmark) {
			width: min(440px, 70%);
		}
	}

	@media (min-width: 1024px) {
		.wordmark-wrap :global(.wordmark) {
			width: min(520px, 70%);
		}
	}
</style>
