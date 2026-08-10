<!--
	Ported from upstream's `assets/templates/pages/centered-hero/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Icons are Heroicons, upstream's own set: `@fvilers/heroicons-svelte` is that
	set built for Svelte 5, and it keeps upstream's component names and its
	`24/outline` / `20/solid` / `24/solid` entry points. The imports below are
	upstream's with the package name changed, so each glyph is the one upstream
	draws rather than a stand-in from core's 28-name `Icon` registry — that
	registry names theme-swappable UI affordances and was never meant to carry
	arbitrary artwork.

	Upstream's two `CSSProperties` objects become inline `style` strings; the
	values are unchanged, and `maxWidth: 1200` picks up React's implicit `px`.
-->
<script lang="ts">
	import {
		AspectRatio,
		Button,
		Heading,
		HStack,
		Icon,
		Layout,
		LayoutContent,
		Section,
		Text,
		VStack
	} from '@astryx-svelte/core';
	import { ArrowRightIcon } from '@fvilers/heroicons-svelte/20/solid';

	const IMAGE_URL = 'https://lookaside.facebook.com/assets/astryx/light-scene-horizontal-1.png';

	const heroImage = 'width: 100%; height: 100%; object-fit: cover;';
	const heroFrame = 'max-width: 1200px; margin-inline: auto; border-radius: var(--radius-page);';
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
			<Section variant="transparent" padding={0}>
				<AspectRatio ratio={16 / 9} style={heroFrame}>
					<img style={heroImage} src={IMAGE_URL} alt="A bright, colorful lifestyle scene" />
				</AspectRatio>
			</Section>
		</VStack>
	</LayoutContent>
{/snippet}

<Layout {content} />
