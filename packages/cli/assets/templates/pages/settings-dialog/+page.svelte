<!--
	Ported from upstream's `assets/templates/pages/settings-dialog/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Upstream imports Heroicons here rather than inlining the SVGs, so every icon
	is a registry substitution: `UserIcon` → `info`, `LockClosedIcon` → `stop`,
	`ShieldCheckIcon` → `success`, `BellIcon` → `warning`, `DocumentTextIcon` →
	`copy`, `CreditCardIcon` → `viewColumns`, `GlobeAltIcon` → `clock`,
	`BriefcaseIcon` → `calendar`, `WrenchScrewdriverIcon` → `wrench`,
	`ComputerDesktopIcon` → `stop`, `PencilSquareIcon` → `copy`, `ShareIcon` →
	`externalLink`. Twelve glyphs will not fit a 28-name *semantic* registry
	without collisions: `stop` stands in for both the padlock and the desktop,
	and `copy` for both the document and the pencil. The sidebar's eight stay
	distinct from one another, which is where a collision would actually read as
	a mistake. Only `wrench` is close to a true match. Retires with the icon
	registry (TODO.md).

	Upstream's `iconBox`/`headerSticky`/`contentMaxWidth`/`sideNavHeading`/
	`dialogHeight` are `CSSProperties` objects handed to `style`; Svelte's `style`
	prop is a string, so they are the same declarations in the same order, under
	upstream's names. Their comments are transcribed with them.

	`ExpandableRow` and `InfoRowItem` are upstream components. Neither holds
	state, so both become parameterised snippets — a page template is a single
	`+page.svelte`, since the CLI copies `PAGE_SOURCE_FILE` and nothing beside it.
	`ExpandableRow`'s `children: ReactNode` is a `Snippet` parameter, so each
	row's field is declared as its own snippet and passed in.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		Badge,
		Button,
		Card,
		Center,
		Dialog,
		DialogHeader,
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
		VStack,
		type IconName
	} from '@astryx-svelte/core';

	const iconBox =
		'border-radius: var(--radius-container); ' +
		'background-color: var(--color-background-surface); flex-shrink: 0;';
	// Sticky dialog header bar — no Astryx prop for sticky/background/z-index.
	// Inline + block padding comes from the parent LayoutContent `padding`.
	const headerSticky =
		'position: sticky; top: 0; background-color: var(--color-background-surface); z-index: 1;';
	// No `maxWidth` prop on VStack — width only. Inline padding comes from
	// the parent LayoutContent `padding`.
	const contentMaxWidth = 'max-width: 680px;';
	// Aligns the sidebar heading with list-item label text. No heading margin prop.
	const sideNavHeading = 'margin-inline: var(--spacing-4);';
	const dialogHeight = 'height: 85vh;';

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

	const LOGIN_ROWS = [{ label: 'Password', value: 'Not created', action: 'Create' }];

	const SOCIAL_ROWS = [{ label: 'Google', value: 'Connected', action: 'Disconnect' }];

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

	let isOpen = $state(false);
	let activeNav = $state('Login & security');
	let expandedRow = $state<string | null>(null);

	let language = $state('en-CA');
	let currency = $state('CAD');
	let timezone = $state('ET');
	let activeTab = $state('login');

	let legalName = $state('Alex Johnson');
	let preferredName = $state('');
	let email = $state('a***n@example.com');
	let phone = $state('+1 ***-***-0123');
	let address = $state('');
	let mailingAddress = $state('');
	let emergencyContact = $state('Provided');
	let readReceipts = $state(true);
	let searchEngines = $state(true);
	let showCity = $state(true);
	let showTripType = $state(true);
	let showStayLength = $state(true);
	let showServices = $state(true);
	let aiFeatures = $state(true);

	const handleEdit = (row: string) => (expandedRow = row);
	const handleCancel = () => (expandedRow = null);
	const handleSave = () => (expandedRow = null);
</script>

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
		<VStack gap={4}>
			<Text type="body" weight="semibold" display="block">{label}</Text>
			{@render children()}
			<HStack gap={2}>
				<Button label="Save" variant="primary" onclick={onSave} />
				<Button label="Cancel" variant="ghost" onclick={onCancel} />
			</HStack>
		</VStack>
	{:else}
		<HStack hAlign="between" vAlign="start">
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

{#snippet infoRowItem(label: string, value: string, action: string)}
	<HStack hAlign="between" vAlign="start">
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

{#snippet hostingToolsIcon()}<Icon icon="wrench" />{/snippet}

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

{#snippet triggerContent()}
	<LayoutContent padding={0}>
		<Center height="80vh">
			<Button label="Open settings" variant="primary" onclick={() => (isOpen = true)} />
		</Center>
	</LayoutContent>
{/snippet}

{#snippet dialogStart()}
	<LayoutPanel width={280} hasDivider role="navigation" padding={3}>
		<VStack gap={4}>
			<Heading level={2} style={sideNavHeading}>Account settings</Heading>
			<List density="spacious">
				{#each NAV_ITEMS as item (item.label)}
					{#snippet navIcon()}<Icon icon={item.icon} />{/snippet}
					<ListItem
						label={item.label}
						startContent={navIcon}
						isSelected={activeNav === item.label}
						onclick={() => {
							activeNav = item.label;
							expandedRow = null;
						}}
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
	</LayoutPanel>
{/snippet}

{#snippet dialogContent()}
	<LayoutContent isScrollable padding={6}>
		<VStack gap={6}>
			<VStack style={headerSticky}>
				<DialogHeader
					title={activeNav === 'Personal information' ? 'Personal info' : activeNav}
					onOpenChange={(open) => (isOpen = open)}
					hasDivider={false}
				/>
			</VStack>
			<VStack gap={0} style={contentMaxWidth}>
				{#if activeNav === 'Personal information'}
					<VStack gap={6}>
						<VStack gap={4}>
							{@render expandableRow(
								'Legal name',
								legalName,
								legalNameInput,
								expandedRow === 'legalName',
								() => handleEdit('legalName'),
								handleCancel,
								handleSave
							)}
							{@render expandableRow(
								'Preferred first name',
								preferredName || 'Not provided',
								preferredNameInput,
								expandedRow === 'preferredName',
								() => handleEdit('preferredName'),
								handleCancel,
								handleSave
							)}
							{@render expandableRow(
								'Email address',
								email,
								emailInput,
								expandedRow === 'email',
								() => handleEdit('email'),
								handleCancel,
								handleSave
							)}
							{@render expandableRow(
								'Phone number',
								phone,
								phoneInput,
								expandedRow === 'phone',
								() => handleEdit('phone'),
								handleCancel,
								handleSave
							)}
							{@render infoRowItem('Identity verification', 'Verified', '')}
							{@render expandableRow(
								'Residential address',
								address || 'Not provided',
								addressInput,
								expandedRow === 'address',
								() => handleEdit('address'),
								handleCancel,
								handleSave
							)}
							{@render expandableRow(
								'Mailing address',
								mailingAddress || 'Not provided',
								mailingAddressInput,
								expandedRow === 'mailingAddress',
								() => handleEdit('mailingAddress'),
								handleCancel,
								handleSave
							)}
							{@render expandableRow(
								'Emergency contact',
								emergencyContact,
								emergencyContactInput,
								expandedRow === 'emergencyContact',
								() => handleEdit('emergencyContact'),
								handleCancel,
								handleSave
							)}
						</VStack>

						<Card padding={4}>
							<VStack gap={4}>
								<HStack gap={3} vAlign="start">
									<Center width={48} height={48} style={iconBox}>
										<Icon icon="stop" />
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
										<Icon icon="copy" />
									</Center>
									<VStack gap={0}>
										<Text type="body" weight="semibold" display="block">
											Which details can be edited?
										</Text>
										<Text type="supporting" color="secondary" display="block">
											Contact info and personal details can be edited. If this info was
											used to verify your identity, you'll need to get verified again the
											next time you book—or to continue hosting.
										</Text>
									</VStack>
								</HStack>
								<Divider />
								<HStack gap={3} vAlign="start">
									<Center width={48} height={48} style={iconBox}>
										<Icon icon="externalLink" />
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

				{#if activeNav === 'Login & security'}
					<VStack gap={6}>
						<TabList value={activeTab} onChange={(value) => (activeTab = value)} hasDivider>
							<Tab value="login" label="Login" />
							<Tab value="shared" label="Shared access" />
						</TabList>

						{#if activeTab === 'login'}
							<VStack gap={8}>
								<VStack gap={4}>
									<Heading level={3}>Login</Heading>
									<Divider />
									{#each LOGIN_ROWS as row (row.label)}
										{@render infoRowItem(row.label, row.value, row.action)}
									{/each}
								</VStack>

								<VStack gap={4}>
									<Heading level={3}>Social accounts</Heading>
									<Divider />
									{#each SOCIAL_ROWS as row (row.label)}
										{@render infoRowItem(row.label, row.value, row.action)}
									{/each}
								</VStack>

								<VStack gap={4}>
									<Heading level={3}>Device history</Heading>
									<Divider />
									{#each DEVICE_ROWS as device, i (i)}
										<HStack gap={3} vAlign="start">
											<Icon icon="stop" />
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
										<Divider />
									{/each}
								</VStack>

								<VStack gap={4}>
									<Heading level={3}>Account</Heading>
									<Divider />
									<HStack hAlign="between" vAlign="start">
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
										employee or co-worker a 4-digit code that lets them log into your
										account with their trusted device.
									</Text>
								</VStack>

								<Card variant="muted">
									<HStack gap={4} vAlign="start">
										<Center width={48} height={48} style={iconBox}>
											<Icon icon="stop" />
										</Center>
										<VStack gap={1}>
											<Text type="body" weight="bold">
												Adding devices from people you trust
											</Text>
											<Text type="body" color="secondary">
												When you approve a request, you grant someone full access to your
												account. They'll be able to change reservations and send messages
												on your behalf.
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
						<VStack gap={4}>
							{@render expandableRow(
								'Preferred language',
								LANGUAGES.find((l) => l.value === language)?.label ?? language,
								languageSelector,
								expandedRow === 'language',
								() => handleEdit('language'),
								handleCancel,
								handleSave
							)}
							{@render expandableRow(
								'Preferred currency',
								CURRENCIES.find((c) => c.value === currency)?.label ?? currency,
								currencySelector,
								expandedRow === 'currency',
								() => handleEdit('currency'),
								handleCancel,
								handleSave
							)}
							{@render expandableRow(
								'Time zone',
								TIMEZONES.find((t) => t.value === timezone)?.label ?? timezone,
								timezoneSelector,
								expandedRow === 'timezone',
								() => handleEdit('timezone'),
								handleCancel,
								handleSave
							)}
						</VStack>
					</VStack>
				{/if}

				{#if activeNav === 'Privacy'}
					<VStack gap={6}>
						<VStack gap={8}>
							<VStack gap={4}>
								<Heading level={3}>Messages</Heading>
								<Switch
									label="Show people when I've read their messages."
									value={readReceipts}
									onChange={(checked) => (readReceipts = checked)}
									labelPosition="start"
									labelSpacing="spread"
								/>
								<HStack hAlign="between" vAlign="center">
									<Text type="body" weight="semibold">Blocked people</Text>
									<Link href="#">View</Link>
								</HStack>
								<Divider />
							</VStack>

							<VStack gap={4}>
								<Heading level={3}>Listings</Heading>
								<Switch
									label="Include my listing(s) in search engines"
									description="Turning this on means search engines, like Google, will display your listing page(s) in search results."
									value={searchEngines}
									onChange={(checked) => (searchEngines = checked)}
									labelPosition="start"
									labelSpacing="spread"
								/>
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
											<Icon icon="success" />
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
		</VStack>
	</LayoutContent>
{/snippet}

<Layout content={triggerContent} />

<Dialog
	isOpen={isOpen}
	onOpenChange={(open) => (isOpen = open)}
	width={900}
	maxHeight="85vh"
	padding={0}
	purpose="form"
	style={dialogHeight}
>
	<Layout height="fill" start={dialogStart} content={dialogContent} />
</Dialog>
