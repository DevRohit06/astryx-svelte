<!--
	Ported from upstream's `assets/templates/pages/mixed-gallery/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Upstream injects its grid CSS through a `<style>{GALLERY_CSS}</style>` tag in
	the markup. A Svelte component's own `<style>` block is the same thing minus
	the string, and needs no CSS compiler either — but it is scoped, and a class
	handed to a *component* never receives the scoping class. `.mixed-gallery-hero`
	lands on `AspectRatio`, so it is reached as
	`.mixed-gallery-grid :global(.mixed-gallery-hero)`: same two rules, same
	container query, and still bounded to this page's grid.

	`GalleryCard` is a local sub-component upstream; here it is a snippet.
-->
<script lang="ts">
	import { AspectRatio, Heading, Layout, LayoutContent, Text, VStack } from '@astryx-svelte/core';

	// ─── Styles ────────────────────────────────────────────────────────────────
	// The masonry needs a responsive column count AND a hero that spans 2 columns
	// on desktop but goes full-width on mobile. Grid forces grid-template-columns
	// inline, so a responsive span can't be expressed through its props — this is a
	// @container grid (the sanctioned Astryx pattern for container-responsive layout).
	// The container query lives in the plain <style> block below so it needs NO CSS
	// compiler. Image fill + radius are custom because Astryx has no image
	// primitive (#2582).

	// Named inline-size container on the page column so the grid responds to the
	// available content width (works inside the sandbox's resizable preview).
	const containerStyle = 'container-type: inline-size; container-name: gallery;';
	// Fills the AspectRatio box. No objectFit prop on AspectRatio (#2582).
	const imgStyle = 'width: 100%; height: 100%; object-fit: cover;';
	// Rounds the image corners. No radius prop on AspectRatio (#2582).
	const clipStyle = 'border-radius: var(--radius-element);';

	// ─── Gallery Data ───────────────────────────────────────────────────────────

	interface GalleryImage {
		src: string;
		title: string;
	}

	// All landscape photos so the uniform 3:2 / 3:1 tiles crop cleanly.
	const IMAGES: GalleryImage[] = [
		{
			src: 'https://lookaside.facebook.com/assets/astryx/illustrative-horizontal-1.png',
			title: 'Going places'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/light-home-horizontal-1.png',
			title: 'Making memories'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/light-lifestyle-horizontal-1.png',
			title: 'Being free'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/light-working-horizontal-2.png',
			title: 'Getting it done'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/light-scene-horizontal-1.png',
			title: 'Finding calm'
		}
	];
</script>

<!-- ─── Gallery Card ───────────────────────────────────────────────────────── -->
<!-- AspectRatio gives every cell a definite, self-contained height from its
	ratio, so images can't overflow their grid cell (no row-track guesswork). -->

{#snippet galleryCard(image: GalleryImage, ratio: number, className?: string)}
	<AspectRatio {ratio} class={className} style={clipStyle}>
		<img src={image.src} alt={image.title} style={imgStyle} />
	</AspectRatio>
{/snippet}

<!-- ─── Main Page ────────────────────────────────────────────────────────────── -->

{#snippet content()}
	<LayoutContent padding={6}>
		<VStack gap={6} style={containerStyle}>
			<!-- Header -->
			<VStack gap={2} hAlign="center">
				<Heading level={1} justify="center">
					Make every day a little more delightful, one detail at a time.
				</Heading>
				<Text type="body" justify="center">
					We believe the smallest details are the ones that matter most. That's what turns an
					ordinary day into something worth remembering.
				</Text>
			</VStack>

			<!-- Featured layout — a wide hero next to a single tile, above a row
				of three. Every tile is 3:2 except the hero, which is 3:1 so that
				(being 2 columns wide) it matches the row height exactly. All
				rows are therefore the same height. Responsive via @container:
				3 columns → 1 column at ≤720px. -->
			<div class="mixed-gallery-grid">
				<!-- Hero — spans 2 columns; 3:1 keeps it level with the sidebar -->
				{@render galleryCard(IMAGES[0], 3 / 1, 'mixed-gallery-hero')}

				<!-- Sidebar — same height as the hero -->
				{@render galleryCard(IMAGES[2], 3 / 2)}

				<!-- Bottom row — three equal tiles -->
				{@render galleryCard(IMAGES[3], 3 / 2)}
				{@render galleryCard(IMAGES[4], 3 / 2)}
				{@render galleryCard(IMAGES[1], 3 / 2)}
			</div>
		</VStack>
	</LayoutContent>
{/snippet}

<Layout height="fill" contentWidth={1400} {content} />

<style>
	/*
	 * 3 columns on desktop, dropping straight to 1 column below 720px (no 2-col
	 * middle state). minmax(0, 1fr) (not 1fr) so tracks split evenly and ignore
	 * the images' intrinsic min-width. The hero spans 2 columns on desktop, then
	 * fills the row once it's single-column.
	 */
	.mixed-gallery-grid {
		display: grid;
		gap: var(--spacing-3);
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
	.mixed-gallery-grid :global(.mixed-gallery-hero) {
		grid-column: span 2;
	}
	@container gallery (max-width: 720px) {
		.mixed-gallery-grid {
			grid-template-columns: minmax(0, 1fr);
		}
		.mixed-gallery-grid :global(.mixed-gallery-hero) {
			grid-column: 1 / -1;
		}
	}
</style>
