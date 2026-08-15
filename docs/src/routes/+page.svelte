<script lang="ts">
	import Seo from '$lib/seo/seo.svelte';
	import { GITHUB_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '$lib/seo/site.js';
	import { getColorModeContext } from '$lib/shell/color-mode.svelte.js';
	import HeroReelProvider from '$lib/landing/hero/hero-reel-provider.svelte';
	import HeroReelCards from '$lib/landing/hero/hero-reel-cards.svelte';
	import HeroContent from '$lib/landing/hero/hero-content.svelte';
	import FeaturesShowcase from '$lib/landing/features-showcase.svelte';
	import AboutShowcase from '$lib/landing/about-showcase.svelte';
	import DiscoverShowcase from '$lib/landing/discover-showcase.svelte';

	/**
	 * The home page, ported from upstream's `app/(site)/page.tsx`.
	 *
	 * The composition is a **pin-and-cover**: on desktop the hero is
	 * `position: fixed` inside this scope, which reserves its height with a
	 * spacer, and the showcase surface scrolls up over it with rounded top
	 * corners. Below 1024px the hero goes back into flow — the mobile hero is
	 * taller than the viewport, and pinning stranded the lower collage below the
	 * fold — and a `ResizeObserver` measures it so the spacer matches.
	 *
	 * Two body attributes are flags for `landing.css`: `data-nav-mode="surface"`
	 * once the showcase reaches the top, which switches the nav from transparent
	 * back to a frosted bar (set here), and `data-hero-dark` while the active
	 * slide is dark, which flips the hero text and the nav to a light ink (set by
	 * `HeroContent`, which is the component that can read the reel).
	 *
	 * **`BlogShowcase` is not ported.** Upstream renders it between
	 * `AboutShowcase` and `DiscoverShowcase`, built on `blogRegistry` +
	 * `BlogCard`/`BlogFeatureCard`. `/blog` is outside the v1 cut and the posts are
	 * Meta's, so the section is omitted rather than filled (port/todo.md → Phase 5).
	 */

	// The layout's instance, not a new one — see `setColorModeContext`. Reading a
	// fresh `useColorMode()` here is what stopped the hero reel following the
	// nav's light/dark toggle at all.
	const colorMode = getColorModeContext();

	let heroScope = $state<HTMLDivElement | null>(null);
	let heroContent = $state<HTMLElement | null>(null);
	let showcase = $state<HTMLElement | null>(null);

	function readNavHeight(): number {
		const raw = getComputedStyle(document.documentElement).getPropertyValue(
			'--_app-shell-header-height'
		);
		return parseFloat(raw) || 64;
	}

	// Measure the (auto-height) narrow hero content and expose it as
	// --hero-content-height so the spacer matches it (the showcase starts right
	// after the cards). Desktop uses the fixed band, so the var is ignored there.
	$effect(() => {
		const scope = heroScope;
		const content = heroContent;
		if (!scope || !content) return;

		const setVar = () => {
			const total = content.getBoundingClientRect().height + readNavHeight();
			scope.style.setProperty('--hero-content-height', `${Math.round(total)}px`);
		};

		setVar();
		const observer = new ResizeObserver(setVar);
		observer.observe(content);
		window.addEventListener('resize', setVar, { passive: true });
		return () => {
			observer.disconnect();
			window.removeEventListener('resize', setVar);
		};
	});

	$effect(() => {
		const element = showcase;
		if (!element) return;

		const update = () => {
			const reached = element.getBoundingClientRect().top <= readNavHeight();
			if (reached) {
				document.body.setAttribute('data-nav-mode', 'surface');
			} else {
				document.body.removeAttribute('data-nav-mode');
			}
		};

		update();
		window.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', update, { passive: true });

		return () => {
			window.removeEventListener('scroll', update);
			window.removeEventListener('resize', update);
			document.body.removeAttribute('data-nav-mode');
		};
	});
</script>

<!--
	The home page's title is the one place the site gets to say what it is to
	someone who has never heard of Astryx, so it names Meta rather than assuming
	the brand carries. `bare` keeps it from becoming "… · astryx-svelte".
-->
<Seo
	bare
	title="astryx-svelte — Meta’s Astryx design system, ported to Svelte 5"
	description={SITE_DESCRIPTION}
	schema={{
		'@context': 'https://schema.org',
		'@type': 'SoftwareSourceCode',
		name: SITE_NAME,
		description: SITE_DESCRIPTION,
		url: SITE_URL,
		codeRepository: GITHUB_URL,
		programmingLanguage: ['Svelte', 'TypeScript'],
		license: 'https://opensource.org/licenses/MIT',
		runtimePlatform: 'Svelte 5',
		isBasedOn: 'https://astryx.atmeta.com/'
	}}
/>

<div class="hero-scope" bind:this={heroScope}>
	<!--
		HeroReelProvider holds the shared cycling state for the cards, wordmark and
		dots. The headline/CTAs stay in stable Astryx brand style.
	-->
	<HeroReelProvider userMode={colorMode.themeMode}>
		<!-- Desktop overlap cards layer (the gutters). -->
		<HeroReelCards />
		<!-- Reserves the fixed hero's height so the showcase starts below it. -->
		<div class="hero-spacer" aria-hidden="true"></div>
		<HeroContent bind:element={heroContent} />
	</HeroReelProvider>
	<section class="showcase-overlay" bind:this={showcase}>
		<FeaturesShowcase />
		<AboutShowcase />
		<DiscoverShowcase />
	</section>
</div>

<style>
	/* Wraps hero + showcase so the pin-and-cover stays bounded to this container
	   (not pinned through the footer). */
	.hero-scope {
		position: relative;
		background-color: var(--color-background-body);
		/* Shared by the nav→wordmark gap and the text→cards gap so they match.
		   Declared here rather than in hero-content.svelte because the collage
		   wrapper reads it from outside the reel's <Theme>. */
		--hero-gap: calc(var(--spacing-12) * 2);
	}

	/* Reserves the fixed hero's height (desktop); 0 on narrow (hero is in flow). */
	.hero-spacer {
		height: 0;
	}

	@media (min-width: 1024px) {
		.hero-spacer {
			height: 760px;
		}
	}

	/* The surface that scrolls up over the pinned hero (pin-and-cover). */
	.showcase-overlay {
		position: relative;
		overflow: hidden;
		border-top-left-radius: var(--radius-page);
		border-top-right-radius: var(--radius-page);
		background-color: var(--color-background-surface);
		padding-block-start: var(--astryx-marketing-section-gap);
		/* Smaller than the section gap — the footer adds its own top spacing. */
		padding-block-end: var(--spacing-12);
		padding-inline: var(--spacing-6);
		display: flex;
		flex-direction: column;
		/* No `align-items`: upstream's VStack here takes no `align`, and Stack only
		   emits an alignment when one is passed — so the sections stretch. Forcing
		   `center` would shrink-wrap any section that stops declaring width:100%. */
		gap: var(--astryx-marketing-section-gap);
	}
</style>
