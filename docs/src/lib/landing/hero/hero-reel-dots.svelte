<script lang="ts">
	import { Pagination, Text } from '@astryx-svelte/core';
	import { useHeroReel } from './hero-reel-context.svelte.js';

	/**
	 * Dot controls + a polite live region announcing the active theme. Ported from
	 * upstream's `HeroReelDots`.
	 *
	 * Renders nothing when the reel has one slide or fewer — which is upstream's
	 * guard, and is the state this port is in until a second theme package lands
	 * (see `hero-theme-content.ts`).
	 */
	const reel = useHeroReel();

	const reelState = $derived(reel());
	const slides = $derived(reelState?.slides ?? []);
	const active = $derived(reelState ? slides[reelState.index] : undefined);
</script>

{#if reelState && slides.length > 1 && active}
	<!--
		Real Pagination (dots variant). It's 1-indexed, so page = index + 1. The
		prev/next chevrons it ships with are hidden on the home page via a
		[data-home-page] rule in landing.css, leaving just the dots.
	-->
	<div class="dots">
		<Pagination
			variant="dots"
			label="Preview Astryx themes"
			page={reelState.index + 1}
			totalPages={slides.length}
			onChange={(page) => reelState.goTo(page - 1)}
		/>
	</div>
	<Text as="span" type="supporting" aria-live="polite">
		<span class="sr-only">{active.label} theme</span>
	</Text>
{/if}

<style>
	/* Centres the pagination dots with breathing room above. */
	.dots {
		display: flex;
		justify-content: center;
		margin-block-start: var(--spacing-6);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}
</style>
