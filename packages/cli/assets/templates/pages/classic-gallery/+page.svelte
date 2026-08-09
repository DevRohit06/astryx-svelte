<!--
	Ported from upstream's `assets/templates/pages/classic-gallery/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	`useState<Category>('all')` becomes `$state`, and upstream's inline
	`filteredImages` expression becomes `$derived`. `TabList` keeps its React
	prop name here — it is `onChange`, not a DOM event.
-->
<script lang="ts">
	import {
		Center,
		Grid,
		Heading,
		Layout,
		LayoutContent,
		Section,
		Tab,
		TabList,
		Text,
		VStack
	} from '@astryx-svelte/core';

	// ─── Styles ─────────────────────────────────────────────────────────────────

	const outer =
		'max-width: 1200px; width: 100%; padding-inline: var(--spacing-6); padding-block: var(--spacing-8);';
	const imageWrapper =
		'position: relative; aspect-ratio: 3/2; border-radius: var(--radius-container); overflow: clip;';
	const textCenter = 'text-align: center;';
	const imgFill = 'position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;';

	// ─── Gallery Data ───────────────────────────────────────────────────────────

	type Category = 'all' | 'lifestyle' | 'scene' | 'home';

	interface GalleryImage {
		src: string;
		alt: string;
		category: Category;
	}

	const GALLERY_IMAGES: GalleryImage[] = [
		{
			src: 'https://lookaside.facebook.com/assets/astryx/moody-scene-horizontal-1.png',
			alt: 'Moody scene landscape',
			category: 'scene'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/moody-lifestyle-vertical-1.png',
			alt: 'Moody lifestyle portrait',
			category: 'lifestyle'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/moody-home-vertical-1.png',
			alt: 'Moody home interior',
			category: 'home'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/moody-scene-horizontal-2.png',
			alt: 'Moody scene vista',
			category: 'scene'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/moody-lifestyle-vertical-2.png',
			alt: 'Moody lifestyle scene',
			category: 'lifestyle'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/moody-lifestyle-horizontal-1.png',
			alt: 'Moody lifestyle horizontal',
			category: 'lifestyle'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/moody-scene-vertical-1.png',
			alt: 'Moody scene vertical',
			category: 'scene'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/moody-home-vertical-2.png',
			alt: 'Moody home vertical',
			category: 'home'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/moody-home-horizontal-1.png',
			alt: 'Moody home horizontal',
			category: 'home'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/moody-scene-vertical-2.png',
			alt: 'Moody scene vertical',
			category: 'scene'
		}
	];

	// ─── Main Page ──────────────────────────────────────────────────────────────

	let filter = $state<Category>('all');

	const filteredImages = $derived(
		filter === 'all' ? GALLERY_IMAGES : GALLERY_IMAGES.filter((img) => img.category === filter)
	);
</script>

{#snippet content()}
	<LayoutContent padding={0}>
		<Center axis="horizontal">
			<VStack gap={8} style={outer}>
				<!-- Header -->
				<Center axis="horizontal">
					<Section variant="transparent" maxWidth={680} padding={0}>
						<VStack gap={4} hAlign="center" style={textCenter}>
							<VStack gap={2} hAlign="center">
								<Heading level={1}>
									Make every day a little more delightful, one detail at a time.
								</Heading>
								<Text type="body" color="secondary">
									We believe the smallest details are the ones that matter most. A little color, a
									thoughtful touch, a moment that catches your eye and makes you pause; that's what
									turns an ordinary day into something worth remembering.
								</Text>
							</VStack>

							<TabList value={filter} onChange={(v) => (filter = v as Category)}>
								<Tab value="all" label="All" />
								<Tab value="lifestyle" label="Lifestyle" />
								<Tab value="scene" label="Scenery" />
								<Tab value="home" label="Home" />
							</TabList>
						</VStack>
					</Section>
				</Center>

				<!-- Gallery Grid -->
				<Grid columns={{ minWidth: 260, repeat: 'fit' }} gap={4}>
					{#each filteredImages as image, i (i)}
						<div style={imageWrapper}>
							<img src={image.src} alt={image.alt} style={imgFill} />
						</div>
					{/each}
				</Grid>
			</VStack>
		</Center>
	</LayoutContent>
{/snippet}

<Layout height="fill" {content} />
