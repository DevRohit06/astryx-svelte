<!--
	Ported from upstream's `assets/templates/pages/shell-top-nav/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Upstream imports Heroicons here, so every icon is a registry substitution:
	`ShoppingBagIcon` → `stop`, `ShoppingCartIcon` → `checkDouble`,
	`MagnifyingGlassIcon` → `search`, `SparklesIcon` → `wrench`, `SwatchIcon` →
	`viewColumns`, `TagIcon` → `funnel`, `HomeModernIcon` → `menu`,
	`FaceSmileIcon` → `info`, `ReceiptPercentIcon` → `copy`, `GiftIcon` →
	`calendar`, `CloudIcon` → `arrowsUpDown`, `BoltIcon` → `arrowUp`, `SunIcon` →
	`success`, `StarIcon` → `check`, `FireIcon` → `error`, `GlobeAltIcon` →
	`externalLink`, `MoonIcon` → `clock`. Only `search` is a true match; the rest
	are stand-ins, the same ones the example blocks make, and `MegaItem.icon` is
	an `IconName` rather than upstream's `IconType` because of it. Retires with
	the icon registry (TODO.md).

	Upstream's three `stylex.create` styles become `style` strings. StyleX may
	not be imported from a `.svelte` file, and a scoped `<style>` class never
	reaches a component — Svelte scopes the selector, not the string passed as a
	prop — so the declarations ride the `style` prop every Astryx component
	merges.
-->
<script lang="ts">
	import {
		AppShell,
		Badge,
		Button,
		Card,
		Grid,
		Icon,
		IconButton,
		NavIcon,
		Stack,
		TopNav,
		TopNavHeading,
		TopNavItem,
		TopNavMegaMenu,
		TopNavMegaMenuFeaturedCard,
		TopNavMegaMenuItem,
		VStack,
		type IconName
	} from '@astryx-svelte/core';

	const styles = {
		// Cap + center the page body so wide screens show whitespace gutters.
		contentMax: 'max-width: 1100px; margin-inline: auto;',
		// Lock both mega-menu panels to an identical size. Without this, Shop and
		// Brands size to their own content (different widths); since both anchor to
		// the centered nav, switching between them resizes the panel — which reads
		// as flashing/jumping. Fixed item + featured widths make the panels
		// pixel-identical so the transition is seamless.
		megaItems: 'grid-column: 1 / -1; width: 520px;',
		megaFeatured: 'width: 240px;'
	};

	type MegaItem = { name: string; tagline: string; icon: IconName };

	// Upstream declares this shape inline on `MegaFeatured`'s props. A snippet
	// parameter has nowhere to write an inline object type readably, so it is
	// named — the only addition on this page.
	type MegaFeaturedProps = {
		title: string;
		description: string;
		image: string;
		imageAlt: string;
		linkLabel: string;
		linkHref: string;
	};

	// Shop and Brands each render 8 items — the mega menu's built-in 2-column grid
	// lays them out as 2 columns × 4 rows, alongside a featured card.
	const SHOP_ITEMS: MegaItem[] = [
		{ name: 'New Arrivals', tagline: 'The latest drops', icon: 'wrench' },
		{ name: 'Womenswear', tagline: 'Dresses, knitwear & more', icon: 'viewColumns' },
		{ name: 'Menswear', tagline: 'Shirts, tailoring & more', icon: 'funnel' },
		{ name: 'Home', tagline: 'Bedding, lighting & décor', icon: 'menu' },
		{ name: 'Beauty', tagline: 'Skincare, fragrance & makeup', icon: 'info' },
		{ name: 'Accessories', tagline: 'Bags, hats & sunglasses', icon: 'stop' },
		{ name: 'Sale', tagline: 'Up to 50% off', icon: 'copy' },
		{ name: 'Gift Cards', tagline: 'The perfect present', icon: 'calendar' }
	];

	const BRAND_ITEMS: MegaItem[] = [
		{ name: 'Aether', tagline: 'Performance essentials', icon: 'wrench' },
		{ name: 'Northwind', tagline: 'Outdoor & technical', icon: 'arrowsUpDown' },
		{ name: 'Loomwell', tagline: 'Everyday knitwear', icon: 'arrowUp' },
		{ name: 'Verdant', tagline: 'Sustainable basics', icon: 'success' },
		{ name: 'Studio Mara', tagline: 'Modern tailoring', icon: 'check' },
		{ name: 'Atelier Kos', tagline: 'Limited ateliers', icon: 'error' },
		{ name: 'Rue & Co', tagline: 'City streetwear', icon: 'externalLink' },
		{ name: 'Halden', tagline: 'Minimal staples', icon: 'clock' }
	];

	const CATEGORY_TILES = [
		'New Arrivals',
		'Womenswear',
		'Menswear',
		'Home & Living',
		'Beauty',
		'Accessories'
	];
</script>

<!--
	Wraps the 8 items in a fixed-width 2-column grid so every mega menu's item
	area is exactly the same width regardless of its content.
-->
{#snippet megaItems(items: MegaItem[])}
	<Stack style={styles.megaItems}>
		<Grid columns={2} gap={2}>
			{#each items as item (item.name)}
				{#snippet itemIcon()}<Icon icon={item.icon} size="md" color="secondary" />{/snippet}
				<TopNavMegaMenuItem
					title={item.name}
					description={item.tagline}
					icon={itemIcon}
					href="#"
				/>
			{/each}
		</Grid>
	</Stack>
{/snippet}

<!-- Pins the featured card to a fixed width so both panels match exactly. -->
{#snippet megaFeatured(props: MegaFeaturedProps)}
	<Stack style={styles.megaFeatured}>
		<TopNavMegaMenuFeaturedCard {...props} />
	</Stack>
{/snippet}

<!--
	`TopNavMegaMenu.items`/`.featured` take a zero-argument `Snippet`, so each
	call site upstream writes as `<MegaItems items={…} />` becomes a wrapper
	snippet that renders the parameterised one.
-->
{#snippet shopItems()}{@render megaItems(SHOP_ITEMS)}{/snippet}
{#snippet brandItems()}{@render megaItems(BRAND_ITEMS)}{/snippet}

{#snippet autumnFeatured()}
	{@render megaFeatured({
		title: 'The Autumn Edit',
		description: 'Layering staples in warm, earthy tones.',
		image: 'https://lookaside.facebook.com/assets/astryx/texture-beige-horizontal-1.png',
		imageAlt: 'Autumn collection lookbook',
		linkLabel: 'Shop the edit',
		linkHref: '#autumn-edit'
	})}
{/snippet}

{#snippet studioMaraFeatured()}
	{@render megaFeatured({
		title: 'Meet Studio Mara',
		description: 'Modern tailoring, made to last.',
		image: 'https://lookaside.facebook.com/assets/astryx/texture-beige-horizontal-2.png',
		imageAlt: 'Studio Mara lookbook',
		linkLabel: 'Discover the label',
		linkHref: '#studio-mara'
	})}
{/snippet}

{#snippet shoppingBagIcon()}<Icon icon="stop" size="sm" />{/snippet}
{#snippet logo()}<NavIcon icon={shoppingBagIcon} />{/snippet}

{#snippet heading()}
	<TopNavHeading heading="Lumen" {logo} headingHref="#" />
{/snippet}

{#snippet centerContent()}
	<TopNavMegaMenu label="Shop" items={shopItems} featured={autumnFeatured} />
	<TopNavMegaMenu label="Brands" items={brandItems} featured={studioMaraFeatured} />
	<TopNavItem label="Sale" href="#" />
	<TopNavItem label="Service" href="#" />
{/snippet}

{#snippet magnifyingGlassIcon()}<Icon icon="search" size="sm" />{/snippet}
{#snippet shoppingCartIcon()}<Icon icon="checkDouble" size="sm" />{/snippet}
<!-- `Badge.label` is `string | Snippet` here; upstream's `label={3}` is `ReactNode`. -->
{#snippet cartCount()}<Badge label="3" />{/snippet}

{#snippet endContent()}
	<IconButton
		label="Search products"
		tooltip="Search"
		variant="ghost"
		icon={magnifyingGlassIcon}
	/>
	<Button label="Sign in" variant="ghost" />
	<Button label="Checkout" variant="primary" icon={shoppingCartIcon} endContent={cartCount} />
{/snippet}

{#snippet topNav()}
	<TopNav label="Lumen storefront navigation" {heading} {centerContent} {endContent} />
{/snippet}

<AppShell variant="surface" contentPadding={6} {topNav}>
	<VStack gap={10} style={styles.contentMax}>
		<Card variant="muted" padding={0} width="100%" height={360} />

		{#each [0, 1, 2] as section (section)}
			<VStack gap={4}>
				<Card variant="muted" padding={0} width={200} height={24} />
				<Grid columns={{ minWidth: 160, repeat: 'fit' }} gap={4}>
					{#each CATEGORY_TILES as tile (tile)}
						<VStack gap={2}>
							<Card variant="muted" padding={0} width="100%" height={120} />
							<Card variant="muted" padding={0} width="60%" height={14} />
						</VStack>
					{/each}
				</Grid>
			</VStack>
		{/each}
	</VStack>
</AppShell>
