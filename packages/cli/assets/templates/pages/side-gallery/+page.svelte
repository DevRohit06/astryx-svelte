<!--
	Ported from upstream's `assets/templates/pages/side-gallery/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	`StatBlock` and `ImageGrid` are local sub-components upstream; here they are
	snippets in the same file, rendered with `{@render …}`.
-->
<script lang="ts">
	import {
		AspectRatio,
		Button,
		Divider,
		Grid,
		Heading,
		HStack,
		Layout,
		LayoutContent,
		Text,
		VStack
	} from '@astryx-svelte/core';

	// Image fill is a plain inline style so it renders without any CSS compiler
	// (works in the playground preview's runtime TS compile too).
	const imageStyle = 'width: 100%; height: 100%; object-fit: cover;';

	const imageClip = 'border-radius: var(--radius-element);';

	// ─── Image Data ─────────────────────────────────────────────────────────────

	const IMAGES = [
		{
			src: 'https://lookaside.facebook.com/assets/astryx/colorful-lifestyle-vertical-3.png',
			alt: 'Colorful lifestyle scene'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/colorful-lifestyle-horizontal-1.png',
			alt: 'Colorful lifestyle horizontal'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/colorful-lifestyle-vertical-1.png',
			alt: 'Colorful lifestyle vertical'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/colorful-home-vertical-2.png',
			alt: 'Colorful home interior'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/colorful-home-vertical-3.png',
			alt: 'Colorful home scene'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/colorful-home-vertical-1.png',
			alt: 'Colorful home vertical'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/colorful-lifestyle-horizontal-2.png',
			alt: 'Colorful lifestyle wide'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/colorful-lifestyle-vertical-2.png',
			alt: 'Colorful lifestyle detail'
		},
		{
			src: 'https://lookaside.facebook.com/assets/astryx/colorful-lifestyle-vertical-4.png',
			alt: 'Colorful lifestyle portrait'
		}
	];
</script>

<!-- ─── Stat Block ───────────────────────────────────────────────────────────── -->

{#snippet statBlock(value: string, label: string)}
	<VStack gap={0}>
		<Text type="large" weight="bold">{value}</Text>
		<Text type="supporting" color="secondary">{label}</Text>
	</VStack>
{/snippet}

<!-- ─── Image Grid ───────────────────────────────────────────────────────────── -->

{#snippet imageGrid()}
	<Grid columns={3} gap={3}>
		{#each IMAGES as img (img.src)}
			<AspectRatio ratio={1} style={imageClip}>
				<img src={img.src} alt={img.alt} style={imageStyle} />
			</AspectRatio>
		{/each}
	</Grid>
{/snippet}

<!-- ─── Main Page ────────────────────────────────────────────────────────────── -->

{#snippet content()}
	<LayoutContent padding={6}>
		<Grid columns={{ minWidth: 360, repeat: 'fit' }} gap={8} align="center">
			<!-- Left side: Text + CTA -->
			<VStack gap={6} vAlign="center">
				<VStack gap={3}>
					<Text type="supporting" color="secondary" weight="semibold">COLORFUL</Text>
					<Heading level={1}>
						Make every day a little more delightful, one small detail at a time.
					</Heading>
					<Text type="body" color="secondary">
						The smallest details are the ones that matter most. A little color that catches your eye
						and makes you pause; that's what turns an ordinary day into something worth remembering.
					</Text>
				</VStack>

				<HStack gap={3} vAlign="center">
					<Button label="Explore" variant="primary" />
				</HStack>

				<VStack gap={4}>
					<Divider />
					<HStack gap={6}>
						{@render statBlock('12k+', 'Photos')}
						{@render statBlock('350+', 'Projects')}
						{@render statBlock('8yrs', 'Experience')}
					</HStack>
				</VStack>
			</VStack>

			<!-- Right side: Image Grid -->
			{@render imageGrid()}
		</Grid>
	</LayoutContent>
{/snippet}

<Layout height="fill" contentWidth={1400} {content} />
