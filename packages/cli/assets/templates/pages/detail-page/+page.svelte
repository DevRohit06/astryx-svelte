<!--
	Ported from upstream's `assets/templates/pages/detail-page/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Icons are Heroicons, upstream's own set: `@fvilers/heroicons-svelte` is that
	set built for Svelte 5, and it keeps upstream's component names and its
	`24/outline` / `20/solid` / `24/solid` entry points. The imports below are
	upstream's with the package name changed, so each glyph is the one upstream
	draws rather than a stand-in from core's 28-name `Icon` registry — that
	registry names theme-swappable UI affordances and was never meant to carry
	arbitrary artwork.

	Upstream's `Bullet`, `PageHeader`, `ItemsCard`, `InvoiceCard`,
	`TimelineSection`, `PanelContent` and `RightPanel` are components; a page
	template is a single `+page.svelte` (the CLI copies `PAGE_SOURCE_FILE` and
	nothing beside it), so each becomes a snippet. None holds state, and
	`PageHeader`'s five props are all read straight off the one page component's
	state, so it closes over that state rather than taking parameters — there is
	exactly one header on the page, so the rendering is identical.

	Upstream's two `CSSProperties` consts become `style` strings: Svelte's
	`style` prop is a string, and a scoped `<style>` block would not do — Svelte
	scopes the selector, not a class handed to a component.
-->
<script lang="ts">
	import {
		Avatar,
		Badge,
		Button,
		Card,
		Collapsible,
		Dialog,
		DialogHeader,
		Divider,
		HStack,
		Heading,
		Icon,
		Layout,
		LayoutContent,
		LayoutHeader,
		LayoutPanel,
		Link,
		List,
		ListItem,
		MetadataList,
		MetadataListItem,
		ProgressBar,
		Section,
		StackItem,
		Tab,
		TabList,
		TabMenu,
		Text,
		Thumbnail,
		VStack,
		useMediaQuery
	} from '@astryx-svelte/core';
	import {
		ArrowLeftIcon,
		CalendarIcon,
		FlagIcon,
		FunnelIcon,
		HandThumbUpIcon,
		HeartIcon,
		PencilSquareIcon,
		ViewColumnsIcon
	} from '@fvilers/heroicons-svelte/24/outline';

	// ─── Styles ─────────────────────────────────────────────────────────────────

	// The only custom CSS in this template is small optical-alignment negative
	// margins: LayoutHeader/TabList have no edge-dock prop (#2622) and List
	// has no "bleed to container edge" prop (#2626). Everything else uses props.
	// Plain inline styles — no StyleX compiler required.

	// Bleed the tab bar to the header's content edges so the active-tab underline
	// meets the header divider. No edge-dock prop on TabList (#2622).
	const tabsRow = 'margin-inline: -12px; margin-bottom: -16px; margin-top: 12px;';
	// Pull the list items' inner padding back so their content optically aligns
	// with the section heading above (ListItem insets content by ~8px). No
	// edge/inset prop on List (#2626).
	const itemsList = 'margin-inline: -8px;';

	// ─── Product data ───────────────────────────────────────────────────────────
	const PRODUCT_IMAGES = [
		'https://lookaside.facebook.com/assets/astryx/light-product-1.png',
		'https://lookaside.facebook.com/assets/astryx/light-product-2.png',
		'https://lookaside.facebook.com/assets/astryx/light-product-3.png',
		'https://lookaside.facebook.com/assets/astryx/light-product-4.png',
		'https://lookaside.facebook.com/assets/astryx/light-product-5.png'
	];

	const PRODUCTS = [
		{
			name: 'Solstice Mug',
			details: 'Glaze: Snow\nFinish: Matte',
			price: 89.0,
			qty: 1,
			image: PRODUCT_IMAGES[0]
		},
		{
			name: 'Ember Bowl',
			details: 'Glaze: Sage\nSize: 6 in',
			price: 42.0,
			qty: 2,
			image: PRODUCT_IMAGES[1]
		},
		{
			name: 'Terra Cup',
			details: 'Glaze: Oat\nSize: 14 in',
			price: 65.0,
			qty: 1,
			image: PRODUCT_IMAGES[2]
		},
		{
			name: 'Dawn Plate Set',
			details: 'Glaze: Charcoal\nCapacity: 3 oz',
			price: 34.0,
			qty: 3,
			image: PRODUCT_IMAGES[3]
		},
		{
			name: 'Kiln Salad Bowl',
			details: 'Glaze: Snow\nHeight: 8 in',
			price: 78.0,
			qty: 1,
			image: PRODUCT_IMAGES[4]
		}
	];

	const SUBTOTAL = PRODUCTS.reduce((sum, p) => sum + p.price * p.qty, 0);
	const DISCOUNT = 15.0;
	const SHIPPING = 0;
	const TAX_RATE = 0.0825;
	const TAX = Math.round((SUBTOTAL - DISCOUNT) * TAX_RATE * 100) / 100;
	const TOTAL = SUBTOTAL - DISCOUNT + SHIPPING + TAX;
	const fmt = (n: number) => `$${n.toFixed(2)}`;

	// ─── Activity data ──────────────────────────────────────────────────────────
	const ACTIVITY = [
		{
			type: 'event' as const,
			user: 'Jane Doe',
			text: 'placed order #1001',
			reactions: 2,
			time: 'Feb 23 at 9:12 AM'
		},
		{
			type: 'comment' as const,
			user: 'Alex Rivera',
			text: "Customer requested gift wrapping for the mug & plate set. I've added a note to the packing slip — warehouse team should wrap in recycled kraft paper.",
			reactions: 3,
			time: 'Feb 23 at 10:45 AM'
		},
		{
			type: 'update' as const,
			user: 'System',
			text: 'has several information changes',
			time: 'Feb 23 at 11:30 AM',
			changes: ['Payment verified via Visa ...7482', 'Fraud check passed — low risk']
		},
		{
			type: 'event' as const,
			user: 'Alex Rivera',
			text: 'marked order as ready for fulfillment',
			reactions: 1,
			time: 'Feb 23 at 2:15 PM'
		}
	];

	// ─── Main Page ──────────────────────────────────────────────────────────────
	let activeTab = $state('details');
	const isNarrow = useMediaQuery(() => '(max-width: 1024px)');
	// Desktop: a fixed-width `end`-slot side panel that can be hidden.
	let showSidePanel = $state(true);
	// Mobile: the panel opens as a full-screen dialog (the side slot would squish
	// the main content), driven by the same toolbar button.
	let isPanelDialogOpen = $state(false);

	const isPanelShown = $derived(isNarrow.matches ? isPanelDialogOpen : showSidePanel);
	const togglePanel = () =>
		isNarrow.matches
			? (isPanelDialogOpen = !isPanelDialogOpen)
			: (showSidePanel = !showSidePanel);
</script>

<!-- ─── Bullet separator ──────────────────────────────────────────────────── -->
{#snippet bullet()}
	<Text type="supporting" color="secondary">{'・'}</Text>
{/snippet}

<!-- ─── Page Header ───────────────────────────────────────────────────────── -->
{#snippet viewColumnsIcon()}<Icon icon={ViewColumnsIcon} size="sm" />{/snippet}

{#snippet pageHeader()}
	<LayoutHeader hasDivider padding={4}>
		<VStack gap={3}>
			<HStack gap={4} vAlign="start">
				<StackItem size="fill">
					<VStack gap={0}>
						<Link href="#" color="secondary">
							<HStack gap={1} vAlign="center">
								<Icon icon={ArrowLeftIcon} size="sm" color="inherit" />
								All orders
							</HStack>
						</Link>
						<VStack gap={0}>
							<Heading level={1} maxLines={1}>#1001</Heading>
							<!-- Metadata wraps to multiple lines on narrow screens (rather
									than collapsing items behind a "+N more" overflow). -->
							<HStack gap={1} vAlign="center" wrap="wrap">
								<Text type="body" maxLines={1}>{PRODUCTS.length} ordered items</Text>
								<HStack gap={1} vAlign="center">
									{@render bullet()}
									<Avatar name="Jane Doe" size="sm" />
									<Text type="body" maxLines={1}>Jane Doe</Text>
								</HStack>
								<HStack gap={1} vAlign="center">
									{@render bullet()}
									<Badge variant="warning" label="Unfulfilled" />
								</HStack>
								<HStack gap={1} vAlign="center">
									{@render bullet()}
									<Icon icon={CalendarIcon} size="sm" color="secondary" />
									<Text type="body" maxLines={1}>02/23/2026</Text>
								</HStack>
								<HStack gap={1} vAlign="center">
									{@render bullet()}
									<Icon icon={FlagIcon} size="sm" color="secondary" />
									<Text type="body" maxLines={1}>Needs attention</Text>
								</HStack>
								<HStack gap={1} vAlign="center">
									{@render bullet()}
									<Link href="#" color="secondary">See all</Link>
								</HStack>
							</HStack>
						</VStack>
					</VStack>
				</StackItem>
				{#if !isNarrow.matches}
					<HStack gap={2}>
						<Button label="Restock" variant="secondary" />
						<Button label="Edit" variant="secondary" />
					</HStack>
				{/if}
			</HStack>

			<!-- Mobile: actions drop below the metadata as a full-width row. The
					VStack hAlign="stretch" wrapper is the full-width-button
					workaround — Button has no full-width prop (#2600). -->
			{#if isNarrow.matches}
				<HStack gap={2}>
					<StackItem size="fill">
						<VStack hAlign="stretch">
							<Button label="Restock" variant="secondary" />
						</VStack>
					</StackItem>
					<StackItem size="fill">
						<VStack hAlign="stretch">
							<Button label="Edit" variant="secondary" />
						</VStack>
					</StackItem>
				</HStack>
			{/if}

			<HStack vAlign="center" style={tabsRow}>
				<StackItem size="fill">
					<TabList value={activeTab} onChange={(v) => (activeTab = v)} size="lg">
						<Tab value="details" label="Details" />
						<Tab value="invoices" label="Invoices" />
						<Tab value="timeline" label="Timeline" />
						<TabMenu
							label="More"
							options={[
								{ value: 'customer', label: 'Customer' },
								{ value: 'analysis', label: 'Analysis' }
							]}
						/>
					</TabList>
				</StackItem>
				<Button
					label={isPanelShown ? 'Hide panel' : 'Show panel'}
					variant="ghost"
					size="md"
					icon={viewColumnsIcon}
					isIconOnly
					onclick={togglePanel}
				/>
			</HStack>
		</VStack>
	</LayoutHeader>
{/snippet}

<!-- ─── Items Card ────────────────────────────────────────────────────────── -->
{#snippet itemsCard()}
	<Section>
		<VStack gap={4}>
			<HStack vAlign="center" gap={2} wrap="wrap">
				<StackItem size="fill">
					<HStack gap={2} vAlign="center">
						<Heading level={2}>Items</Heading>
						<Badge variant="warning" label="Unfulfilled" />
					</HStack>
				</StackItem>
				<HStack gap={2}>
					<Button label="Fulfill item" variant="ghost" />
					<Button label="Create label" variant="secondary" />
				</HStack>
			</HStack>

			<List density="spacious" style={itemsList}>
				{#each PRODUCTS as product, i (i)}
					{#snippet description()}
						<VStack gap={0}>
							{#each product.details.split('\n') as line, j (j)}
								<Text type="supporting" color="secondary">{line}</Text>
							{/each}
						</VStack>
					{/snippet}
					{#snippet startContent()}
						<Thumbnail src={product.image} alt={product.name} label={product.name} />
					{/snippet}
					{#snippet endContent()}
						<VStack gap={0} hAlign="end">
							<Text type="body" weight="bold" maxLines={1}>
								{fmt(product.price * product.qty)}
							</Text>
							<Text type="supporting" color="secondary" maxLines={1}>
								{fmt(product.price)} {'×'} {product.qty}
							</Text>
						</VStack>
					{/snippet}
					<ListItem
						label={product.name}
						{description}
						onclick={() => {}}
						{startContent}
						{endContent}
					/>
				{/each}
			</List>
		</VStack>
	</Section>
{/snippet}

<!-- ─── Invoice Card ──────────────────────────────────────────────────────── -->
{#snippet invoiceCard()}
	<Section>
		<VStack gap={4}>
			<HStack vAlign="center" gap={2} wrap="wrap">
				<StackItem size="fill">
					<HStack gap={2} vAlign="center">
						<Heading level={2}>Invoice</Heading>
						<Badge variant="success" label="Paid" />
					</HStack>
				</StackItem>
				<HStack gap={2}>
					<Button label="Refund" variant="ghost" />
					<Button label="Send Invoice" variant="secondary" />
				</HStack>
			</HStack>

			<MetadataList>
				<MetadataListItem label="Subtotal">
					<HStack>
						<StackItem size="fill">
							<Text type="body">{PRODUCTS.length} items</Text>
						</StackItem>
						<Text type="body">{fmt(SUBTOTAL)}</Text>
					</HStack>
				</MetadataListItem>
				<MetadataListItem label="Discount">
					<HStack>
						<StackItem size="fill">
							<Text type="body">New customer code: NEW15</Text>
						</StackItem>
						<Text type="body">– {fmt(DISCOUNT)}</Text>
					</HStack>
				</MetadataListItem>
				<MetadataListItem label="Shipping">
					<HStack>
						<StackItem size="fill">
							<Text type="body">Free shipping (0.0lbs) USPS</Text>
						</StackItem>
						<Text type="body">{fmt(SHIPPING)}</Text>
					</HStack>
				</MetadataListItem>
				<MetadataListItem label="Tax">
					<HStack>
						<StackItem size="fill">
							<Text type="body">Sales tax (8.25%)</Text>
						</StackItem>
						<Text type="body">{fmt(TAX)}</Text>
					</HStack>
				</MetadataListItem>
				<MetadataListItem label="Total">
					<HStack>
						<StackItem size="fill" />
						<Text type="body" weight="bold">{fmt(TOTAL)}</Text>
					</HStack>
				</MetadataListItem>
			</MetadataList>

			<Divider />

			<MetadataList>
				<MetadataListItem label="Paid by customer">
					<HStack>
						<StackItem size="fill">
							<Text type="body">Visa ...7482</Text>
						</StackItem>
						<Text type="body">{fmt(TOTAL)}</Text>
					</HStack>
				</MetadataListItem>
			</MetadataList>
		</VStack>
	</Section>
{/snippet}

<!-- ─── Timeline ──────────────────────────────────────────────────────────── -->
{#snippet funnelIcon()}<Icon icon={FunnelIcon} />{/snippet}

{#snippet timelineSection()}
	<Section>
		<VStack gap={4}>
			<HStack vAlign="center">
				<StackItem size="fill">
					<Heading level={2}>Timeline</Heading>
				</StackItem>
				<Button label="Filters" variant="ghost" icon={funnelIcon} isIconOnly />
			</HStack>

			<VStack gap={4}>
				{#each ACTIVITY as item, i (i)}
					<VStack gap={2}>
						<HStack gap={3} vAlign="start">
							<Avatar name={item.user} size="md" />
							<StackItem size="fill">
								<VStack gap={2}>
									<Card variant="muted" padding={3}>
										<VStack gap={1}>
											<Text type="body" weight="bold">{item.user}</Text>
											<Text type="body">{item.text}</Text>
											{#if item.changes}
												<VStack gap={1}>
													{#each item.changes as change, j (j)}
														<HStack gap={2} vAlign="center">
															<Icon icon={PencilSquareIcon} size="sm" color="secondary" />
															<Text type="supporting" color="secondary">{change}</Text>
														</HStack>
													{/each}
												</VStack>
											{/if}
										</VStack>
									</Card>
									<HStack gap={3} vAlign="center">
										<HStack gap={1} vAlign="center">
											<Icon icon={HandThumbUpIcon} size="xsm" color="secondary" />
											<Icon icon={HeartIcon} size="xsm" color="secondary" />
											<Text type="supporting" color="secondary">{item.reactions}</Text>
										</HStack>
										<Text type="supporting" color="secondary">Like</Text>
										{@render bullet()}
										<Text type="supporting" color="secondary">Reply</Text>
										{@render bullet()}
										<Text type="supporting" color="secondary">{item.time}</Text>
									</HStack>
								</VStack>
							</StackItem>
						</HStack>
					</VStack>
				{/each}
			</VStack>
		</VStack>
	</Section>
{/snippet}

<!-- ─── Right Panel ───────────────────────────────────────────────────────── -->
<!-- Renders as a fixed-width side panel on desktop, and as a plain stacked section
	on mobile (so it flows below the content instead of squishing beside it). -->
{#snippet notesTrigger()}<Heading level={4}>Notes</Heading>{/snippet}
{#snippet customerTrigger()}<Heading level={4}>Customer</Heading>{/snippet}
{#snippet fraudAnalysisTrigger()}<Heading level={4}>Fraud Analysis</Heading>{/snippet}

{#snippet panelContent()}
	<VStack gap={4}>
		<Collapsible trigger={notesTrigger}>
			<Text type="body">
				Customer is a repeat buyer — 3rd order this quarter. Prefers snow and oat glazes.
				Requested gift wrapping for the mug set. Ships to a residential address in CA.{' '}
				<Link href="#" color="secondary">Show more</Link>
			</Text>
		</Collapsible>
		<Collapsible trigger={customerTrigger}>
			<MetadataList>
				<MetadataListItem label="Name">Jane Doe</MetadataListItem>
				<MetadataListItem label="Address">321 Smith Road, CA 38238</MetadataListItem>
				<MetadataListItem label="Phone">234-</MetadataListItem>
				<MetadataListItem label="Email">janedoe@email.com</MetadataListItem>
				<MetadataListItem label="Billing Address">
					Same as shipping address
				</MetadataListItem>
			</MetadataList>
		</Collapsible>
		<Collapsible trigger={fraudAnalysisTrigger}>
			<VStack gap={1}>
				<ProgressBar label="Risk level" value={15} variant="success" isLabelHidden />
				<Text type="body">Recommendation: Fulfill order</Text>
				<Text type="body">
					There is a low chance that you will receive a chargeback on this order.
				</Text>
			</VStack>
		</Collapsible>
	</VStack>
{/snippet}

<!-- Desktop: fixed-width side panel in the layout's `end` slot. -->
{#snippet rightPanel()}
	<LayoutPanel width={320} padding={4} role="complementary">
		{@render panelContent()}
	</LayoutPanel>
{/snippet}

<!-- ─── Main Page ─────────────────────────────────────────────────────────── -->
{#snippet content()}
	<LayoutContent role="main">
		<VStack gap={4}>
			{@render itemsCard()}
			{@render invoiceCard()}
			{@render timelineSection()}
		</VStack>
	</LayoutContent>
{/snippet}

{#snippet dialogHeader()}
	<DialogHeader title="Order details" onOpenChange={(isOpen) => (isPanelDialogOpen = isOpen)} />
{/snippet}

{#snippet dialogContent()}
	<LayoutContent padding={4}>
		{@render panelContent()}
	</LayoutContent>
{/snippet}

<Layout
	height="fill"
	contentWidth={1000}
	defaultHasDividers
	header={pageHeader}
	{content}
	end={!isNarrow.matches && showSidePanel ? rightPanel : undefined}
/>
<!-- Mobile: the side panel content opens as a full-screen dialog. (A
	side drawer/sheet would be more idiomatic, but Astryx has no Drawer
	component yet — #2575 — so we use the fullscreen Dialog variant.) -->
<Dialog
	variant="fullscreen"
	isOpen={isNarrow.matches && isPanelDialogOpen}
	onOpenChange={(isOpen) => (isPanelDialogOpen = isOpen)}
>
	<Layout header={dialogHeader} content={dialogContent} />
</Dialog>
