<!--
	Ported from upstream's `assets/templates/pages/product-gallery/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Upstream imports Heroicons' `ArrowRightIcon`. The icon registry ships no
	right-pointing arrow, so this is a registry substitution to `chevronRight` —
	the same stand-in the docs examples make. Retires with the icon registry.

	`ProductCard` is a local sub-component upstream; here it is a snippet.
-->
<script lang="ts">
	import {
		AspectRatio,
		Button,
		Card,
		Grid,
		Heading,
		Icon,
		Layout,
		LayoutContent,
		Text,
		VStack
	} from '@astryx-svelte/core';

	// ─── Styles ─────────────────────────────────────────────────────────────────
	// The only custom CSS is the image fill — there is no Image primitive to
	// fill the AspectRatio box with `object-fit` (#2582).

	const image = 'width: 100%; height: 100%; object-fit: cover;';

	// ─── Product Data ───────────────────────────────────────────────────────────

	interface Product {
		id: number;
		name: string;
		description: string;
		price: number;
		image: string;
	}

	const PRODUCTS: Product[] = [
		{
			id: 1,
			name: 'Going places',
			description:
				"Sometimes all it takes is one small thing to turn your whole day around. That's what good design is for.",
			price: 75.0,
			image: 'https://lookaside.facebook.com/assets/astryx/illustrative-horizontal-1.png'
		},
		{
			id: 2,
			name: 'Meeting people',
			description:
				"Sometimes all it takes is one small thing to turn your whole day around. That's what good design is for.",
			price: 80.0,
			image: 'https://lookaside.facebook.com/assets/astryx/illustrative-vertical-1.png'
		},
		{
			id: 3,
			name: 'Seeing things',
			description:
				"Sometimes all it takes is one small thing to turn your whole day around. That's what good design is for.",
			price: 75.0,
			image: 'https://lookaside.facebook.com/assets/astryx/illustrative-horizontal-3.png'
		},
		{
			id: 4,
			name: 'Sharing ideas',
			description:
				"Sometimes all it takes is one small thing to turn your whole day around. That's what good design is for.",
			price: 75.0,
			image: 'https://lookaside.facebook.com/assets/astryx/illustrative-horizontal-4.png'
		},
		{
			id: 5,
			name: 'Making memories',
			description:
				"Sometimes all it takes is one small thing to turn your whole day around. That's what good design is for.",
			price: 60.0,
			image: 'https://lookaside.facebook.com/assets/astryx/illustrative-horizontal-5.png'
		},
		{
			id: 6,
			name: 'Being free',
			description:
				"Sometimes all it takes is one small thing to turn your whole day around. That's what good design is for.",
			price: 80.0,
			image: 'https://lookaside.facebook.com/assets/astryx/illustrative-horizontal-2.png'
		}
	];

	const fmt = (n: number) => `$${n.toFixed(2)}`;
</script>

{#snippet arrowRightIcon()}<Icon icon="chevronRight" color="inherit" />{/snippet}

<!-- ─── Product Card ─────────────────────────────────────────────────────────── -->

{#snippet productCard(product: Product)}
	<VStack gap={3}>
		<Card padding={0}>
			<AspectRatio ratio={1}>
				<img src={product.image} alt={product.name} style={image} />
			</AspectRatio>
		</Card>
		<VStack gap={1}>
			<Heading level={2}>{product.name}</Heading>
			<Text type="body" color="secondary" maxLines={2}>{product.description}</Text>
			<Text type="large" weight="bold">{fmt(product.price)}</Text>
		</VStack>
	</VStack>
{/snippet}

<!-- ─── Main Page ────────────────────────────────────────────────────────────── -->

{#snippet content()}
	<LayoutContent padding={6}>
		<VStack gap={6}>
			<!-- Header — Grid handles responsive stacking -->
			<Grid columns={{ minWidth: 280 }} gap={4} align="start">
				<Heading level={1}>
					Make every day a little more delightful, one small detail at a time.
				</Heading>
				<VStack gap={3} hAlign="start">
					<Text type="body">
						We believe the smallest details are the ones that matter most. A little color, a
						thoughtful touch, a moment that catches your eye and makes you pause; that's what turns
						an ordinary day into something worth remembering.
					</Text>
					<Button label="Get started" variant="primary" endContent={arrowRightIcon} />
				</VStack>
			</Grid>

			<!-- Product Grid — reflows 3 → 2 → 1 columns as width narrows -->
			<Grid columns={{ minWidth: 300 }} gap={6}>
				{#each PRODUCTS as product (product.id)}
					{@render productCard(product)}
				{/each}
			</Grid>
		</VStack>
	</LayoutContent>
{/snippet}

<Layout height="fill" contentWidth={1200} {content} />
