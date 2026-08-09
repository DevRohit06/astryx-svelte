<!--
	Ported from upstream's `assets/templates/pages/centered-hero/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Upstream imports Heroicons' `ArrowRightIcon`. The icon registry ships no
	right-pointing arrow, so this is a registry substitution to `chevronRight` —
	the same stand-in the docs examples make. Retires with the icon registry.

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

	const IMAGE_URL = 'https://lookaside.facebook.com/assets/astryx/light-scene-horizontal-1.png';

	const heroImage = 'width: 100%; height: 100%; object-fit: cover;';
	const heroFrame = 'max-width: 1200px; margin-inline: auto; border-radius: var(--radius-page);';
</script>

{#snippet arrowRightIcon()}<Icon icon="chevronRight" size="sm" color="inherit" />{/snippet}

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
