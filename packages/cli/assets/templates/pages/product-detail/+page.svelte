<!--
	Ported from upstream's `assets/templates/pages/product-detail/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Upstream imports Heroicons here, so every icon is a registry substitution:
	`MinusIcon` → `close`, `PlusIcon` → `check` (the registry ships no plus —
	TODO.md records the gap), outline `StarIcon` → `check`, solid `StarIcon` →
	`success`. None is a true match, and the 28-name registry cannot keep four
	glyphs distinct — `check` stands in twice over, so the increment button and
	an unfilled rating star draw the same glyph. Retires with the icon registry
	(TODO.md).

	Upstream's `StarRating`, `ImageGallery` and `ProductInfo` are components; a
	page template is a single `+page.svelte` (the CLI copies `PAGE_SOURCE_FILE`
	and nothing beside it), so each becomes a snippet. `ProductInfo` holds three
	`useState`s and a snippet cannot hold state, so `color`, `finish` and
	`quantity` are hoisted onto the page — there is exactly one `ProductInfo` on
	the page, so the rendering is identical.

	Upstream's three `CSSProperties` consts become `style` strings: Svelte's
	`style` prop is a string, and a scoped `<style>` block would not do — Svelte
	scopes the selector, not a class handed to a component.
-->
<script lang="ts">
	import {
		AspectRatio,
		Badge,
		Button,
		Card,
		Center,
		Collapsible,
		CollapsibleGroup,
		Divider,
		Grid,
		HStack,
		Heading,
		Icon,
		Layout,
		LayoutContent,
		NumberInput,
		SegmentedControl,
		SegmentedControlItem,
		SelectableCard,
		Text,
		VStack
	} from '@astryx-svelte/core';

	// Custom CSS here is limited to what Astryx components can't express today:
	// - image fill + corner radius (no Image primitive — #2582)
	// - the sticky info column (no sticky prop on Astryx layout primitives — #2613)
	// Keeps the info column in view while the gallery scrolls. No sticky prop on
	// Astryx layout primitives.
	const stickyInfo = 'position: sticky; top: var(--spacing-8); align-self: start;';
	// Fills the AspectRatio box + rounds corners. No objectFit/radius props on
	// AspectRatio (#2582).
	const heroImage =
		'width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-container);';
	// Fills the thumbnail card. Corner radius + selection ring come from
	// SelectableCard; the image only needs to fill and cover (#2582).
	const thumbImage = 'width: 100%; height: 100%; object-fit: cover; display: block;';

	// ─── Image URLs ─────────────────────────────────────────────────────────────
	// IMAGES[0] = fallback hero; IMAGES[1..6] = thumbnails (first is selected by default)
	const IMAGES = [
		'https://lookaside.facebook.com/assets/astryx/light-product-1.png',
		'https://lookaside.facebook.com/assets/astryx/light-product-1.png',
		'https://lookaside.facebook.com/assets/astryx/light-product-2.png',
		'https://lookaside.facebook.com/assets/astryx/light-product-3.png',
		'https://lookaside.facebook.com/assets/astryx/light-product-4.png',
		'https://lookaside.facebook.com/assets/astryx/light-product-5.png',
		'https://lookaside.facebook.com/assets/astryx/light-product-3.png'
	];

	// ─── Product Data ───────────────────────────────────────────────────────────
	const PRODUCT = {
		name: 'Solstice Mug & Plate Set',
		price: 89.0,
		originalPrice: 119.0,
		description:
			'A hand-thrown mug and plate set that brings quiet warmth to every meal. The mug sits easy in the hand with a generous 12 oz capacity, while the 8-inch plate works for everything from toast to tapas. Each piece is kiln-fired at 2,300°F for a finish that resists chips and stains. Subtle variations in the reactive glaze mean no two sets are exactly alike. Dishwasher and microwave safe.',
		composition:
			'High-fire stoneware clay, wheel-thrown and trimmed by hand. Reactive glaze applied by dipping — color pools and breaks naturally over the clay body. Lead-free and food-safe. Unglazed foot ring reveals the raw clay underneath. Each piece is bisque-fired, glazed, then fired again to cone 10 in a gas reduction kiln.',
		deliveryReturns:
			'Free shipping on all ceramics orders over $75. Each piece is individually wrapped in recycled kraft paper and cushioned for transit. Returns accepted within 30 days — items must be unused and in original packaging. Replacement pieces available individually.',
		dimensions:
			'Mug height: 9.5 cm / 3.75 in. Mug diameter: 8.5 cm / 3.35 in. Capacity: 350 ml / 12 oz. Plate diameter: 20 cm / 8 in. Plate height: 2 cm / 0.75 in. Weight: 680 g / 1.5 lb (set).'
	};

	const COLORS = [
		{ value: 'snow', label: 'Snow' },
		{ value: 'sage', label: 'Sage' },
		{ value: 'charcoal', label: 'Charcoal' }
	];

	const FINISHES = [
		{ value: 'matte', label: 'Matte' },
		{ value: 'satin', label: 'Satin' },
		{ value: 'speckled', label: 'Speckled' }
	];

	const fmt = (n: number) => `$${n.toFixed(2)}`;

	// `ProductInfo`'s three `useState`s, hoisted (see the note above).
	let color = $state('snow');
	let finish = $state('matte');
	let quantity = $state<number | null>(1);

	const decrement = () => (quantity = Math.max(1, (quantity ?? 1) - 1));
	const increment = () => (quantity = Math.min(10, (quantity ?? 1) + 1));

	// ─── Main Page ──────────────────────────────────────────────────────────────
	let selectedThumb = $state(0);
</script>

<!-- ─── Star Rating ───────────────────────────────────────────────────────── -->
{#snippet starRating(rating: number, count: number)}
	{@const filled = Math.round(rating)}
	{@const empty = 5 - filled}
	<HStack gap={1} vAlign="center">
		{#each Array.from({ length: filled }) as _, i (`full-${i}`)}
			<Icon icon="success" size="sm" />
		{/each}
		{#each Array.from({ length: empty }) as _, i (`empty-${i}`)}
			<Icon icon="check" size="sm" />
		{/each}
		<Text type="body" color="secondary">{rating} ({count})</Text>
	</HStack>
{/snippet}

<!-- ─── Image Gallery ─────────────────────────────────────────────────────── -->
{#snippet imageGallery(selected: number, onSelect: (i: number) => void)}
	{@const heroSrc = IMAGES[selected + 1] ?? IMAGES[0]}
	{@const thumbnails = IMAGES.slice(1)}
	<VStack gap={3}>
		<AspectRatio ratio={4 / 5}>
			<img style={heroImage} src={heroSrc} alt={PRODUCT.name} />
		</AspectRatio>
		<Grid columns={3} gap={2}>
			{#each thumbnails as src, i (i)}
				<AspectRatio ratio={1}>
					<SelectableCard
						label={`Product image ${i + 1}`}
						isSelected={selected === i}
						onChange={() => onSelect(i)}
						variant="transparent"
						padding={0}
						width="100%"
						height="100%"
					>
						<img style={thumbImage} {src} alt={`Product image ${i + 1}`} />
					</SelectableCard>
				</AspectRatio>
			{/each}
		</Grid>
	</VStack>
{/snippet}

<!-- ─── Product Info ──────────────────────────────────────────────────────── -->
{#snippet minusIcon()}<Icon icon="close" size="sm" />{/snippet}
{#snippet plusIcon()}<Icon icon="check" size="sm" />{/snippet}
{#snippet compositionTrigger()}<Heading level={3}>Composition</Heading>{/snippet}
{#snippet deliveryTrigger()}<Heading level={3}>Delivery &amp; Returns</Heading>{/snippet}
{#snippet dimensionsTrigger()}<Heading level={3}>Dimensions</Heading>{/snippet}

{#snippet productInfo()}
	<VStack gap={5}>
		<VStack gap={2}>
			<Text type="display-2" as="h1">{PRODUCT.name}</Text>
			{@render starRating(4.3, 128)}
			<HStack gap={2} vAlign="center">
				<Text type="large" weight="bold">{fmt(PRODUCT.price)}</Text>
				<Text type="body" color="secondary" hasStrikethrough>{fmt(PRODUCT.originalPrice)}</Text>
				<Badge variant="error" label="Sale" />
			</HStack>
		</VStack>
		<Text type="large" weight="normal">{PRODUCT.description}</Text>
		<VStack gap={2}>
			<Text type="label">Glaze</Text>
			<VStack hAlign="start">
				<SegmentedControl value={color} onChange={(value) => (color = value)} label="Glaze">
					{#each COLORS as c (c.value)}
						<SegmentedControlItem value={c.value} label={c.label} />
					{/each}
				</SegmentedControl>
			</VStack>
		</VStack>
		<VStack gap={2}>
			<Text type="label">Finish</Text>
			<VStack hAlign="start">
				<SegmentedControl value={finish} onChange={(value) => (finish = value)} label="Finish">
					{#each FINISHES as f (f.value)}
						<SegmentedControlItem value={f.value} label={f.label} />
					{/each}
				</SegmentedControl>
			</VStack>
		</VStack>
		<VStack gap={2}>
			<Text type="label">Quantity</Text>
			<HStack gap={1} vAlign="center">
				<Button
					label="Decrease quantity"
					variant="ghost"
					icon={minusIcon}
					clickAction={decrement}
					isDisabled={(quantity ?? 1) <= 1}
					isIconOnly
				/>
				<Center width={100}>
					<NumberInput
						label="Quantity"
						isLabelHidden
						value={quantity}
						onChange={(value) => (quantity = value)}
						min={1}
						max={10}
						isIntegerOnly
					/>
				</Center>
				<Button
					label="Increase quantity"
					variant="ghost"
					icon={plusIcon}
					clickAction={increment}
					isDisabled={(quantity ?? 1) >= 10}
					isIconOnly
				/>
			</HStack>
		</VStack>
		<VStack gap={2}>
			<Button label="Add to Cart" variant="primary" size="lg" />
			<Button label="Buy it now" size="lg" />
		</VStack>
		<CollapsibleGroup type="multiple" defaultValue={['composition']}>
			<Divider />
			<Collapsible value="composition" trigger={compositionTrigger}>
				<Text type="body">{PRODUCT.composition}</Text>
			</Collapsible>
			<Divider />
			<Collapsible value="delivery" defaultIsOpen={false} trigger={deliveryTrigger}>
				<Text type="body">{PRODUCT.deliveryReturns}</Text>
			</Collapsible>
			<Divider />
			<Collapsible value="dimensions" defaultIsOpen={false} trigger={dimensionsTrigger}>
				<Text type="body">{PRODUCT.dimensions}</Text>
			</Collapsible>
			<Divider />
		</CollapsibleGroup>
	</VStack>
{/snippet}

<!-- ─── Main Page ─────────────────────────────────────────────────────────── -->
{#snippet content()}
	<LayoutContent padding={6}>
		<Grid columns={{ minWidth: 320, repeat: 'fit' }} gap={5}>
			{@render imageGallery(selectedThumb, (i) => (selectedThumb = i))}
			<VStack gap={0} style={stickyInfo}>
				{@render productInfo()}
			</VStack>
		</Grid>
	</LayoutContent>
{/snippet}

<Layout height="fill" contentWidth={1200} {content} />
