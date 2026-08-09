<!--
	Ported from upstream's `assets/templates/pages/theme-showcase/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Icons. Upstream imports `lucide-react`, which has no Svelte build and is not
	a dependency a scaffolded template may assume, so every glyph is a name from
	core's `Icon` registry — the same substitution the `docs/` examples make for
	Heroicons. True matches: `Search` → `search`, `Mic` → `microphone`,
	`X` → `close`. Established stand-ins: `Folder` → `calendar`,
	`User` → `info`, `Lock` → `stop`. The rest are stand-ins picked here, with
	their collisions named: `Plus` → `check`; `Tag` → `funnel`;
	`MapPin` → `info` (collides with `User`); `List` → `menu`;
	`LayoutGrid` → `viewColumns`; `ShoppingBag` and `CreditCard` → `copy`;
	`Banknote` and `Wallet` → `wrench`; `Smartphone` → `stop` (collides with
	`Lock`); `Download` → `arrowDown`. Sizes map onto the `Icon` scale:
	`size={16}` → `size="sm"` (16px) and `size={20}` → `size="md"` (20px);
	`size={18}` has no step, so the two view-toggle buttons round to `md`. The
	three filter `Selector`s pass the registry *name* rather than a snippet —
	`Selector.startIcon` accepts `IconName` and renders it at `size="sm"`, which
	is upstream's 16 exactly. Retires with the icon registry.

	Four shape changes the Svelte port forces.

	1. **One component, not two.** Upstream's default export is a route page
	   that renders the named `ThemeShowcaseStore` with the neutral defaults; a
	   `+page.svelte` cannot also publish a second component, so the two are one
	   component here and the `images`/`products`/`inventory` props sit directly
	   on the page. The exported types are unchanged.
	2. **`DEFAULT_INVENTORY` moved up.** It is upstream's last declaration but a
	   default for the first, which is fine when the default is read inside a
	   function body at render time. `$props()` runs at component init, so the
	   data moves above it (with `TagSpec`/`InventoryRow`) rather than into a
	   temporal dead zone.
	3. **`TableColumn.renderCell` is a `Snippet<[T]>`** where upstream's is
	   `(row) => ReactNode`, and a template snippet does not exist yet while the
	   `<script>` runs — so `$derived.by` defers the column array to first read.
	   The same defers `ACTIVITY`, whose rows hold a `ReactNode` icon upstream
	   and a `Snippet` here. `ItemCell` takes `images` as a second prop
	   upstream; a `renderCell` snippet takes only the row, so it reads `images`
	   from scope.
	4. **`OverflowList` takes `items` + an `item` snippet**, not children — the
	   port's shape, because Svelte has no children array to measure. The three
	   filter `Selector`s therefore become a descriptor array rendered by one
	   snippet. Same three selectors, same order, same options.

	`CSSProperties` objects become `style` strings under upstream's own const
	names and key order. `CardShowcase`, `StorePreview`, `CheckoutCard`,
	`ChatCard`, `LatestActivityCard`, `SelectCell`, `ItemCell`, `TagsCell`,
	`ActionsCell` and `InventoryCard` are local sub-components upstream; here
	they are snippets.
-->
<script lang="ts" module>
	/** Categorical badge variants usable for showcase product/inventory tags. */
	export type ShowcaseBadgeVariant =
		| 'blue'
		| 'cyan'
		| 'green'
		| 'orange'
		| 'pink'
		| 'purple'
		| 'red'
		| 'teal'
		| 'yellow';

	export interface ProductSpec {
		name: string;
		description: string;
		badge: string;
		badgeVariant: ShowcaseBadgeVariant;
	}

	type TagSpec = { label: string; variant: ShowcaseBadgeVariant };

	export interface InventoryRow extends Record<string, unknown> {
		id: string;
		name: string;
		meta: string;
		available: number;
		location: string;
		tags: TagSpec[];
		imageKey?: string;
		thumbnailFallback: string;
		selected: boolean;
	}

	export interface ThemeShowcaseProps {
		/** Product card images keyed by slot (watch/headphones/backpack/…). */
		images?: Record<string, string>;
		/** The three hero product cards. Defaults to the neutral store products. */
		products?: ProductSpec[];
		/** Inventory table rows. Defaults to the neutral store inventory. */
		inventory?: InventoryRow[];
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		AspectRatio,
		Badge,
		Banner,
		Button,
		Card,
		Center,
		ChatComposer,
		ChatMessage,
		ChatMessageBubble,
		ChatMessageList,
		ChatSystemMessage,
		CheckboxInput,
		Divider,
		Grid,
		GridSpan,
		HStack,
		Heading,
		Icon,
		Item,
		Link,
		MoreMenu,
		NumberInput,
		OverflowList,
		RadioList,
		RadioListItem,
		Section,
		SelectableCard,
		Selector,
		Table,
		Text,
		TextInput,
		TopNav,
		TopNavHeading,
		TopNavItem,
		VStack,
		pixel,
		proportional,
		useAppShellMobile,
		type IconName,
		type TableColumn
	} from '@astryx-svelte/core';

	// Styles passed to Astryx components via their `style` prop. Astryx components
	// forward the DOM `style` prop, so these work with no CSS compiler — in
	// compiled builds and in the live playground preview alike.
	const styles: Record<string, string> = {
		card: `
			background-color: var(--color-background-body);
			color: var(--color-text-primary);
			min-width: 0;
			border-color: transparent;
		`,
		checkoutStack: `
			min-width: 0;
			width: 100%;
		`,
		paymentCardContent: `
			min-width: 0;
			width: 100%;
			text-align: center;
			word-break: break-word;
		`,
		inventoryCard: `
			background-color: var(--color-background-surface);
			color: var(--color-text-primary);
			overflow: hidden;
		`,
		inventoryHeader: `
			padding-block: var(--spacing-6);
			padding-inline: var(--spacing-6);
		`,
		inventoryFilterRow: `
			padding-block: var(--spacing-4);
			padding-inline: var(--spacing-6);
			width: 100%;
			overflow-x: auto;
		`,
		// Inset the table by --spacing-6 (the card is padding={0}) so its edge lines
		// up with the header/filter row in every theme's spacing scale.
		inventoryTableWrap: `
			padding-inline: var(--spacing-6);
			padding-block-end: var(--spacing-2);
		`,
		searchInput: `
			flex: 1;
			min-width: 0;
			max-width: 240px;
		`,
		activityCard: `
			background-color: var(--color-background-surface);
			color: var(--color-text-primary);
			min-width: 0;
			height: 100%;
		`,
		chatCard: `
			background-color: var(--color-background-surface);
			color: var(--color-text-primary);
			min-width: 0;
			overflow: hidden;
			display: flex;
			flex-direction: column;
		`,
		chatHeader: `
			padding-block: var(--spacing-4);
			padding-inline: var(--spacing-4);
		`,
		activityCardStack: `
			height: 100%;
		`,
		activityListFade: `
			flex: 1;
			min-height: 0;
			overflow: hidden;
			mask-image: linear-gradient(to bottom, black calc(100% - 48px), transparent);
			-webkit-mask-image: linear-gradient(to bottom, black calc(100% - 48px), transparent);
			margin-inline: calc(var(--spacing-2) * -1);
		`,
		content: `
			max-width: 960px;
			margin-inline: auto;
			min-width: 0;
		`,
		contentFluid: `
			max-width: 880px;
		`,
		heroText: `
			text-align: center;
			max-width: 560px;
		`,
		centerText: `
			text-align: center;
		`,
		cardStack: `
			height: 100%;
		`,
		cardDescription: `
			flex: 1;
		`,
		quantityInput: `
			/* minWidth (not a hard width) so the field grows to fit the digit + the
			   theme's input padding. A fixed 40px was too tight on themes with larger
			   padding / bigger type scale (e.g. Matcha, Y2K), clipping the value. */
			min-width: 64px;
			flex-shrink: 0;
		`,
		cartButton: `
			flex: 1;
		`
	};

	// Styles applied directly to plain DOM elements via the `style` prop.
	// Plain inline styles so they render with no CSS compiler. All are static
	// (no media/pseudo variants), so inline styles reproduce them exactly.
	const inlineStyles: Record<string, string> = {
		inventoryBannerWrap: `
			padding-inline: var(--spacing-6);
			padding-bottom: var(--spacing-4);
		`,
		thumbnail: `
			width: 40px;
			height: 40px;
			border-radius: var(--radius-element);
			object-fit: cover;
			display: block;
			flex-shrink: 0;
		`,
		thumbnailFallback: `
			width: 40px;
			height: 40px;
			border-radius: var(--radius-element);
			background-color: var(--color-background-muted);
			color: var(--color-text-secondary);
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: var(--font-size-sm);
			font-weight: 600;
			flex-shrink: 0;
		`,
		kpiValue: `
			font-size: 24px;
			font-weight: 700;
			line-height: 1.1;
			color: var(--color-text-primary);
			font-family: var(--font-family-heading);
			letter-spacing: -0.01em;
		`,
		chatBody: `
			flex: 1;
			min-height: 0;
			overflow: hidden;
		`,
		chatSuggestions: `
			padding-inline: var(--spacing-4);
			padding-bottom: var(--spacing-2);
		`,
		chatComposer: `
			padding-inline: var(--spacing-4);
			padding-bottom: var(--spacing-4);
		`,
		activityIcon: `
			width: 32px;
			height: 32px;
			border-radius: var(--radius-full);
			background-color: var(--color-background-muted);
			color: var(--color-text-secondary);
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		`,
		productImage: `
			width: 100%;
			height: 100%;
			object-fit: cover;
		`,
		cardBody: `
			padding: var(--spacing-4);
			flex: 1;
			display: flex;
			flex-direction: column;
		`
	};

	const PRODUCT_IMAGE_KEYS = ['watch', 'headphones', 'backpack'];

	const DEFAULT_PRODUCTS: ProductSpec[] = [
		{
			name: 'Minimalist Watch',
			description: 'Clean design meets everyday durability.',
			badge: 'New',
			badgeVariant: 'blue'
		},
		{
			name: 'Wireless Headphones',
			description: 'Immersive sound, all-day comfort.',
			badge: 'Popular',
			badgeVariant: 'green'
		},
		{
			name: 'Canvas Backpack',
			description: 'Water-resistant canvas with a quiet, modern profile.',
			badge: 'Limited',
			badgeVariant: 'yellow'
		}
	];

	// Neutral product photos, served from the shared astryx asset CDN so the
	// scaffolded template renders real imagery without needing local public assets.
	const DEFAULT_IMAGES: Record<string, string> = {
		watch: 'https://lookaside.facebook.com/assets/astryx/Neutral-Watch.png',
		headphones: 'https://lookaside.facebook.com/assets/astryx/Neutral-Headphones.png',
		backpack: 'https://lookaside.facebook.com/assets/astryx/Neutral-Backpack.png',
		wallet: 'https://lookaside.facebook.com/assets/astryx/Neutral-Wallet.png',
		tumbler: 'https://lookaside.facebook.com/assets/astryx/Neutral-Tumbler.png',
		throw_: 'https://lookaside.facebook.com/assets/astryx/Neutral-Blanket.png'
	};

	// Upstream declares this last; it is a `$props()` default here, so it moves up.
	const DEFAULT_INVENTORY: InventoryRow[] = [
		{
			id: 'a',
			name: 'Minimalist Watch',
			meta: 'Stainless steel, sapphire crystal',
			available: 42,
			location: 'Aisle 3',
			tags: [{ label: 'New', variant: 'blue' }],
			imageKey: 'watch',
			thumbnailFallback: 'M',
			selected: false
		},
		{
			id: 'b',
			name: 'Wireless Headphones',
			meta: 'ANC, 30hr battery',
			available: 128,
			location: 'Aisle 1',
			tags: [{ label: 'Popular', variant: 'green' }],
			imageKey: 'headphones',
			thumbnailFallback: 'W',
			selected: true
		},
		{
			id: 'c',
			name: 'Canvas Backpack',
			meta: 'Water-resistant, 25L',
			available: 63,
			location: 'Aisle 2',
			tags: [{ label: 'Limited', variant: 'yellow' }],
			imageKey: 'backpack',
			thumbnailFallback: 'C',
			selected: false
		},
		{
			id: 'd',
			name: 'Leather Wallet',
			meta: 'Full-grain, RFID blocking',
			available: 15,
			location: 'Aisle 4',
			tags: [{ label: 'Leather', variant: 'yellow' }],
			imageKey: 'wallet',
			thumbnailFallback: 'L',
			selected: true
		},
		{
			id: 'e',
			name: 'Travel Tumbler',
			meta: 'Vacuum insulated, 16oz',
			available: 87,
			location: 'Aisle 5',
			tags: [{ label: 'Drinkware', variant: 'green' }],
			imageKey: 'tumbler',
			thumbnailFallback: 'T',
			selected: false
		},
		{
			id: 'f',
			name: 'Linen Throw',
			meta: 'Heavyweight, oat',
			available: 24,
			location: 'Aisle 6',
			tags: [{ label: 'Home', variant: 'orange' }],
			imageKey: 'throw_',
			thumbnailFallback: 'L',
			selected: true
		}
	];

	// The route page renders the store with the neutral defaults. Consumers that
	// need per-theme content pass images/products/inventory.
	const {
		images = DEFAULT_IMAGES,
		products = DEFAULT_PRODUCTS,
		inventory = DEFAULT_INVENTORY
	}: ThemeShowcaseProps = $props();

	const appShellMobile = useAppShellMobile();
	const isMobile = $derived(appShellMobile().isMobile);

	const SUGGESTED_QUESTIONS = [
		'Reschedule delivery',
		'Update shipping address',
		'Start a return'
	];

	interface ActivityRow {
		id: string;
		icon: Snippet;
		label: string;
		detail: string;
		time: string;
		amount: number;
	}

	const ACTIVITY = $derived.by<ActivityRow[]>(() => [
		{
			id: '1',
			icon: shoppingBagIcon16,
			label: 'Order #1043',
			detail: 'Placed · 1:59 pm',
			time: '1:59 pm',
			amount: 248
		},
		{
			id: '2',
			icon: banknoteIcon16,
			label: 'Order #1041',
			detail: 'Refunded · 12:40 pm',
			time: '12:40 pm',
			amount: -89
		},
		{
			id: '3',
			icon: shoppingBagIcon16,
			label: 'Order #1040',
			detail: 'Placed · 10:30 am',
			time: '10:30 am',
			amount: 156
		},
		{
			id: '4',
			icon: shoppingBagIcon16,
			label: 'Order #1038',
			detail: 'Placed · 9:11 am',
			time: '9:11 am',
			amount: 412
		},
		{
			id: '5',
			icon: shoppingBagIcon16,
			label: 'Order #1037',
			detail: 'Placed · 8:42 am',
			time: '8:42 am',
			amount: 95
		}
	]);

	function formatAmount(amount: number): string {
		const sign = amount < 0 ? '−' : '+';
		return sign + '$' + Math.abs(amount).toLocaleString();
	}

	const LOW_STOCK_THRESHOLD = 25;

	// The three inventory filter selectors. `OverflowList` takes `items` + an
	// `item` snippet here, so upstream's three children become descriptors.
	interface FilterSpec {
		label: string;
		placeholder: string;
		startIcon: IconName;
		options: string[];
	}

	const INVENTORY_FILTERS: FilterSpec[] = [
		{
			label: 'Categories',
			placeholder: 'Categories',
			startIcon: 'calendar',
			options: ['Wearables', 'Audio', 'Bags', 'Drinkware', 'Home']
		},
		{
			label: 'Locations',
			placeholder: 'Locations',
			startIcon: 'info',
			options: ['Aisle 1', 'Aisle 2', 'Aisle 3', 'Aisle 4', 'Aisle 5', 'Aisle 6']
		},
		{
			label: 'Tags',
			placeholder: 'Tags',
			startIcon: 'funnel',
			options: ['New', 'Popular', 'Limited', 'Leather', 'Drinkware', 'Home']
		}
	];

	const inventoryColumns = $derived.by<TableColumn<InventoryRow>[]>(() => [
		{
			key: 'select',
			header: '',
			// Wide enough that the control + the theme's cell padding (up to
			// --spacing-4 = 16px/side on spacious density) fit inside the cell,
			// so the control's hover background doesn't overflow toward the
			// card's clipped (rounded) edge on larger-padding themes.
			width: pixel(64),
			renderCell: selectCell
		},
		{
			key: 'item',
			header: 'Item',
			// Lower min-width (default 120) so the table fits its container on
			// larger-spacing themes instead of overflowing the actions column.
			width: proportional(3, { minWidth: 80 }),
			renderCell: itemCell
		},
		{
			key: 'available',
			header: 'Available',
			width: pixel(100),
			renderCell: availableCell
		},
		{
			key: 'location',
			header: 'Location',
			width: pixel(100),
			renderCell: locationCell
		},
		{
			key: 'tags',
			header: 'Tags',
			width: proportional(2, { minWidth: 80 }),
			align: 'end',
			renderCell: tagsCell
		},
		{
			key: 'actions',
			header: '',
			// Match the select column: fit the sm more-menu button + cell
			// padding so its hover background stays clear of the card's
			// clipped rounded edge across themes.
			width: pixel(64),
			align: 'end',
			renderCell: actionsCell
		}
	]);
</script>

<!-- ─── Icons ─────────────────────────────────────────────────────────────────
     One snippet per upstream glyph + size. See the header comment for the map. -->

{#snippet searchIcon20()}<Icon icon="search" size="md" />{/snippet}
{#snippet userIcon20()}<Icon icon="info" size="md" />{/snippet}
{#snippet shoppingBagIcon20()}<Icon icon="copy" size="md" />{/snippet}
{#snippet creditCardIcon20()}<Icon icon="copy" size="md" />{/snippet}
{#snippet smartphoneIcon20()}<Icon icon="stop" size="md" />{/snippet}
{#snippet walletIcon20()}<Icon icon="wrench" size="md" />{/snippet}
{#snippet listIcon18()}<Icon icon="menu" size="md" />{/snippet}
{#snippet layoutGridIcon18()}<Icon icon="viewColumns" size="md" />{/snippet}
{#snippet plusIcon16()}<Icon icon="check" size="sm" />{/snippet}
{#snippet searchIcon16()}<Icon icon="search" size="sm" />{/snippet}
{#snippet tagIcon16()}<Icon icon="funnel" size="sm" />{/snippet}
{#snippet creditCardIcon16()}<Icon icon="copy" size="sm" />{/snippet}
{#snippet lockIcon16()}<Icon icon="stop" size="sm" />{/snippet}
{#snippet downloadIcon16()}<Icon icon="arrowDown" size="sm" />{/snippet}
{#snippet closeIcon16()}<Icon icon="close" size="sm" />{/snippet}
{#snippet micIcon16()}<Icon icon="microphone" size="sm" />{/snippet}
{#snippet shoppingBagIcon16()}<Icon icon="copy" size="sm" />{/snippet}
{#snippet banknoteIcon16()}<Icon icon="wrench" size="sm" />{/snippet}

<!-- ─── Store preview ─────────────────────────────────────────────────────── -->

{#snippet topNavHeading()}
	<TopNavHeading heading="Studio" />
{/snippet}

{#snippet topNavCenterContent()}
	<TopNavItem label="Shop" href="#" isSelected />
	<TopNavItem label="New In" href="#" />
	<TopNavItem label="Stories" href="#" />
	<TopNavItem label="Help" href="#" />
{/snippet}

{#snippet topNavEndContent()}
	<HStack gap={2} vAlign="center">
		<HStack gap={0.5}>
			<Button
				label="Search"
				tooltip="Search"
				variant="ghost"
				isIconOnly
				icon={searchIcon20}
				href="#"
			/>
			<Button
				label="Account"
				tooltip="Account"
				variant="ghost"
				isIconOnly
				icon={userIcon20}
				href="#"
			/>
			<Button
				label="Cart"
				tooltip="Cart"
				variant="ghost"
				isIconOnly
				icon={shoppingBagIcon20}
				href="#"
			/>
		</HStack>
		<Button label="Sign in" variant="primary" href="#" />
	</HStack>
{/snippet}

{#snippet storePreview(
	previewImages: Record<string, string>,
	previewProducts: ProductSpec[],
	previewIsMobile: boolean
)}
	<div data-theme-preview="true">
		<VStack gap={0}>
			<TopNav
				label="Theme preview navigation"
				heading={topNavHeading}
				centerContent={previewIsMobile ? undefined : topNavCenterContent}
				endContent={topNavEndContent}
			/>

			<Section padding={6} variant="transparent">
				<VStack gap={10} style="{styles.content} {styles.contentFluid}">
					<Center>
						<VStack gap={4} hAlign="center" style={styles.heroText}>
							<Text type="display-2" color="accent">
								Little joys,
								<br />
								everywhere you go
							</Text>
							<Text type="body" color="secondary">
								We believe the smallest details are the ones that matter most. Turn an ordinary
								day into something worth remembering.
							</Text>
						</VStack>
					</Center>

					<Grid columns={previewIsMobile ? 1 : { minWidth: 200, max: 3 }} gap={4}>
						{#each previewProducts as p, i (p.name)}
							<Card padding={0} height="100%">
								<VStack gap={0} style={styles.cardStack}>
									<AspectRatio ratio={1}>
										<img
											src={previewImages[PRODUCT_IMAGE_KEYS[i]]}
											alt={p.name}
											style={inlineStyles.productImage}
										/>
									</AspectRatio>
									<div style={inlineStyles.cardBody}>
										<VStack gap={2} hAlign="center" style={styles.cardStack}>
											<HStack>
												<Badge label={p.badge} variant={p.badgeVariant} />
											</HStack>
											<Heading level={2} style={styles.centerText}>{p.name}</Heading>
											<Text
												type="supporting"
												color="secondary"
												style="{styles.cardDescription} {styles.centerText}"
											>
												{p.description}
											</Text>
											<HStack gap={2} vAlign="center" hAlign="center">
												<NumberInput
													label="Quantity"
													isLabelHidden
													value={1}
													onChange={() => {}}
													min={1}
													max={99}
													size="sm"
													style={styles.quantityInput}
												/>
												<Button
													label="Add to cart"
													variant="secondary"
													size="sm"
													href="#"
													style={styles.cartButton}
												/>
											</HStack>
										</VStack>
									</div>
								</VStack>
							</Card>
						{/each}
					</Grid>
				</VStack>
			</Section>
		</VStack>
	</div>
{/snippet}

<!-- ─── Checkout ──────────────────────────────────────────────────────────── -->

{#snippet economyPrice()}<Text type="body" weight="bold">$12.00</Text>{/snippet}
{#snippet standardPrice()}<Text type="body" weight="bold">$16.00</Text>{/snippet}
{#snippet expressPrice()}<Text type="body" weight="bold">$24.00</Text>{/snippet}

{#snippet checkoutCard(checkoutIsMobile: boolean)}
	<Card padding={5} style={styles.card}>
		<VStack gap={4} style={styles.checkoutStack}>
			<Heading level={2}>Checkout</Heading>

			<VStack gap={3} style={styles.checkoutStack}>
				<TextInput
					label="Email"
					placeholder="you@studio.com"
					value=""
					onChange={() => {}}
					size="lg"
				/>

				<RadioList
					label="Shipping method"
					description="Delivery time may vary based on location and availability."
					value="economy"
					onChange={() => {}}
				>
					<RadioListItem
						value="economy"
						label="Economy Shipping"
						description="Delivered in 5–7 business days"
						endContent={economyPrice}
					/>
					<RadioListItem
						value="standard"
						label="Standard Shipping"
						description="Delivered in 3–5 business days"
						endContent={standardPrice}
					/>
					<RadioListItem
						value="express"
						label="Express Shipping"
						description="Delivered in 1–2 business days"
						endContent={expressPrice}
					/>
				</RadioList>

				<VStack gap={2} style={styles.checkoutStack}>
					<Text type="supporting" weight="bold">Payment method</Text>
					<Grid columns={checkoutIsMobile ? 1 : { minWidth: 70, max: 3 }} gap={2}>
						<SelectableCard
							label="Pay with card"
							isSelected={true}
							onChange={() => {}}
							padding={3}
						>
							<VStack gap={1} hAlign="center" style={styles.paymentCardContent}>
								{@render creditCardIcon20()}
								<Text type="supporting" weight="bold">Card</Text>
							</VStack>
						</SelectableCard>
						<SelectableCard
							label="Pay with Apple Pay"
							isSelected={false}
							onChange={() => {}}
							padding={3}
						>
							<VStack gap={1} hAlign="center" style={styles.paymentCardContent}>
								{@render smartphoneIcon20()}
								<Text type="supporting" weight="bold">Apple Pay</Text>
							</VStack>
						</SelectableCard>
						<SelectableCard
							label="Pay with Google Pay"
							isSelected={false}
							onChange={() => {}}
							padding={3}
						>
							<VStack gap={1} hAlign="center" style={styles.paymentCardContent}>
								{@render walletIcon20()}
								<Text type="supporting" weight="bold">Google Pay</Text>
							</VStack>
						</SelectableCard>
					</Grid>
				</VStack>

				<TextInput
					label="Card number"
					placeholder="1234 1234 1234 1234"
					value=""
					onChange={() => {}}
					startIcon={creditCardIcon16}
					size="lg"
				/>

				<Grid columns={checkoutIsMobile ? 1 : { minWidth: 90, max: 2 }} gap={2}>
					<TextInput
						label="Expiry"
						placeholder="MM / YY"
						value=""
						onChange={() => {}}
						size="lg"
					/>
					<TextInput label="CVC" placeholder="123" value="" onChange={() => {}} size="lg" />
				</Grid>

				<Selector
					label="Country"
					value="us"
					onChange={() => {}}
					size="lg"
					options={[
						{ value: 'us', label: 'United States' },
						{ value: 'ca', label: 'Canada' },
						{ value: 'uk', label: 'United Kingdom' },
						{ value: 'de', label: 'Germany' },
						{ value: 'jp', label: 'Japan' },
						{ value: 'au', label: 'Australia' }
					]}
				/>
			</VStack>

			<CheckboxInput
				label="Securely save my information for 1-click checkout"
				description="Pay faster on Studio and everywhere Link is accepted."
				value={true}
				onChange={() => {}}
			/>

			<Button variant="primary" size="lg" label="Pay now" icon={lockIcon16} />
		</VStack>
	</Card>
{/snippet}

<!-- ─── Chat ──────────────────────────────────────────────────────────────── -->

{#snippet itemsPrice()}<Text type="body" weight="bold">$248</Text>{/snippet}
{#snippet shippingPrice()}<Text type="body" weight="bold">$12</Text>{/snippet}
{#snippet onTimeBadge()}<Badge variant="green" label="On time" />{/snippet}
{#snippet trackLink()}<Link href="#">Track →</Link>{/snippet}

{#snippet chatFooterActions()}
	<Button
		variant="ghost"
		size="md"
		isIconOnly
		label="Attach"
		tooltip="Attach"
		icon={plusIcon16}
	/>
{/snippet}

{#snippet chatSendActions()}
	<Button
		variant="ghost"
		size="md"
		isIconOnly
		label="Voice input"
		tooltip="Voice input"
		icon={micIcon16}
	/>
{/snippet}

{#snippet chatCard()}
	<Card padding={0} style={styles.chatCard}>
		<HStack hAlign="between" vAlign="center" gap={3} style={styles.chatHeader}>
			<Heading level={2}>Studio AI</Heading>

			<HStack gap={1} vAlign="center">
				<Button
					variant="ghost"
					size="sm"
					isIconOnly
					label="Export conversation"
					tooltip="Export conversation"
					icon={downloadIcon16}
				/>
				<Button
					variant="ghost"
					size="sm"
					isIconOnly
					label="Close chat"
					tooltip="Close chat"
					icon={closeIcon16}
				/>
			</HStack>
		</HStack>

		<Divider variant="subtle" />

		<div style={inlineStyles.chatBody}>
			<ChatMessageList>
				<ChatSystemMessage>Today</ChatSystemMessage>

				<ChatMessage sender="user">
					<ChatMessageBubble variant="filled">Where’s my order?</ChatMessageBubble>
				</ChatMessage>

				<ChatMessage sender="assistant">
					<VStack gap={3}>
						<Text type="body">
							Your order #1043 — the Minimalist Watch and Linen Throw — shipped this morning
							from the Aisle 3 warehouse and is currently in transit with UPS. It’s on track
							to arrive at your address by end of day tomorrow.
						</Text>
						<Text type="body">
							Let me know if you’d like to reschedule the delivery, redirect it to a pickup
							point, or start a return once it arrives.
						</Text>
					</VStack>
				</ChatMessage>

				<ChatMessage sender="user">
					<ChatMessageBubble variant="filled">
						Can you show me the full details?
					</ChatMessageBubble>
				</ChatMessage>

				<ChatMessage sender="assistant">
					<VStack gap={3}>
						<Text type="body">Here’s everything I have on order #1043:</Text>
						<Card padding={3}>
							<VStack gap={1}>
								<Item
									label="Items"
									description="Minimalist Watch · Linen Throw"
									endContent={itemsPrice}
								/>
								<Item
									label="Shipping"
									description="UPS Ground"
									endContent={shippingPrice}
								/>
								<Item
									label="Estimated arrival"
									description="Tomorrow by 8pm"
									endContent={onTimeBadge}
								/>
								<Item
									label="Tracking"
									description="UPS 1Z 999 AA1 0123 4567 84"
									endContent={trackLink}
								/>
							</VStack>
						</Card>
					</VStack>
				</ChatMessage>
			</ChatMessageList>
		</div>

		<div style={inlineStyles.chatSuggestions}>
			<HStack gap={1} hAlign="center" wrap="wrap">
				{#each SUGGESTED_QUESTIONS as question (question)}
					<Button variant="secondary" size="sm" label={question} />
				{/each}
			</HStack>
		</div>

		<div style={inlineStyles.chatComposer}>
			<ChatComposer
				value=""
				onChange={() => {}}
				onSubmit={() => {}}
				placeholder="Ask Studio AI…"
				footerActions={chatFooterActions}
				sendActions={chatSendActions}
			/>
		</div>
	</Card>
{/snippet}

<!-- ─── Latest activity ───────────────────────────────────────────────────── -->

{#snippet latestActivityCard(activityIsMobile: boolean)}
	<Card padding={5} style={styles.activityCard}>
		<VStack gap={4} style={styles.activityCardStack}>
			<Heading level={2}>Revenue</Heading>

			<Grid columns={activityIsMobile ? 1 : 2} gap={3}>
				<VStack gap={0}>
					<span style={inlineStyles.kpiValue}>18K</span>
					<Text type="supporting" color="secondary">Monthly revenue</Text>
				</VStack>
				<VStack gap={0}>
					<span style={inlineStyles.kpiValue}>+12%</span>
					<Text type="supporting" color="secondary">Order growth</Text>
				</VStack>
			</Grid>

			<Divider variant="subtle" />

			<HStack hAlign="between" vAlign="center">
				<Heading level={3}>Activity</Heading>
				<Link href="#">See all</Link>
			</HStack>

			<VStack gap={1} style={styles.activityListFade}>
				{#each ACTIVITY as item (item.id)}
					{#snippet activityStart()}
						<div style={inlineStyles.activityIcon} aria-hidden="true">
							{@render item.icon()}
						</div>
					{/snippet}
					{#snippet activityEnd()}
						<Text type="body" weight="bold" color={item.amount < 0 ? 'secondary' : 'primary'}>
							{formatAmount(item.amount)}
						</Text>
					{/snippet}
					<Item
						startContent={activityStart}
						label={item.label}
						description={item.detail}
						endContent={activityEnd}
						href="#"
					/>
				{/each}
			</VStack>
		</VStack>
	</Card>
{/snippet}

<!-- ─── Inventory ─────────────────────────────────────────────────────────── -->

{#snippet selectCell(row: InventoryRow)}
	<CheckboxInput
		label={'Select ' + row.name}
		isLabelHidden
		value={row.selected}
		onChange={() => {}}
	/>
{/snippet}

{#snippet itemCell(row: InventoryRow)}
	{@const thumbnailSrc = row.imageKey ? images[row.imageKey] : undefined}
	<HStack gap={3} vAlign="center">
		{#if thumbnailSrc}
			<img src={thumbnailSrc} alt="" style={inlineStyles.thumbnail} />
		{:else}
			<div style={inlineStyles.thumbnailFallback} aria-hidden="true">
				{row.thumbnailFallback}
			</div>
		{/if}
		<VStack gap={0} style="min-width: 0;">
			<Text type="body" weight="bold">{row.name}</Text>
			<Text type="supporting" color="secondary">{row.meta}</Text>
		</VStack>
	</HStack>
{/snippet}

{#snippet availableCell(row: InventoryRow)}
	<Text type="body">{row.available}</Text>
{/snippet}

{#snippet locationCell(row: InventoryRow)}
	<Text type="body">{row.location}</Text>
{/snippet}

{#snippet tagsCell(row: InventoryRow)}
	<HStack gap={1} wrap="wrap" hAlign="end">
		{#each row.tags as tag (tag.label)}
			<Badge label={tag.label} variant={tag.variant} />
		{/each}
	</HStack>
{/snippet}

{#snippet actionsCell()}
	<MoreMenu
		label="Row actions"
		size="sm"
		items={[
			{ label: 'Edit' },
			{ label: 'Duplicate' },
			{ label: 'Move to…' },
			{ type: 'divider' },
			{ label: 'Delete' }
		]}
	/>
{/snippet}

{#snippet filtersOverflowRenderer()}
	<Button label="Filters" variant="ghost" size="sm" icon={tagIcon16} />
{/snippet}

{#snippet filterSelector(filter: FilterSpec)}
	<Selector
		label={filter.label}
		isLabelHidden
		placeholder={filter.placeholder}
		size="sm"
		startIcon={filter.startIcon}
		value={undefined}
		onChange={() => {}}
		options={filter.options}
	/>
{/snippet}

{#snippet inventoryCard(
	cardImages: Record<string, string>,
	cardInventory: InventoryRow[]
)}
	{@const lowStockCount = cardInventory.filter((row) => row.available < LOW_STOCK_THRESHOLD)
		.length}
	<Card padding={0} style={styles.inventoryCard}>
		<HStack hAlign="between" vAlign="center" style={styles.inventoryHeader}>
			<Heading level={2}>Inventory</Heading>
			<Button label="Add item" variant="primary" size="sm" icon={plusIcon16} />
		</HStack>

		<Divider variant="subtle" />

		<HStack gap={3} vAlign="center" hAlign="between" style={styles.inventoryFilterRow}>
			<HStack gap={2} vAlign="center" style="flex: 1; min-width: 0;">
				<TextInput
					label="Search inventory"
					isLabelHidden
					placeholder="Type and hit enter…"
					value=""
					onChange={() => {}}
					startIcon={searchIcon16}
					style={styles.searchInput}
				/>
				<OverflowList
					gap={2}
					items={INVENTORY_FILTERS}
					item={filterSelector}
					overflowRenderer={filtersOverflowRenderer}
				/>
			</HStack>
			<HStack gap={1} vAlign="center">
				<Button
					variant="ghost"
					size="sm"
					isIconOnly
					label="List view"
					tooltip="List view"
					icon={listIcon18}
				/>
				<Button
					variant="ghost"
					size="sm"
					isIconOnly
					label="Grid view"
					tooltip="Grid view"
					icon={layoutGridIcon18}
				/>
			</HStack>
		</HStack>

		{#if lowStockCount > 0}
			<div style={inlineStyles.inventoryBannerWrap}>
				<Banner status="warning" title={lowStockCount + ' items are running low'} />
			</div>
		{/if}

		<div style={styles.inventoryTableWrap}>
			<Table
				data={cardInventory}
				columns={inventoryColumns}
				density="spacious"
				dividers="rows"
				hasHover
			/>
		</div>
	</Card>
{/snippet}

<!-- ─── Card showcase ─────────────────────────────────────────────────────── -->

{#snippet cardShowcase(
	showcaseImages: Record<string, string>,
	showcaseInventory: InventoryRow[],
	showcaseIsMobile: boolean
)}
	{@const columns = showcaseIsMobile ? 1 : ({ minWidth: 200, repeat: 'fit' } as const)}
	<VStack gap={8}>
		<Grid {columns} gap={4}>
			<GridSpan columns={1}>
				{@render checkoutCard(showcaseIsMobile)}
			</GridSpan>
			<GridSpan columns={showcaseIsMobile ? 1 : 2}>
				{@render chatCard()}
			</GridSpan>
		</Grid>
		<Grid {columns} gap={4}>
			<GridSpan columns={showcaseIsMobile ? 1 : 3}>
				{@render inventoryCard(showcaseImages, showcaseInventory)}
			</GridSpan>
			<GridSpan columns={1}>
				{@render latestActivityCard(showcaseIsMobile)}
			</GridSpan>
		</Grid>
	</VStack>
{/snippet}

<!-- ─── Main page ─────────────────────────────────────────────────────────── -->

<div style="min-height: 100%; background-color: var(--color-background-body);">
	{@render storePreview(images, products, isMobile)}
	<div style="padding: var(--spacing-6); background-color: var(--color-background-surface);">
		{@render cardShowcase(images, inventory, isMobile)}
	</div>
</div>
