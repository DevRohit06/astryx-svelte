<script lang="ts">
	import { onMount } from 'svelte';
	import { Theme } from '@astryx-svelte/core';
	import { effectiveMode, useHeroReel } from './hero-reel-context.svelte.js';
	import HeroFloatingCards from './hero-floating-cards.svelte';

	/**
	 * Full-bleed floating cards layer for the hero gutters, plus the three
	 * per-slide background layers that make the whole band retint with the active
	 * theme. Ported from upstream's `HeroReelCards`.
	 */
	const reel = useHeroReel();

	// Upstream's `useState(false)` + `useEffect(() => setMounted(true), [])`. It is
	// deliberately not `$derived`: the point is that the first render paints the
	// hidden pose and the *second* paints the shown one, which is what gives the
	// CSS transition two states to move between. `onMount` rather than an
	// `$effect` because there is nothing to re-run — it fires once, by definition.
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});

	const reelState = $derived(reel());
	const active = $derived(
		reelState && reelState.slides.length > 0 ? reelState.slides[reelState.index] : null
	);
	// Entrance animation only runs when motion is allowed; otherwise cards are
	// shown in their resting pose immediately.
	const shown = $derived(reelState?.animate ? mounted : true);
</script>

{#if active && reelState}
	<Theme theme={active.theme} mode={effectiveMode(active, reelState.userMode)}>
		<div class="theme-fill" aria-hidden="true"></div>
		<div class="nav-backdrop" aria-hidden="true"></div>
		<div
			class="backdrop-glow"
			aria-hidden="true"
			style="--aurora-left: {active.aurora.left}; --aurora-center: {active.aurora
				.center}; --aurora-right: {active.aurora.right}"
		></div>
		<!-- Floating cards layer -->
		<div class="cards-layer">
			<HeroFloatingCards content={active.content} mounted={shown} />
		</div>
	</Theme>
{/if}

<style>
	/* Sticky, zero-height layer hosting the overlap cards so they pin with the
	   hero and don't intercept clicks. */
	.cards-layer {
		position: sticky;
		top: var(--appshell-header-height, 0px);
		height: 0;
		width: 100%;
		pointer-events: none;
		z-index: 0;
	}

	/* Per-slide body fill behind the hero (resolves to the active theme's body
	   colour). Covers the band + an extra strip so the colour sits behind the
	   showcase's rounded top corners (no notch showing the docsite body colour).
	 *
	 * The extra MUST match the showcase overlay's corner radius, which is the
	 * docsite (Astryx) --radius-page = 32px. We can't read --radius-page here
	 * because this fill renders inside <Theme theme={active}>, where the active
	 * theme overrides it — e.g. Y2K sets --radius-page: 0, which left the fill
	 * 32px short and exposed the docsite body colour in the rounded corners.
	 * Hence a fixed 32px tied to the overlay radius rather than the theme token. */
	.theme-fill {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: calc(var(--hero-content-height, 760px) + 32px);
		background-color: var(--color-background-body);
		pointer-events: none;
		transition: background-color 600ms ease;
	}

	@media (min-width: 1024px) {
		.theme-fill {
			height: calc(760px + 32px);
		}
	}

	/* Per-slide band behind the transparent top nav so it retints too. */
	.nav-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: var(--appshell-header-height, 64px);
		background-color: var(--color-background-body);
		pointer-events: none;
		transition: background-color 600ms ease;
		z-index: 0;
	}

	/* Blurred aurora glow — fixed, in the same 1200px box as the cards so blobs
	   and cards stay aligned. Capped to 100vw to avoid horizontal scroll. Blob
	   centres sit under the card clusters; colours come from --aurora-* per slide. */
	.backdrop-glow {
		position: fixed;
		top: var(--appshell-header-height, 0px);
		left: 50%;
		transform: translateX(-50%);
		width: min(1200px, 100vw);
		height: 1050px;
		pointer-events: none;
		opacity: 0.7;
		transition: background-image 800ms ease;
		filter: blur(60px);
		background-image:
			radial-gradient(
				circle 220px at 5% 75%,
				var(--aurora-left),
				var(--aurora-left) 90%,
				transparent 100%
			),
			radial-gradient(
				circle 200px at 72% 85%,
				var(--aurora-center),
				var(--aurora-center) 90%,
				transparent 100%
			),
			radial-gradient(
				circle 260px at 92% 65%,
				var(--aurora-right),
				var(--aurora-right) 90%,
				transparent 100%
			);
		/* Visible at all widths (behind the collage on narrow + overlap on desktop). */
		display: block;
	}
</style>
