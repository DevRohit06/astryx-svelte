<!--
	Ported from upstream's `assets/templates/pages/gallery-hero/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Icons are Heroicons, upstream's own set: `@fvilers/heroicons-svelte` is that
	set built for Svelte 5, and it keeps upstream's component names and its
	`24/outline` / `20/solid` / `24/solid` entry points. The imports below are
	upstream's with the package name changed, so each glyph is the one upstream
	draws rather than a stand-in from core's 28-name `Icon` registry — that
	registry names theme-swappable UI affordances and was never meant to carry
	arbitrary artwork.

	Upstream's `CSSProperties` objects become inline `style` strings; the values
	are unchanged.
-->
<script lang="ts">
	import {
		AspectRatio,
		Button,
		Grid,
		Heading,
		HStack,
		Icon,
		Layout,
		LayoutContent,
		Text,
		VStack
	} from '@astryx-svelte/core';
	import { ArrowRightIcon } from '@fvilers/heroicons-svelte/20/solid';

	const IMAGES = [
		{
			src: 'https://lookaside.facebook.com/assets/astryx/colorful-home-horizontal-1.png',
			alt: 'Colorful home interior with vibrant decor'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/colorful-lifestyle-horizontal-1.png',
			alt: 'Colorful lifestyle portrait with natural lighting'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/colorful-lifestyle-horizontal-2.png',
			alt: 'Colorful lifestyle scene with warm tones'
		}
	];

	// NOTE: The only custom styling here is image fill + corner radius. It exists
	// because Astryx has no image primitive — AspectRatio exposes no objectFit or
	// radius props and there's no Image. Tracked in issue #2582; replace these
	// with component props once it lands.
	// Fills the AspectRatio box. No objectFit prop on AspectRatio (#2582).
	const galleryImage = 'width: 100%; height: 100%; object-fit: cover;';
	// Rounds the image corners. No radius prop on AspectRatio (#2582).
	const galleryImageClip = 'border-radius: var(--radius-container);';
</script>

{#snippet arrowRightIcon()}<Icon icon={ArrowRightIcon} size="sm" color="inherit" />{/snippet}

{#snippet content()}
	<LayoutContent padding={6}>
		<VStack gap={10}>
			<VStack gap={6} hAlign="center">
				<VStack gap={3} hAlign="center">
					<Heading level={1} type="display-2" justify="center" textWrap="balance">
						Little joys, everywhere you go
					</Heading>
					<Text type="body" color="secondary" justify="center" textWrap="balance">
						Sometimes all it takes is one small thing to turn your whole day around.
					</Text>
				</VStack>
				<HStack gap={3}>
					<Button label="Get started" variant="primary" endContent={arrowRightIcon} />
					<Button label="Learn more" variant="secondary" />
				</HStack>
			</VStack>
			<Grid columns={{ minWidth: 200, repeat: 'fit' }} gap={4}>
				{#each IMAGES as image (image.src)}
					<AspectRatio ratio={4 / 5} style={galleryImageClip}>
						<img style={galleryImage} src={image.src} alt={image.alt} />
					</AspectRatio>
				{/each}
			</Grid>
		</VStack>
	</LayoutContent>
{/snippet}

<Layout {content} />
