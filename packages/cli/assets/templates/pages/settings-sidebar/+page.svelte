<!--
	Ported from upstream's `assets/templates/pages/settings-sidebar/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Icons are Heroicons, upstream's own set: `@fvilers/heroicons-svelte` is that
	set built for Svelte 5, and it keeps upstream's component names and its
	`24/outline` / `20/solid` / `24/solid` entry points. The imports below are
	upstream's with the package name changed, so each glyph is the one upstream
	draws rather than a stand-in from core's 28-name `Icon` registry — that
	registry names theme-swappable UI affordances and was never meant to carry
	arbitrary artwork.

	Upstream's `fillViewport`/`iconBox`/`rowPadding`/`sideNavPadding`/
	`sideNavHeading` are `CSSProperties` objects handed to `style`; Svelte's
	`style` prop is a string, so they are the same declarations in the same order,
	under upstream's names. Their comments are transcribed with them.

	`InfoRowItem` and `ExpandableRow` are upstream components, and `navList` is a
	JSX const. None holds state, so all three become snippets — a page template is
	a single `+page.svelte`, since the CLI copies `PAGE_SOURCE_FILE` and nothing
	beside it. `ExpandableRow`'s `children: ReactNode` is a `Snippet` parameter,
	so each row's field is declared as its own snippet and passed in. Upstream's
	early `return` for the mobile nav view is the outer `{#if}` at the foot.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		Badge,
		Button,
		Card,
		Center,
		Divider,
		HStack,
		Heading,
		Icon,
		Layout,
		LayoutContent,
		LayoutPanel,
		Link,
		List,
		ListItem,
		Selector,
		StackItem,
		Switch,
		Tab,
		TabList,
		Text,
		TextInput,
		Toolbar,
		VStack,
		useMediaQuery,
		type IconName
	} from '@astryx-svelte/core';
	import {
		ArrowLeftIcon,
		ChevronRightIcon,
		ComputerDesktopIcon,
		LockClosedIcon,
		PencilSquareIcon,
		ShareIcon,
		ShieldCheckIcon,
		WrenchScrewdriverIcon
	} from '@fvilers/heroicons-svelte/24/outline';

	// Anchor the page to the viewport height so the sidebar + content fill the
	// screen. Layout height="fill" is min-height:100% which collapses when the
	// host container is content-sized; Layout has no viewport-height prop.
	const fillViewport = 'min-height: 100dvh;';
	const iconBox =
		'border-radius: var(--radius-container); ' +
		'background-color: var(--color-background-surface); flex-shrink: 0;';
	const rowPadding = 'padding-block: var(--spacing-4);';
	const sideNavPadding = 'padding-block: var(--spacing-4); padding-inline: var(--spacing-3);';
	const sideNavHeading = 'margin-inline: var(--spacing-4);';

	const NAV_ITEMS: { label: string; icon: IconName }[] = [
		{ label: 'Personal information', icon: 'info' },
		{ label: 'Login & security', icon: 'stop' },
		{ label: 'Privacy', icon: 'success' },
		{ label: 'Notifications', icon: 'warning' },
		{ label: 'Taxes', icon: 'copy' },
		{ label: 'Payments', icon: 'viewColumns' },
		{ label: 'Languages & currency', icon: 'clock' },
		{ label: 'Travel for work', icon: 'calendar' }
	];

	// Section title shown beside the mobile back button (matches each section's
	// in-content heading, which is hidden on mobile to avoid a duplicate).
	const SECTION_TITLES: Record<string, string> = {
		'Personal information': 'Personal info',
		'Login & security': 'Login & security',
		Privacy: 'Privacy',
		'Languages & currency': 'Languages & currency'
	};

	interface InfoRow {
		label: string;
		value: string;
		action: string;
	}

	const LOGIN_ROWS: InfoRow[] = [{ label: 'Password', value: 'Not created', action: 'Create' }];

	const SOCIAL_ROWS: InfoRow[] = [{ label: 'Google', value: 'Connected', action: 'Disconnect' }];

	const DEVICE_ROWS: {
		label: string;
		badge?: string;
		location: string;
		action?: string;
	}[] = [
		{
			label: 'OS X 10.15.7 · Chrome',
			badge: 'CURRENT SESSION',
			location: 'McKinney, Texas · March 30, 2026 at 19:31'
		},
		{ label: 'Session', location: 'August 9, 2023 at 04:19', action: 'Log out' },
		{
			label: 'OS X 10.15.7 · unknown',
			location: 'Sunnyvale, California · April 14, 2023 at 17:47',
			action: 'Log out'
		}
	];

	const LANGUAGES = [
		{ label: 'English (Canada)', value: 'en-CA' },
		{ label: 'English (US)', value: 'en-US' },
		{ label: 'French', value: 'fr' },
		{ label: 'Spanish', value: 'es' },
		{ label: 'German', value: 'de' },
		{ label: 'Japanese', value: 'ja' }
	];

	const CURRENCIES = [
		{ label: 'Canadian dollar (CAD)', value: 'CAD' },
		{ label: 'US dollar (USD)', value: 'USD' },
		{ label: 'Euro (EUR)', value: 'EUR' },
		{ label: 'British pound (GBP)', value: 'GBP' },
		{ label: 'Japanese yen (JPY)', value: 'JPY' }
	];

	const TIMEZONES = [
		{ label: '(GMT-05:00) Eastern Time (US & Canada)', value: 'ET' },
		{ label: '(GMT-06:00) Central Time (US & Canada)', value: 'CT' },
		{ label: '(GMT-07:00) Mountain Time (US & Canada)', value: 'MT' },
		{ label: '(GMT-08:00) Pacific Time (US & Canada)', value: 'PT' },
		{ label: '(GMT+00:00) UTC', value: 'UTC' },
		{ label: '(GMT+01:00) London', value: 'GMT+1' }
	];

	const isNarrow = useMediaQuery(() => '(max-width: 768px)');
	// Mobile is a master→detail drill-down: 'nav' shows the menu, 'detail' shows
	// the selected section with a back button. Desktop shows both side-by-side.
	let mobileView = $state<'nav' | 'detail'>('nav');
	let activeNav = $state('Personal information');
	let activeTab = $state('login');
	let readReceipts = $state(true);
	let searchEngines = $state(true);
	let showCity = $state(true);
	let showTripType = $state(true);
	let showStayLength = $state(true);
	let showServices = $state(true);
	let aiFeatures = $state(true);

	let expandedRow = $state<string | null>(null);
	let language = $state('en-CA');
	let currency = $state('CAD');
	let timezone = $state('ET');

	let legalName = $state('Alex Johnson');
	let preferredName = $state('');
	let email = $state('a***n@example.com');
	let phone = $state('+1 ***-***-0123');
	let address = $state('');
	let mailingAddress = $state('');
	let emergencyContact = $state('Provided');

	// Selecting a nav item also drills into the detail view on mobile.
	const selectNav = (label: string) => {
		activeNav = label;
		mobileView = 'detail';
	};
</script>

{#snippet infoRowItem(label: string, value: string, action: string)}
	<HStack hAlign="between" vAlign="start" style={rowPadding}>
		<VStack gap={0}>
			<Text type="body" weight="semibold" display="block">{label}</Text>
			<Text type="supporting" color="secondary" display="block">{value}</Text>
		</VStack>
		{#if action}
			<Link href="#">{action}</Link>
		{/if}
	</HStack>
	<Divider />
{/snippet}

{#snippet expandableRow(
	label: string,
	value: string,
	children: Snippet,
	isExpanded: boolean,
	onEdit: () => void,
	onCancel: () => void,
	onSave: () => void
)}
	{#if isExpanded}
		<VStack gap={4} style={rowPadding}>
			<Text type="body" weight="semibold" display="block">{label}</Text>
			{@render children()}
			<HStack gap={2}>
				<Button label="Save" variant="primary" onclick={onSave} />
				<Button label="Cancel" variant="ghost" onclick={onCancel} />
			</HStack>
		</VStack>
	{:else}
		<HStack hAlign="between" vAlign="start" style={rowPadding}>
			<VStack gap={0}>
				<Text type="body" weight="semibold" display="block">{label}</Text>
				<Text type="supporting" color="secondary" display="block">{value}</Text>
			</VStack>
			<Link
				href="#"
				onclick={(e) => {
					e.preventDefault();
					onEdit();
				}}
			>
				Edit
			</Link>
		</HStack>
	{/if}
	<Divider />
{/snippet}

{#snippet chevronIcon()}<Icon icon={ChevronRightIcon} size="sm" color="secondary" />{/snippet}
{#snippet hostingToolsIcon()}<Icon icon={WrenchScrewdriverIcon} />{/snippet}
{#snippet backIcon()}<Icon icon={ArrowLeftIcon} size="sm" />{/snippet}

{#snippet navList()}
	<VStack gap={4} style={sideNavPadding}>
		<Heading level={2} style={sideNavHeading}>Account settings</Heading>
		<List density="spacious">
			{#each NAV_ITEMS as item (item.label)}
				{#snippet navIcon()}<Icon icon={item.icon} />{/snippet}
				<ListItem
					label={item.label}
					startContent={navIcon}
					endContent={isNarrow.matches ? chevronIcon : undefined}
					isSelected={!isNarrow.matches && activeNav === item.label}
					onclick={() => selectNav(item.label)}
				/>
			{/each}
		</List>
		<Divider />
		<List density="spacious">
			<ListItem
				label="Professional hosting tools"
				startContent={hostingToolsIcon}
				onclick={() => {}}
			/>
		</List>
	</VStack>
{/snippet}

{#snippet legalNameInput()}
	<TextInput
		label="Legal name"
		isLabelHidden
		value={legalName}
		onChange={(value) => (legalName = value)}
	/>
{/snippet}

{#snippet preferredNameInput()}
	<TextInput
		label="Preferred first name"
		isLabelHidden
		value={preferredName}
		onChange={(value) => (preferredName = value)}
	/>
{/snippet}

{#snippet emailInput()}
	<TextInput
		label="Email address"
		isLabelHidden
		value={email}
		onChange={(value) => (email = value)}
	/>
{/snippet}

{#snippet phoneInput()}
	<TextInput
		label="Phone number"
		isLabelHidden
		value={phone}
		onChange={(value) => (phone = value)}
	/>
{/snippet}

{#snippet addressInput()}
	<TextInput
		label="Residential address"
		isLabelHidden
		value={address}
		onChange={(value) => (address = value)}
	/>
{/snippet}

{#snippet mailingAddressInput()}
	<TextInput
		label="Mailing address"
		isLabelHidden
		value={mailingAddress}
		onChange={(value) => (mailingAddress = value)}
	/>
{/snippet}

{#snippet emergencyContactInput()}
	<TextInput
		label="Emergency contact"
		isLabelHidden
		value={emergencyContact}
		onChange={(value) => (emergencyContact = value)}
	/>
{/snippet}

{#snippet languageSelector()}
	<Selector
		label="Language"
		isLabelHidden
		size="lg"
		value={language}
		onChange={(value) => (language = value)}
		options={LANGUAGES}
	/>
{/snippet}

{#snippet currencySelector()}
	<Selector
		label="Currency"
		isLabelHidden
		size="lg"
		value={currency}
		onChange={(value) => (currency = value)}
		options={CURRENCIES}
	/>
{/snippet}

{#snippet timezoneSelector()}
	<Selector
		label="Time zone"
		isLabelHidden
		size="lg"
		value={timezone}
		onChange={(value) => (timezone = value)}
		options={TIMEZONES}
	/>
{/snippet}

{#snippet mobileNavContent()}
	<LayoutContent padding={2}>{@render navList()}</LayoutContent>
{/snippet}

{#snippet start()}
	<LayoutPanel hasDivider padding={0}>{@render navList()}</LayoutPanel>
{/snippet}

{#snippet toolbarStart()}
	<Button
		label="Back to Account settings"
		variant="ghost"
		size="sm"
		isIconOnly
		icon={backIcon}
		onclick={() => (mobileView = 'nav')}
	/>
	<Heading level={2}>{SECTION_TITLES[activeNav]}</Heading>
{/snippet}

{#snippet content()}
	<LayoutContent padding={4}>
		<VStack gap={0}>
			<!-- Mobile detail view: a back button sits beside the section title
			     (the per-section headings below are hidden on mobile). Toolbar's
			     start slot edge-compensates the ghost button so its icon aligns
			     flush with the content edge. -->
			{#if isNarrow.matches}
				<Toolbar
					label={`Back to Account settings — ${SECTION_TITLES[activeNav]}`}
					gap={2}
					startContent={toolbarStart}
				/>
			{/if}
			{#if activeNav === 'Login & security'}
				<VStack gap={6}>
					{#if !isNarrow.matches}
						<Heading level={2}>Login &amp; security</Heading>
					{/if}

					<TabList value={activeTab} onChange={(value) => (activeTab = value)} hasDivider>
						<Tab value="login" label="Login" />
						<Tab value="shared" label="Shared access" />
					</TabList>

					{#if activeTab === 'login'}
						<VStack gap={8}>
							<VStack gap={0}>
								<Heading level={3}>Login</Heading>
								<Divider />
								{#each LOGIN_ROWS as row (row.label)}
									{@render infoRowItem(row.label, row.value, row.action)}
								{/each}
							</VStack>

							<VStack gap={0}>
								<Heading level={3}>Social accounts</Heading>
								<Divider />
								{#each SOCIAL_ROWS as row (row.label)}
									{@render infoRowItem(row.label, row.value, row.action)}
								{/each}
							</VStack>

							<VStack gap={0}>
								<Heading level={3}>Device history</Heading>
								<Divider />
								{#each DEVICE_ROWS as device, i (i)}
									<HStack gap={3} vAlign="start" style={rowPadding}>
										<Icon icon={ComputerDesktopIcon} />
										<StackItem size="fill">
											<VStack gap={0}>
												<HStack gap={2} vAlign="center">
													<Text type="body" weight="semibold">{device.label}</Text>
													{#if device.badge}
														<Badge label={device.badge} />
													{/if}
												</HStack>
												<Text type="supporting" color="secondary" display="block">
													{device.location}
												</Text>
											</VStack>
										</StackItem>
										{#if device.action}
											<Link href="#">{device.action}</Link>
										{/if}
									</HStack>
								{/each}
								<Divider />
							</VStack>

							<VStack gap={0}>
								<Heading level={3}>Account</Heading>
								<Divider />
								<HStack hAlign="between" vAlign="start" style={rowPadding}>
									<VStack gap={0}>
										<Text type="body" weight="semibold" display="block">
											Deactivate your account
										</Text>
										<Text type="supporting" color="secondary" display="block">
											This action cannot be undone
										</Text>
									</VStack>
									<Link href="#">Deactivate</Link>
								</HStack>
								<Divider />
							</VStack>
						</VStack>
					{/if}

					{#if activeTab === 'shared'}
						<VStack gap={8}>
							<VStack gap={2}>
								<Heading level={3}>Shared access</Heading>
								<Divider />
								<Text type="body" color="secondary">
									Review each request carefully before approving access. We'll email your
									employee or co-worker a 4-digit code that lets them log into your account
									with their trusted device.
								</Text>
							</VStack>

							<Card variant="muted">
								<HStack gap={4} vAlign="start">
									<Center width={48} height={48} style={iconBox}>
										<Icon icon={LockClosedIcon} />
									</Center>
									<VStack gap={1}>
										<Text type="body" weight="bold">
											Adding devices from people you trust
										</Text>
										<Text type="body" color="secondary">
											When you approve a request, you grant someone full access to your
											account. They'll be able to change reservations and send messages on
											your behalf.
										</Text>
									</VStack>
								</HStack>
							</Card>
						</VStack>
					{/if}
				</VStack>
			{/if}

			{#if activeNav === 'Languages & currency'}
				<VStack gap={6}>
					{#if !isNarrow.matches}
						<Heading level={2}>Languages &amp; currency</Heading>
					{/if}
					<VStack gap={0}>
						{@render expandableRow(
							'Preferred language',
							LANGUAGES.find((l) => l.value === language)?.label ?? language,
							languageSelector,
							expandedRow === 'language',
							() => (expandedRow = 'language'),
							() => (expandedRow = null),
							() => (expandedRow = null)
						)}
						{@render expandableRow(
							'Preferred currency',
							CURRENCIES.find((c) => c.value === currency)?.label ?? currency,
							currencySelector,
							expandedRow === 'currency',
							() => (expandedRow = 'currency'),
							() => (expandedRow = null),
							() => (expandedRow = null)
						)}
						{@render expandableRow(
							'Time zone',
							TIMEZONES.find((t) => t.value === timezone)?.label ?? timezone,
							timezoneSelector,
							expandedRow === 'timezone',
							() => (expandedRow = 'timezone'),
							() => (expandedRow = null),
							() => (expandedRow = null)
						)}
					</VStack>
				</VStack>
			{/if}

			{#if activeNav === 'Personal information'}
				<VStack gap={6}>
					{#if !isNarrow.matches}
						<Heading level={2}>Personal info</Heading>
					{/if}
					<VStack gap={0}>
						{@render expandableRow(
							'Legal name',
							legalName,
							legalNameInput,
							expandedRow === 'legalName',
							() => (expandedRow = 'legalName'),
							() => (expandedRow = null),
							() => (expandedRow = null)
						)}
						{@render expandableRow(
							'Preferred first name',
							preferredName || 'Not provided',
							preferredNameInput,
							expandedRow === 'preferredName',
							() => (expandedRow = 'preferredName'),
							() => (expandedRow = null),
							() => (expandedRow = null)
						)}
						{@render expandableRow(
							'Email address',
							email,
							emailInput,
							expandedRow === 'email',
							() => (expandedRow = 'email'),
							() => (expandedRow = null),
							() => (expandedRow = null)
						)}
						{@render expandableRow(
							'Phone number',
							phone,
							phoneInput,
							expandedRow === 'phone',
							() => (expandedRow = 'phone'),
							() => (expandedRow = null),
							() => (expandedRow = null)
						)}
						{@render infoRowItem('Identity verification', 'Verified', '')}
						{@render expandableRow(
							'Residential address',
							address || 'Not provided',
							addressInput,
							expandedRow === 'address',
							() => (expandedRow = 'address'),
							() => (expandedRow = null),
							() => (expandedRow = null)
						)}
						{@render expandableRow(
							'Mailing address',
							mailingAddress || 'Not provided',
							mailingAddressInput,
							expandedRow === 'mailingAddress',
							() => (expandedRow = 'mailingAddress'),
							() => (expandedRow = null),
							() => (expandedRow = null)
						)}
						{@render expandableRow(
							'Emergency contact',
							emergencyContact,
							emergencyContactInput,
							expandedRow === 'emergencyContact',
							() => (expandedRow = 'emergencyContact'),
							() => (expandedRow = null),
							() => (expandedRow = null)
						)}
					</VStack>

					<Card padding={4}>
						<VStack gap={4}>
							<HStack gap={3} vAlign="start">
								<Center width={48} height={48} style={iconBox}>
									<Icon icon={LockClosedIcon} />
								</Center>
								<VStack gap={0}>
									<Text type="body" weight="semibold" display="block">
										Why isn't my info shown here?
									</Text>
									<Text type="supporting" color="secondary" display="block">
										We're hiding some account details to protect your identity.
									</Text>
								</VStack>
							</HStack>
							<Divider />
							<HStack gap={3} vAlign="start">
								<Center width={48} height={48} style={iconBox}>
									<Icon icon={PencilSquareIcon} />
								</Center>
								<VStack gap={0}>
									<Text type="body" weight="semibold" display="block">
										Which details can be edited?
									</Text>
									<Text type="supporting" color="secondary" display="block">
										Contact info and personal details can be edited. If this info was used to
										verify your identity, you'll need to get verified again the next time you
										book—or to continue hosting.
									</Text>
								</VStack>
							</HStack>
							<Divider />
							<HStack gap={3} vAlign="start">
								<Center width={48} height={48} style={iconBox}>
									<Icon icon={ShareIcon} />
								</Center>
								<VStack gap={0}>
									<Text type="body" weight="semibold" display="block">
										What info is shared with others?
									</Text>
									<Text type="supporting" color="secondary" display="block">
										We only release contact information after a reservation is confirmed.
									</Text>
								</VStack>
							</HStack>
						</VStack>
					</Card>
				</VStack>
			{/if}

			{#if activeNav === 'Privacy'}
				<VStack gap={6}>
					{#if !isNarrow.matches}
						<Heading level={2}>Privacy</Heading>
					{/if}

					<VStack gap={8}>
						<VStack gap={0}>
							<Heading level={3}>Messages</Heading>
							<VStack style={rowPadding}>
								<Switch
									label="Show people when I've read their messages."
									value={readReceipts}
									onChange={(checked) => (readReceipts = checked)}
									labelPosition="start"
									labelSpacing="spread"
								/>
							</VStack>
							<HStack hAlign="between" vAlign="center" style={rowPadding}>
								<Text type="body" weight="semibold">Blocked people</Text>
								<Link href="#">View</Link>
							</HStack>
							<Divider />
						</VStack>

						<VStack gap={0}>
							<Heading level={3}>Listings</Heading>
							<VStack style={rowPadding}>
								<Switch
									label="Include my listing(s) in search engines"
									description="Turning this on means search engines, like Google, will display your listing page(s) in search results."
									value={searchEngines}
									onChange={(checked) => (searchEngines = checked)}
									labelPosition="start"
									labelSpacing="spread"
								/>
							</VStack>
							<Divider />
						</VStack>

						<VStack gap={4}>
							<Heading level={3}>Reviews</Heading>
							<Text type="supporting" color="secondary">
								Choose what's shared when you write a review.
								<Link href="#" type="supporting">Learn more</Link>
							</Text>
							<VStack gap={4}>
								<Switch
									label="Show my home city and country"
									description="Ex: City and country"
									value={showCity}
									onChange={(checked) => (showCity = checked)}
									labelPosition="start"
									labelSpacing="spread"
								/>
								<Switch
									label="Show my trip type"
									description="Ex: Stayed with kids or pets"
									value={showTripType}
									onChange={(checked) => (showTripType = checked)}
									labelPosition="start"
									labelSpacing="spread"
								/>
								<Switch
									label="Show my length of stay"
									description="Ex: A few nights, about a week, etc."
									value={showStayLength}
									onChange={(checked) => (showStayLength = checked)}
									labelPosition="start"
									labelSpacing="spread"
								/>
								<Switch
									label="Show my booked services"
									description="Ex: Gourmet brunch or tasting menu"
									value={showServices}
									onChange={(checked) => (showServices = checked)}
									labelPosition="start"
									labelSpacing="spread"
								/>
							</VStack>
							<Divider />
						</VStack>

						<VStack gap={4}>
							<Heading level={3}>Data privacy</Heading>
							<Card>
								<HStack hAlign="between" vAlign="center">
									<Text type="body">Request my personal data</Text>
									<Link href="#">Request</Link>
								</HStack>
							</Card>
							<Switch
								label="Help improve AI-powered features"
								description="When this is on, we use your data to develop and improve AI models."
								value={aiFeatures}
								onChange={(checked) => (aiFeatures = checked)}
								labelPosition="start"
								labelSpacing="spread"
							/>
							<Card>
								<HStack hAlign="between" vAlign="center">
									<Text type="body">Delete my account</Text>
									<Link href="#">Delete</Link>
								</HStack>
							</Card>
							<Card variant="muted">
								<HStack gap={4} vAlign="start">
									<Center width={48} height={48} style={iconBox}>
										<Icon icon={ShieldCheckIcon} />
									</Center>
									<VStack gap={1}>
										<Text type="body" weight="bold">Committed to privacy</Text>
										<Text type="supporting" color="secondary">
											We're committed to keeping your data protected. See details in our
											<Link href="#" type="supporting">Privacy Policy</Link>.
										</Text>
									</VStack>
								</HStack>
							</Card>
						</VStack>
					</VStack>
				</VStack>
			{/if}
		</VStack>
	</LayoutContent>
{/snippet}

<!-- Mobile, nav view: show only the menu (full width, no sidebar slot). -->
{#if isNarrow.matches && mobileView === 'nav'}
	<Layout height="fill" style={fillViewport} content={mobileNavContent} />
{:else}
	<Layout
		height="fill"
		contentWidth={1200}
		style={fillViewport}
		start={isNarrow.matches ? undefined : start}
		{content}
	/>
{/if}
