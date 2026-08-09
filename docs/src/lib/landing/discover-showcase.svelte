<script lang="ts">
	import { Button, Card, Grid, Heading, Text } from '@astryx-svelte/core';
	import componentRegistry from '$lib/generated/component-registry.js';
	import AstryxWordmark from '../shell/astryx-wordmark.svelte';
	import { componentsHref, topicHref } from '../shell/links.js';

	/**
	 * The closing CTA section, ported from upstream's `_landing/DiscoverShowcase.tsx`.
	 *
	 * Four decorative screenshots animate from a clumped pose to a spread one when
	 * the stage scrolls into view, framing a centred card. Both CTAs point at
	 * routes that exist, so this section needed no repointing.
	 *
	 * **A note on the translation, because it is the thing that goes wrong.**
	 * Upstream hangs `xstyle` on the `VStack`/`Card` itself, so the sizing and the
	 * flex alignment share one box. Svelte's style scoping cannot reach a child
	 * component's root element, so wrapping a Stack in a styled `div` is the
	 * tempting move — and it is wrong: `align-items` stays on the Stack while the
	 * width/padding moves out one level, and the layout drifts. Where upstream
	 * styles a Stack, this file uses a plain element and declares the flex the
	 * Stack would have applied. `Card` still gets its styles by `class`, reached
	 * through a `:global()` nested under a local ancestor.
	 */

	// Public component count, rounded down to the nearest 10 for marketing copy.
	// Sourced from the generated registry so it stays accurate as the library grows.
	const CORE_COMPONENT_COUNT_ROUNDED =
		Math.floor(componentRegistry.filter((entry) => !entry.isHook).length / 10) * 10;

	let stage = $state<HTMLDivElement | null>(null);
	let spread = $state(false);

	$effect(() => {
		const element = stage;
		if (!element) return;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						spread = true;
						observer.disconnect();
						break;
					}
				}
			},
			{ threshold: 0.4 }
		);
		observer.observe(element);
		return () => observer.disconnect();
	});
</script>

<section class="discover-section">
	<!--
		Raw <div>: a position:relative anchor for the absolutely-positioned images.
		VStack/HStack would impose flex semantics that fight the absolute
		positioning model.
	-->
	<div class="stage" bind:this={stage}>
		<!--
			Raw <img>s: core has no general-purpose image component. aria-hidden +
			empty alt keep this pure decoration out of the a11y tree; it animates from
			a clumped to a spread pose on scroll into view.
		-->
		<img
			src="/discover-card-1.png"
			alt=""
			aria-hidden="true"
			class="floating-image {spread ? 'top-left-end' : 'top-left-start'}"
		/>
		<img
			src="/discover-card-3.png"
			alt=""
			aria-hidden="true"
			class="floating-image {spread ? 'top-right-end' : 'top-right-start'}"
		/>
		<img
			src="/discover-card-2.png"
			alt=""
			aria-hidden="true"
			class="floating-image {spread ? 'bottom-left-end' : 'bottom-left-start'}"
		/>
		<img
			src="/discover-card-4.png"
			alt=""
			aria-hidden="true"
			class="floating-image {spread ? 'bottom-right-end' : 'bottom-right-start'}"
		/>
		<!--
			The Card owns the padding (upstream's `styles.card`); the column inside is
			only a 560px reading measure (`styles.cardContent`). Folding the two into
			one box leaves the card unpadded and caps the whole card at 560px, instead
			of centring a 560px column inside a full-width padded card.
		-->
		<Card variant="muted" padding={0} class="discover-card">
			<div class="card-content">
				<div class="card-copy">
					<Heading level={2} type="display-1" color="primary">
						Discover the full
						<AstryxWordmark class="inline-wordmark" />
						design system
					</Heading>
					<div class="supporting-text">
						<Text type="body" color="secondary">
							Browse {CORE_COMPONENT_COUNT_ROUNDED}+ components, explore production-ready templates,
							and tune themes to match your brand; pick a starting point and go.
						</Text>
					</div>
				</div>
				<div class="button-grid">
					<Grid columns={{ minWidth: 160, repeat: 'fit' }} gap={3}>
						<Button
							variant="primary"
							size="lg"
							label="Get started"
							href={topicHref('getting-started')}
						/>
						<Button
							variant="secondary"
							size="lg"
							label="Browse components"
							href={componentsHref()}
						/>
					</Grid>
				</div>
			</div>
		</Card>
	</div>
</section>

<style>
	/* Upstream's `VStack as="section" gap={10} align="center"` + styles.section. */
	.discover-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-10);
		width: 100%;
		overflow-x: clip;
	}

	/* Positioning anchor for the floating images + centred CTA card, capped so all
	   the home showcases line up vertically inside the showcase overlay. */
	.stage {
		position: relative;
		width: 100%;
		max-width: var(--docs-content-max-width);
		overflow: hidden;
		border-radius: var(--radius-container);
		isolation: isolate;
	}

	/* Upstream's styles.card — including the padding, which is the card's, not the
	   content column's. calc() over spacing tokens (not literals) so it scales
	   with any future spacing-scale override. Tightened on narrow screens where
	   the doubled inline padding crushed content into a thin column. */
	.stage :global(.discover-card) {
		position: relative;
		width: 100%;
		z-index: 1;
		margin-inline: auto;
		max-width: calc(100% - var(--spacing-8));
		/* Retint the muted surface to the body colour so this card blends in.
		   Scoped here only — a theme-wide override would recolour code blocks,
		   table rows, sliders, etc. that rely on the default muted tint. */
		--color-background-muted: var(--color-background-body);
		padding-block: var(--spacing-10);
		padding-inline: var(--spacing-6);
	}

	@media (min-width: 768px) {
		.stage :global(.discover-card) {
			padding-block: calc(var(--spacing-12) * 2);
			padding-inline: calc(var(--spacing-10) * 2);
		}
	}

	@media (min-width: 960px) {
		.stage :global(.discover-card) {
			max-width: 100%;
		}
	}

	/* Upstream's `VStack gap={6} align="center"` + styles.cardContent. maxWidth is
	   a reading measure for the body paragraph, not a spacing token. */
	.card-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-6);
		max-width: 560px;
		text-align: center;
		margin-inline: auto;
	}

	/* Upstream's inner `VStack gap={6} align="center"`. */
	.card-copy {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-6);
	}

	/* width:260 is the desktop art-directed thumbnail size; mobile uses viewport
	   clamps so the stack stays inside the rounded stage instead of overflowing. */
	.floating-image {
		position: absolute;
		width: clamp(132px, 43vw, 188px);
		height: auto;
		border-radius: var(--radius-container);
		box-shadow: var(--shadow-high);
		pointer-events: none;
		transition-property: transform, top, left, right, bottom;
		transition-duration: var(--duration-slow-max);
		transition-timing-function: var(--ease-standard);
		z-index: 2;
		/* Desktop-only decoration: below 960px there's no room to spread the images
		   to the corners, so they'd overlap and cover the card's text. */
		display: none;
	}

	@media (min-width: 768px) {
		.floating-image {
			width: clamp(176px, 28vw, 236px);
		}
	}

	@media (min-width: 960px) {
		.floating-image {
			width: 260px;
			display: block;
		}
	}

	/* Starting "clumped" pose — images near centre with slight offsets/rotations
	   so they read as an overlapping cluster before the spread animation.
	   Offsets/rotations are literals: composition values tied to image dimensions. */
	.top-left-start {
		top: 50%;
		left: 50%;
		transform: translate(calc(-50% - 80px), calc(-50% - 24px)) rotate(-8deg);
	}

	.top-right-start {
		top: 50%;
		left: 50%;
		transform: translate(calc(-50% + 80px), calc(-50% - 32px)) rotate(6deg);
	}

	.bottom-left-start {
		top: 50%;
		left: 50%;
		transform: translate(calc(-50% - 60px), calc(-50% + 40px)) rotate(7deg);
	}

	.bottom-right-start {
		top: 50%;
		left: 50%;
		transform: translate(calc(-50% + 60px), calc(-50% + 32px)) rotate(-5deg);
	}

	/* Resting "spread" poses — each image hugs a corner. Negative insets
	   (-64 / -32) are intentional bleed past the stage edge so the images read as
	   "popping out of" the card. Literals: negative spacing tokens don't exist. */
	.top-left-end {
		top: var(--spacing-3);
		left: calc(-1 * var(--spacing-8));
		transform: rotate(-8deg);
	}

	.top-right-end {
		top: var(--spacing-3);
		right: calc(-1 * var(--spacing-8));
		transform: rotate(8deg);
	}

	.bottom-left-end {
		bottom: var(--spacing-3);
		left: calc(-1 * var(--spacing-10));
		transform: rotate(6deg);
	}

	.bottom-right-end {
		bottom: var(--spacing-3);
		right: calc(-1 * var(--spacing-10));
		transform: rotate(-6deg);
	}

	@media (min-width: 960px) {
		.top-left-end {
			top: -64px;
			left: -64px;
			transform: rotate(-7deg);
		}

		.top-right-end {
			top: -64px;
			right: -64px;
			transform: rotate(7deg);
		}

		.bottom-left-end {
			bottom: -64px;
			left: -32px;
		}

		.bottom-right-end {
			bottom: -64px;
			right: -32px;
		}
	}

	/* Inline wordmark glyph in the heading. Sized in `em` so it scales with the
	   heading font size; margin anchors to glyph metrics so it reads as one word. */
	.card-copy :global(.inline-wordmark) {
		display: inline-block;
		vertical-align: baseline;
		height: 0.75em;
		width: auto;
		margin-inline: var(--spacing-4);
		color: var(--color-brand);
	}

	/* Reading-measure cap for the supporting paragraph, not a spacing token. */
	.supporting-text {
		max-width: 480px;
	}

	/* Two-up button row. max-width is a thumb-reachable ergonomic value; the
	   auto-fit 160px tracks let narrow phones collapse to one centred column. */
	.button-grid {
		width: 100%;
		max-width: 360px;
		margin-inline: auto;
	}
</style>
