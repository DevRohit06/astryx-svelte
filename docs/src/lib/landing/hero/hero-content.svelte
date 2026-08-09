<script lang="ts">
	import { Button, Grid, Heading, Link, Text, Theme, VStack } from '@astryx-svelte/core';
	import { astryxTheme } from '../../themes/astryx-theme.js';
	import { componentsHref, topicHref } from '../../shell/links.js';
	import { UPSTREAM_URL } from '../../shell/nav-items.js';
	import { useHeroReelIsDark } from './hero-reel-context.svelte.js';
	import HeroReelWordmark from './hero-reel-wordmark.svelte';
	import HeroReelStack from './hero-reel-stack.svelte';
	import HeroReelDots from './hero-reel-dots.svelte';

	/**
	 * Hero text block (wordmark, headline, CTAs, dots, collage), ported from
	 * upstream's `HeroContent` in `app/(site)/page.tsx`.
	 *
	 * **It is a component rather than markup inline in the page for the reason
	 * upstream's is**, and the reason binds harder in Svelte: it calls
	 * `useHeroReelIsDark()`, which reads the context `HeroReelProvider` publishes.
	 * Svelte resolves context from ancestors at init, so a parent cannot read what
	 * its own child sets — this has to sit *inside* the provider.
	 *
	 * `element` is upstream's `contentRef`: the page measures this block to size
	 * the spacer on narrow screens.
	 *
	 * The "Built on React and StyleX" line reads "Svelte and StyleX" here, and
	 * names the upstream project it ports. That is the same substitution the rest
	 * of the site makes — this library is not built on React.
	 */
	interface Props {
		element?: HTMLElement | null;
	}

	let { element = $bindable(null) }: Props = $props();

	const isDark = useHeroReelIsDark();

	// Flag the body on dark slides so the transparent nav can go light
	// (landing.css). Upstream's useEffect + cleanup, unchanged.
	$effect(() => {
		if (isDark()) {
			document.body.setAttribute('data-hero-dark', '');
		} else {
			document.body.removeAttribute('data-hero-dark');
		}
		return () => document.body.removeAttribute('data-hero-dark');
	});
</script>

<section
	class="hero-content"
	class:hero-text-dark={isDark()}
	data-home-page="true"
	bind:this={element}
>
	<HeroReelWordmark />
	<Heading
		level={1}
		type="display-1"
		color={isDark() ? 'inherit' : 'primary'}
		class="hero-headline"
	>
		An open source design system that's <Text
			as="span"
			type="inherit"
			color="inherit"
			weight="semibold">fully customizable and agent ready</Text
		>
	</Heading>
	<VStack gap={4} align="center">
		<!--
			Renders the hero controls in the active slide's mode. Upstream always
			renders the same <Theme> element and only toggles `mode` — swapping the
			element type (Fragment ↔ Theme) would remount the subtree and drop
			keyboard focus from the dot the reader just activated.
		-->
		<Theme theme={astryxTheme} mode={isDark() ? 'dark' : 'light'}>
			<div class="hero-buttons">
				<Grid columns={2} gap={3}>
					<Button
						variant="primary"
						size="lg"
						label="Get started"
						href={topicHref('getting-started')}
					/>
					<Button variant="secondary" size="lg" label="Browse components" href={componentsHref()} />
				</Grid>
			</div>
		</Theme>
		<Text display="block" color={isDark() ? 'inherit' : 'secondary'}>
			Currently in Beta · Built on <Link
				type="body"
				color="inherit"
				href="https://svelte.dev"
				target="_blank"
				rel="noopener noreferrer"
				hasUnderline>Svelte</Link
			>
			and
			<Link
				type="body"
				color="inherit"
				href="https://stylexjs.com"
				target="_blank"
				rel="noopener noreferrer"
				hasUnderline>StyleX</Link
			>, porting
			<Link
				type="body"
				color="inherit"
				href={UPSTREAM_URL}
				target="_blank"
				rel="noopener noreferrer"
				hasUnderline>Astryx</Link
			>
		</Text>
	</VStack>
	<!--
		Narrow-screen collage. The wrapper's gap is non-themed so it stays constant
		across theme swaps. The overlap layer (HeroReelCards) takes over at
		≥1024px; this self-hides there.
	-->
	<div class="hero-collage-gap">
		<HeroReelStack />
	</div>
	<!-- The Theme flips the dot ink to the active slide's light/dark mode. -->
	<Theme theme={astryxTheme} mode={isDark() ? 'dark' : 'light'}>
		<div class="hero-dots" data-home-page="true">
			<HeroReelDots />
		</div>
	</Theme>
</section>

<style>
	/* Desktop: fixed for pin-and-cover (the page's spacer reserves its height).
	   Narrow: in flow — the mobile hero is taller than the viewport, so pinning
	   stranded the lower collage below the fold. */
	.hero-content {
		position: relative;
		/* top offset only matters when fixed; in flow it would leave a gap. */
		top: 0;
		left: 0;
		right: 0;
		/* Narrow: auto height (sizes to text + collage); a ResizeObserver applies
		   it to the spacer so the showcase starts right after the cards. */
		height: auto;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		/* Narrow anchors content to the top so the collage below has room. */
		justify-content: flex-start;
		/* Narrow: in flow under the transparent nav, so pad by nav height to clear
		   it. Desktop is fixed + centred, so none. */
		padding-block-start: calc(var(--appshell-header-height, 0px) + var(--spacing-8));
		padding-block-end: var(--spacing-12);
		max-width: var(--docs-prose-max-width);
		margin-inline: auto;
		padding-inline: var(--spacing-6);
		text-align: center;
		gap: var(--spacing-6);
		/* Decorative-position layer; never intercept clicks outside its actual
		   content (the buttons/links re-enable pointer events on themselves). */
		z-index: 0;
	}

	@media (min-width: 768px) {
		.hero-content {
			padding-block-start: calc(var(--appshell-header-height, 0px) + var(--hero-gap));
		}
	}

	@media (min-width: 1024px) {
		.hero-content {
			position: fixed;
			top: var(--appshell-header-height, 0px);
			/* Desktop: fixed band, centred (cards are a separate overlap layer). */
			height: calc(760px - var(--appshell-header-height, 0px));
			justify-content: center;
			padding-block-start: 0;
		}
	}

	/* On dark slides the hero text switches to a light ink (headline/links
	   inherit). */
	.hero-text-dark {
		color: var(--hero-on-dark);
	}

	/* Normal weight (the value-prop span is semibold); smaller on narrow screens. */
	.hero-content :global(.hero-headline) {
		font-weight: var(--font-weight-normal);
		font-size: var(--font-size-3xl);
	}

	@media (min-width: 768px) {
		.hero-content :global(.hero-headline) {
			font-size: var(--font-size-4xl);
		}
	}

	@media (min-width: 1024px) {
		.hero-content :global(.hero-headline) {
			font-size: var(--text-display-1-size);
		}
	}

	/* CTA button row, capped at a thumb-reachable width. */
	.hero-buttons {
		width: 100%;
		max-width: 420px;
		margin-inline: auto;
	}

	/* Top gap for the narrow-screen collage, set outside the reel's <Theme> so
	   --hero-gap/--spacing resolve in the docsite scale (constant across swaps). */
	.hero-collage-gap {
		margin-block-start: var(--spacing-10);
	}

	@media (min-width: 768px) {
		.hero-collage-gap {
			margin-block-start: var(--hero-gap);
		}
	}

	/* Theme-switcher dots, low in the hero. Desktop: absolute so they don't
	   disturb the band's vertical centring (margin-top:auto would shift the
	   wordmark). Narrow: in flow after the collage. */
	.hero-dots {
		padding-block-start: 0;
		position: static;
		inset-block-end: auto;
		inset-inline-start: auto;
		inset-inline-end: auto;
		display: flex;
		justify-content: center;
	}

	@media (min-width: 1024px) {
		.hero-dots {
			padding-block-start: var(--spacing-6);
			position: absolute;
			/* The fixed band's bottom sits a nav-height above the real seam, so
			   subtract it to land 32px above the features surface. */
			inset-block-end: calc(var(--spacing-8) - var(--appshell-header-height, 0px));
			inset-inline-start: 0;
			inset-inline-end: 0;
		}
	}
</style>
