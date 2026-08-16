<!--
	Ported from upstream's `assets/templates/pages/editor/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Upstream imports twenty-four Heroicons, so every icon is a registry
	substitution. True matches: `ChevronDownIcon` → `chevronDown`, `XMarkIcon` →
	`close`, `ViewColumnsIcon` → `viewColumns`, `EllipsisHorizontalIcon` →
	`moreHorizontal`. Everything else is a stand-in: `Squares2X2Icon` →
	`viewColumns`, `DocumentTextIcon` → `copy`, `PhotoIcon` → `calendar`,
	`CursorArrowRaysIcon` → `arrowUp`, `SparklesIcon` → `wrench`,
	`MegaphoneIcon` → `microphone`, `TrashIcon` → `close`, `ChevronUpIcon` →
	`arrowUp` (the registry ships `chevronDown` but no `chevronUp`),
	`ComputerDesktopIcon` → `stop`, `DeviceTabletIcon` → `copy`,
	`DevicePhoneMobileIcon` → `menu`, `EyeIcon` → `eyeSlash`,
	`AdjustmentsHorizontalIcon` → `wrench`, `PlusCircleIcon` → `check` (no plus
	— the call `shell-side-nav` makes), `ShoppingBagIcon` → `stop`,
	`ShoppingCartIcon` → `checkDouble`, `BanknotesIcon` → `copy`,
	`ChatBubbleLeftIcon` → `moreHorizontal`, `PlayCircleIcon` → `chevronRight`,
	`LockClosedIcon` → `warning`.

	Icons are Heroicons, upstream's own set: `@fvilers/heroicons-svelte` is that
	set built for Svelte 5, and it keeps upstream's component names and its
	`24/outline` / `20/solid` / `24/solid` entry points. The imports below are
	upstream's with the package name changed, so each glyph is the one upstream
	draws rather than a stand-in from core's 28-name `Icon` registry — that
	registry names theme-swappable UI affordances and was never meant to carry
	arbitrary artwork.

	Upstream's `IconComponent` alias goes with the Heroicons: an icon here is an
	`IconName`, which is what `BLOCK_META.icon` and `CATEGORY_ICONS` now hold.

	`nextId`/`uid()` are module-level mutable state upstream, so they live in
	`<script module>` — the only Svelte block where a module-scope `let` may be
	written.

	`TRANSACTION_COLUMNS` moves from module scope to the instance script, because
	`TableColumn.renderCell` is a `Snippet<[Transaction]>` here rather than
	upstream's `(item) => ReactNode`, and a snippet is declared in markup and so
	belongs to the instance.

	`PropertiesForm` and `BlockPreview` are components upstream and hold no
	state, so both transcribe to parameterised snippets — as do the four JSX
	consts (`blocksTabContent`, `propertiesTabContent`, `editingContent`,
	`sidebar`). A page template is a single `+page.svelte`; the CLI copies
	`PAGE_SOURCE_FILE` and nothing beside it. `sidebar` is handed to two Layout
	props for the same reason upstream hands one element to both.

	Upstream's `CSSProperties` objects become strings, keeping their const names
	and key order, because Svelte's `style` prop is a string. `useMediaQuery`
	takes its query as a **getter** here and returns an object of getters, so
	`isMobile` is read through (`isMobile.matches`) and never destructured.

	Upstream's `isEditingTitle` is only ever set to `false` — nothing flips it
	true, so the inline title input is unreachable. Reproduced rather than fixed:
	upstream bugs are recorded in port/todo.md, not repaired here.
-->
<script lang="ts" module>
	let nextId = 5;
	function uid() {
		return String(nextId++);
	}
</script>

<script lang="ts">
	import {
		Button,
		Card,
		Center,
		Dialog,
		Divider,
		EmptyState,
		HStack,
		Heading,
		Icon,
		Layout,
		LayoutContent,
		LayoutHeader,
		LayoutPanel,
		List,
		ListItem,
		Section,
		SegmentedControl,
		SegmentedControlItem,
		Selector,
		Spinner,
		Tab,
		TabList,
		Table,
		Text,
		TextArea,
		TextInput,
		Toolbar,
		VStack,
		useMediaQuery,
		type IconName,
		type TableColumn
	} from '@astryx-svelte/core';
	import {
		AdjustmentsHorizontalIcon,
		ChevronDownIcon,
		ChevronUpIcon,
		ComputerDesktopIcon,
		DevicePhoneMobileIcon,
		DeviceTabletIcon,
		EllipsisHorizontalIcon,
		EyeIcon,
		LockClosedIcon,
		PhotoIcon,
		PlusCircleIcon,
		TrashIcon,
		XMarkIcon
	} from '@fvilers/heroicons-svelte/24/outline';

	type BlockType = 'hero' | 'text' | 'image' | 'button' | 'cards' | 'features' | 'cta';

	interface Block {
		id: string;
		type: BlockType;
		label: string;
		props: Record<string, unknown>;
	}

	type ViewportSize = 'desktop' | 'tablet' | 'phone';
	type SidebarTab = 'blocks' | 'properties';

	const BLOCK_META: Record<BlockType, { label: string; icon: IconName }> = {
		hero: { label: 'Hero', icon: 'viewColumns' },
		text: { label: 'Text', icon: 'copy' },
		image: { label: 'Image', icon: 'calendar' },
		button: { label: 'Button', icon: 'arrowUp' },
		cards: { label: 'Cards', icon: 'viewColumns' },
		features: { label: 'Features', icon: 'wrench' },
		cta: { label: 'CTA', icon: 'microphone' }
	};

	type Transaction = {
		id: string;
		name: string;
		category: string;
		date: string;
		amount: string;
		isPositive?: boolean;
	};

	const CATEGORY_ICONS: Record<string, IconName> = {
		'Food & Drink': 'stop',
		Groceries: 'checkDouble',
		Income: 'copy',
		Transport: 'moreHorizontal',
		Entertainment: 'chevronRight'
	};

	const VIEWPORT_MAX: Record<ViewportSize, number> = {
		desktop: 960,
		tablet: 768,
		phone: 375
	};

	const DEFAULT_BLOCKS: Block[] = [
		{
			id: '2',
			type: 'features',
			label: 'Recent Transactions',
			props: {
				heading: 'Recent Transactions',
				description: 'Your latest account activity.',
				items: [
					{
						id: 't1',
						name: 'Blue Bottle Coffee',
						category: 'Food & Drink',
						date: 'Today, 10:24 AM',
						amount: '-$6.50'
					},
					{
						id: 't2',
						name: 'Whole Foods Market',
						category: 'Groceries',
						date: 'Yesterday',
						amount: '-$142.30'
					},
					{
						id: 't3',
						name: 'Stripe Payout',
						category: 'Income',
						date: 'Oct 12',
						amount: '+$4,200.00',
						isPositive: true
					},
					{
						id: 't4',
						name: 'Uber Technologies',
						category: 'Transport',
						date: 'Oct 11',
						amount: '-$24.10'
					},
					{
						id: 't5',
						name: 'Netflix Subscription',
						category: 'Entertainment',
						date: 'Oct 10',
						amount: '-$19.99'
					}
				]
			}
		},
		{
			id: '3',
			type: 'text',
			label: 'Syncing State',
			props: {
				heading: 'Syncing your accounts',
				description:
					"We're pulling in your latest transactions.\nThis usually takes a few seconds.",
				buttonLabel: 'Cancel'
			}
		},
		{
			id: '4',
			type: 'cta',
			label: 'Trust Notice',
			props: {
				heading: 'Adding devices from people you trust',
				description:
					"When you approve a request, you grant someone full access to your account. They'll be able to change reservations and send messages on your behalf."
			}
		}
	];

	function defaultProps(type: BlockType): Record<string, unknown> {
		switch (type) {
			case 'hero':
				return {
					heading: 'New Hero',
					subheading: 'Subtitle goes here',
					buttonLabel: 'Click Me',
					alignment: 'center'
				};
			case 'text':
				return { content: 'Enter your text here.' };
			case 'image':
				return {};
			case 'button':
				return { label: 'Button', variant: 'primary', size: 'md' };
			case 'cards':
				return {
					cards: [
						{
							title: 'Pricing',
							description: 'Flexible plans for every team size.'
						},
						{
							title: 'Support',
							description: 'Get help whenever you need it.'
						}
					]
				};
			case 'features':
				return {
					heading: 'Activity',
					description: '',
					items: [
						{
							id: 't1',
							name: 'New Item',
							category: 'General',
							date: 'Today',
							amount: '$0.00'
						}
					]
				};
			case 'cta':
				return {
					heading: 'Call to Action',
					description: 'Description text',
					primaryLabel: 'Primary',
					secondaryLabel: 'Secondary'
				};
		}
	}

	// -------------------------------------------------------------------------
	// Styles
	// -------------------------------------------------------------------------
	// The layout (sidebar + scrollable canvas, full height) is all Layout +
	// LayoutPanel now. The few remaining styles are things Astryx has no prop for:
	// the responsive canvas max-width, a selection ring on the active block card,
	// and the circular icon chip's surface.

	// Fill the window. Layout height="fill" is height:100%, which only resolves
	// against a definite height — and the host's <html>/<body> don't set one, so
	// the layout anchors a definite viewport height itself. No background; the
	// host owns the page surface.
	const pageStyle = 'height: 100dvh;';
	// Canvas reflows to the chosen viewport width; VStack has no maxWidth prop.
	const canvasStyle = (maxWidth: number) =>
		`max-width: ${maxWidth}px; width: 100%; margin-inline: auto;`;
	const clickable = 'cursor: pointer;';
	// Selection ring on the active block — Card has no `isSelected` state.
	const selectedCard =
		'outline: 2px solid; outline-color: var(--color-border-blue); outline-offset: -2px;';
	// Circular muted chip behind the CTA icon — Center handles the centering
	// and sizing; only the surface (radius + fill) needs custom CSS.
	const iconCircle = 'border-radius: 50%; background-color: var(--color-background-muted);';

	// -------------------------------------------------------------------------
	// Editor Page
	// -------------------------------------------------------------------------

	let blocks = $state.raw<Block[]>(DEFAULT_BLOCKS);
	let selectedId = $state<string | null>(null);
	let sidebarTab = $state<SidebarTab>('blocks');
	let pageTitle = $state('Page Editor');
	let isEditingTitle = $state(false);
	let viewport = $state<ViewportSize>('desktop');
	// Mobile only: the customizations (tabs + Add Block/Layers) open in a
	// fullscreen dialog over the preview, since there's no room to dock them.
	let isCustomizeOpen = $state(false);

	// On phones the editor stacks: the panel sits in the header slot (full width,
	// above the canvas) showing just its toolbar, so the canvas isn't crushed
	// beside a 320px sidebar. On desktop the full panel (tabs + lists) shows.
	const isMobile = useMediaQuery(() => '(max-width: 768px)');

	const selectedBlock = $derived(blocks.find((b) => b.id === selectedId) ?? null);

	const TRANSACTION_COLUMNS: TableColumn<Transaction>[] = [
		{
			key: 'name',
			header: 'Transaction',
			renderCell: nameCell
		},
		{
			key: 'date',
			header: 'Date',
			renderCell: dateCell
		},
		{
			key: 'amount',
			header: 'Amount',
			renderCell: amountCell
		},
		{
			key: 'actions',
			header: '',
			renderCell: actionsCell
		}
	];

	function updateBlockProp(id: string, key: string, value: unknown) {
		blocks = blocks.map((b) => (b.id === id ? { ...b, props: { ...b.props, [key]: value } } : b));
	}

	function moveBlock(id: string, dir: -1 | 1) {
		const prev = blocks;
		const idx = prev.findIndex((b) => b.id === id);
		if (idx < 0) {
			return;
		}
		const target = idx + dir;
		if (target < 0 || target >= prev.length) {
			return;
		}
		const next = [...prev];
		[next[idx], next[target]] = [next[target], next[idx]];
		blocks = next;
	}

	function deleteBlock(id: string) {
		blocks = blocks.filter((b) => b.id !== id);
		if (selectedId === id) {
			selectedId = null;
		}
	}

	function addBlock(type: BlockType) {
		const id = uid();
		const newBlock: Block = {
			id,
			type,
			label: BLOCK_META[type].label,
			props: defaultProps(type)
		};
		blocks = [...blocks, newBlock];
		selectedId = id;
		sidebarTab = 'properties';
	}

	function selectBlock(id: string) {
		selectedId = selectedId === id ? null : id;
		sidebarTab = 'properties';
		// On mobile, tapping a block on the canvas opens its properties dialog.
		if (isMobile.matches) {
			isCustomizeOpen = true;
		}
	}
</script>

{#snippet ellipsisHorizontalIcon()}<Icon icon={EllipsisHorizontalIcon} size="sm" />{/snippet}
{#snippet photoIcon()}<Icon icon={PhotoIcon} />{/snippet}
{#snippet plusCircleIcon()}<Icon icon={PlusCircleIcon} />{/snippet}
{#snippet chevronUpIcon()}<Icon icon={ChevronUpIcon} size="sm" />{/snippet}
{#snippet chevronDownIcon()}<Icon icon={ChevronDownIcon} size="sm" />{/snippet}
{#snippet trashIcon()}<Icon icon={TrashIcon} size="sm" />{/snippet}
{#snippet computerDesktopIcon()}<Icon icon={ComputerDesktopIcon} size="sm" />{/snippet}
{#snippet deviceTabletIcon()}<Icon icon={DeviceTabletIcon} size="sm" />{/snippet}
{#snippet devicePhoneMobileIcon()}<Icon icon={DevicePhoneMobileIcon} size="sm" />{/snippet}
{#snippet eyeIcon()}<Icon icon={EyeIcon} size="sm" />{/snippet}
{#snippet adjustmentsHorizontalIcon()}<Icon icon={AdjustmentsHorizontalIcon} size="sm" />{/snippet}
{#snippet xMarkIcon()}<Icon icon={XMarkIcon} size="sm" />{/snippet}
{#snippet syncingSpinner()}<Spinner />{/snippet}

<!-- Transaction table cells — `renderCell` is a `Snippet<[Transaction]>` here. -->
{#snippet nameCell(item: Transaction)}
	<HStack gap={3} vAlign="center">
		<Icon icon={CATEGORY_ICONS[item.category] || 'wrench'} />
		<VStack gap={0}>
			<Text type="label" weight="semibold">{item.name}</Text>
			<Text type="supporting" color="secondary">{item.category}</Text>
		</VStack>
	</HStack>
{/snippet}

{#snippet dateCell(item: Transaction)}
	<Text type="body" color="secondary">{item.date}</Text>
{/snippet}

{#snippet amountCell(item: Transaction)}
	<Text type="label" weight="semibold" color={undefined} hasTabularNumbers>{item.amount}</Text>
{/snippet}

{#snippet actionsCell(_item: Transaction)}
	<Button label="More" icon={ellipsisHorizontalIcon} variant="ghost" size="sm" isIconOnly />
{/snippet}

<!-- ------------------------------------------------------------------------
	Properties Form
------------------------------------------------------------------------- -->

{#snippet propertiesForm(block: Block, onUpdate: (key: string, value: unknown) => void)}
	{@const type = block.type}
	{@const props = block.props}
	{#if type === 'hero'}
		<VStack gap={4}>
			<TextInput
				label="Heading"
				value={(props.heading as string) ?? ''}
				onChange={(v: string) => onUpdate('heading', v)}
			/>
			<TextArea
				label="Subheading"
				value={(props.subheading as string) ?? ''}
				onChange={(v: string) => onUpdate('subheading', v)}
			/>
			<TextInput
				label="Button Label"
				value={(props.buttonLabel as string) ?? ''}
				onChange={(v: string) => onUpdate('buttonLabel', v)}
			/>
			<Selector
				label="Alignment"
				value={(props.alignment as string) ?? 'center'}
				onChange={(v: string) => onUpdate('alignment', v)}
				options={[
					{ label: 'Left', value: 'left' },
					{ label: 'Center', value: 'center' },
					{ label: 'Right', value: 'right' }
				]}
			/>
		</VStack>
	{:else if type === 'text'}
		<VStack gap={4}>
			<TextInput
				label="Heading"
				value={(props.heading as string) ?? ''}
				onChange={(v: string) => onUpdate('heading', v)}
			/>
			<TextArea
				label="Description"
				value={(props.description as string) ?? ''}
				onChange={(v: string) => onUpdate('description', v)}
			/>
			<TextInput
				label="Button Label"
				value={(props.buttonLabel as string) ?? ''}
				onChange={(v: string) => onUpdate('buttonLabel', v)}
			/>
		</VStack>
	{:else if type === 'features' || type === 'cta'}
		<VStack gap={4}>
			<TextInput
				label="Heading"
				value={(props.heading as string) ?? ''}
				onChange={(v: string) => onUpdate('heading', v)}
			/>
			<TextArea
				label="Description"
				value={(props.description as string) ?? ''}
				onChange={(v: string) => onUpdate('description', v)}
			/>
		</VStack>
	{:else if type === 'button'}
		<VStack gap={4}>
			<TextInput
				label="Label"
				value={(props.label as string) ?? ''}
				onChange={(v: string) => onUpdate('label', v)}
			/>
			<Selector
				label="Variant"
				value={(props.variant as string) ?? 'primary'}
				onChange={(v: string) => onUpdate('variant', v)}
				options={[
					{ label: 'Primary', value: 'primary' },
					{ label: 'Secondary', value: 'secondary' },
					{ label: 'Ghost', value: 'ghost' }
				]}
			/>
			<Selector
				label="Size"
				value={(props.size as string) ?? 'md'}
				onChange={(v: string) => onUpdate('size', v)}
				options={[
					{ label: 'Small', value: 'sm' },
					{ label: 'Medium', value: 'md' },
					{ label: 'Large', value: 'lg' }
				]}
			/>
		</VStack>
	{:else}
		<EmptyState title="No configurable properties" isCompact />
	{/if}
{/snippet}

<!-- ------------------------------------------------------------------------
	Block Preview
------------------------------------------------------------------------- -->

{#snippet blockPreview(block: Block, isSelected: boolean, onSelect: () => void)}
	{@const type = block.type}
	{@const props = block.props}
	{@const cardStyle = `${clickable}${isSelected ? ` ${selectedCard}` : ''}`}
	{#if type === 'hero'}
		<Card padding={6} style={cardStyle} onclick={onSelect}>
			<VStack gap={4}>
				<Heading level={2}>{(props.heading as string) || 'Hero Heading'}</Heading>
				<Text type="supporting" color="secondary">
					{(props.subheading as string) || 'Subtitle text goes here'}
				</Text>
				{#if props.buttonLabel as string}
					<Button label={props.buttonLabel as string} />
				{/if}
			</VStack>
		</Card>
	{:else if type === 'text'}
		{#if props.heading}
			{#snippet textActions()}
				<Button label={props.buttonLabel as string} variant="secondary" />
			{/snippet}
			<Card padding={6} style={cardStyle} onclick={onSelect}>
				<EmptyState
					title={props.heading as string}
					description={props.description as string}
					icon={syncingSpinner}
					actions={(props.buttonLabel as string) ? textActions : undefined}
				/>
			</Card>
		{:else}
			<Card style={cardStyle} onclick={onSelect}>
				<Text type="body">{(props.content as string) || 'Text content goes here'}</Text>
			</Card>
		{/if}
	{:else if type === 'image'}
		<Card style={cardStyle} onclick={onSelect}>
			<EmptyState
				title="Image Block"
				description="Drop an image or enter a URL"
				icon={photoIcon}
				isCompact
			/>
		</Card>
	{:else if type === 'button'}
		<Card padding={6} style={cardStyle} onclick={onSelect}>
			<Center>
				<Button
					label={(props.label as string) || 'Button'}
					variant={(props.variant as 'primary' | 'secondary' | 'ghost') || 'primary'}
					size={(props.size as 'sm' | 'md' | 'lg') || 'md'}
				/>
			</Center>
		</Card>
	{:else if type === 'features'}
		{@const items = (props.items as Transaction[]) || []}
		<Card padding={6} style={cardStyle} onclick={onSelect}>
			<VStack gap={4}>
				<HStack gap={3} vAlign="start" hAlign="between">
					<VStack gap={1}>
						<Heading level={3}>{(props.heading as string) || 'Features'}</Heading>
						{#if props.description as string}
							<Text type="supporting" color="secondary">{props.description as string}</Text>
						{/if}
					</VStack>
					<Button label="View All" variant="secondary" size="sm" />
				</HStack>
				<Table data={items} columns={TRANSACTION_COLUMNS} idKey="id" hasHover />
			</VStack>
		</Card>
	{:else if type === 'cards'}
		{@const cardItems = (props.cards as Array<{ title: string; description: string }>) || []}
		<Card style={cardStyle} onclick={onSelect}>
			<VStack gap={4}>
				<Heading level={3}>Cards</Heading>
				<Divider />
				<List density="balanced" hasDividers={false}>
					{#each cardItems as card, i (i)}
						<ListItem label={card.title} description={card.description} />
					{/each}
				</List>
			</VStack>
		</Card>
	{:else if type === 'cta'}
		<Card padding={6} style={cardStyle} onclick={onSelect}>
			<HStack gap={4} vAlign="start">
				<Center width={40} height={40} style={iconCircle}>
					<Icon icon={LockClosedIcon} color="secondary" />
				</Center>
				<VStack gap={1}>
					<Text type="label" weight="semibold">{(props.heading as string) || 'Notice'}</Text>
					<Text type="supporting" color="secondary">
						{(props.description as string) || 'Description text'}
					</Text>
				</VStack>
			</HStack>
		</Card>
	{/if}
{/snippet}

<!-- --- sidebar content --- -->

{#snippet blocksTabContent()}
	{@const blockTypes = Object.keys(BLOCK_META) as BlockType[]}
	<VStack gap={2}>
		<VStack gap={1}>
			<Heading level={4}>Add Block</Heading>
			<List density="balanced" hasDividers={false}>
				{#each blockTypes as type (type)}
					{#snippet blockTypeIcon()}
						<Icon icon={BLOCK_META[type].icon} color="secondary" />
					{/snippet}
					<ListItem
						label={BLOCK_META[type].label}
						startContent={blockTypeIcon}
						onclick={() => addBlock(type)}
					/>
				{/each}
			</List>
		</VStack>

		<VStack gap={1}>
			<Heading level={4}>Layers</Heading>
			<List density="balanced" hasDividers={false}>
				{#each blocks as block (block.id)}
					{#snippet layerIcon()}
						<Icon icon={BLOCK_META[block.type].icon} color="secondary" />
					{/snippet}
					{#snippet layerActions()}
						<HStack gap={1}>
							<Button
								label="Move up"
								icon={chevronUpIcon}
								variant="ghost"
								size="sm"
								onclick={(e) => {
									e.stopPropagation();
									moveBlock(block.id, -1);
								}}
								isIconOnly
							/>
							<Button
								label="Move down"
								icon={chevronDownIcon}
								variant="ghost"
								size="sm"
								onclick={(e) => {
									e.stopPropagation();
									moveBlock(block.id, 1);
								}}
								isIconOnly
							/>
							<Button
								label="Delete"
								icon={trashIcon}
								variant="ghost"
								size="sm"
								onclick={(e) => {
									e.stopPropagation();
									deleteBlock(block.id);
								}}
								isIconOnly
							/>
						</HStack>
					{/snippet}
					<ListItem
						label={block.label}
						isSelected={block.id === selectedId}
						onclick={() => selectBlock(block.id)}
						startContent={layerIcon}
						endContent={layerActions}
					/>
				{/each}
			</List>
		</VStack>
	</VStack>
{/snippet}

{#snippet propertiesTabContent()}
	{#if selectedBlock}
		{@render propertiesForm(selectedBlock, (key, value) =>
			updateBlockProp(selectedBlock.id, key, value)
		)}
	{:else}
		<EmptyState
			title="No block selected"
			description="Select a block to edit its properties"
			isCompact
		/>
	{/if}
{/snippet}

<!--
	Tabs + the active tab's content. Shown inline in the sidebar on desktop,
	and inside a fullscreen dialog on mobile.
-->
{#snippet editingContent()}
	<VStack gap={4}>
		<VStack gap={0}>
			<TabList
				layout="fill"
				value={sidebarTab}
				onChange={(v: string) => (sidebarTab = v as SidebarTab)}
			>
				<Tab value="blocks" label="Blocks" />
				<Tab value="properties" label="Properties" />
			</TabList>
			<Divider />
		</VStack>
		<Section variant="transparent" padding={4}>
			{#if sidebarTab === 'blocks'}
				{@render blocksTabContent()}
			{:else}
				{@render propertiesTabContent()}
			{/if}
		</Section>
	</VStack>
{/snippet}

{#snippet viewportControl()}
	<SegmentedControl
		label="Viewport size"
		value={viewport}
		onChange={(v: string) => (viewport = v as ViewportSize)}
	>
		<SegmentedControlItem
			value="desktop"
			label="Desktop"
			icon={computerDesktopIcon}
			isLabelHidden
		/>
		<SegmentedControlItem value="tablet" label="Tablet" icon={deviceTabletIcon} isLabelHidden />
		<SegmentedControlItem value="phone" label="Phone" icon={devicePhoneMobileIcon} isLabelHidden />
	</SegmentedControl>
{/snippet}

{#snippet viewportActions()}
	<HStack gap={2}>
		<Button label="Preview" icon={eyeIcon} variant="ghost" isIconOnly />
		<Button label="Publish" variant="primary" />
	</HStack>
{/snippet}

{#snippet sidebar()}
	<LayoutPanel
		hasDivider={!isMobile.matches}
		padding={0}
		style={`width: ${isMobile.matches ? '100%' : '320px'}; flex-shrink: 0;`}
	>
		<VStack gap={4}>
			<!-- Panel Header -->
			<Section variant="transparent" padding={4}>
				{#if isMobile.matches}
					<!--
						Mobile: the title, an Edit button that opens the customizations
						dialog, and the primary action.
					-->
					<HStack gap={3} vAlign="center" hAlign="between">
						<Heading level={2}>{pageTitle}</Heading>
						<HStack gap={2} vAlign="center">
							<Button
								label="Edit"
								icon={adjustmentsHorizontalIcon}
								variant="ghost"
								isIconOnly
								onclick={() => (isCustomizeOpen = true)}
							/>
							<Button label="Publish" variant="primary" />
						</HStack>
					</HStack>
				{:else}
					<VStack gap={4}>
						{#if isEditingTitle}
							<TextInput
								label="Page title"
								isLabelHidden
								value={pageTitle}
								onChange={(value) => (pageTitle = value)}
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										isEditingTitle = false;
									}
								}}
								hasAutoFocus
								onblur={() => (isEditingTitle = false)}
							/>
						{:else}
							<Heading level={2}>{pageTitle}</Heading>
						{/if}

						<Toolbar
							label="Viewport and actions"
							startContent={viewportControl}
							endContent={viewportActions}
						/>
					</VStack>
				{/if}
			</Section>

			{#if !isMobile.matches}
				{@render editingContent()}
			{/if}
		</VStack>
	</LayoutPanel>
{/snippet}

{#snippet content()}
	<LayoutContent padding={8}>
		<VStack gap={4} style={canvasStyle(VIEWPORT_MAX[viewport])}>
			{#if blocks.length > 0}
				{#each blocks as block (block.id)}
					{@render blockPreview(block, block.id === selectedId, () => selectBlock(block.id))}
				{/each}
			{:else}
				<EmptyState
					title="No blocks yet"
					description="Add blocks from the sidebar to start building your page"
					icon={plusCircleIcon}
				/>
			{/if}
		</VStack>
	</LayoutContent>
{/snippet}

{#snippet dialogHeader()}
	<LayoutHeader hasDivider>
		<HStack gap={3} vAlign="center" hAlign="between">
			<Heading level={3}>Customize</Heading>
			<Button
				label="Close"
				icon={xMarkIcon}
				variant="ghost"
				isIconOnly
				onclick={() => (isCustomizeOpen = false)}
			/>
		</HStack>
	</LayoutHeader>
{/snippet}

{#snippet dialogContent()}
	<LayoutContent padding={0}>
		{@render editingContent()}
	</LayoutContent>
{/snippet}

<Layout
	style={pageStyle}
	height="fill"
	header={isMobile.matches ? sidebar : undefined}
	start={isMobile.matches ? undefined : sidebar}
	{content}
/>

<!-- Mobile: customizations open in a fullscreen dialog over the preview. -->
<Dialog
	isOpen={isMobile.matches && isCustomizeOpen}
	onOpenChange={(isOpen) => (isCustomizeOpen = isOpen)}
	variant="fullscreen"
	purpose="info"
	padding={0}
>
	<Layout height="fill" header={dialogHeader} content={dialogContent} />
</Dialog>
