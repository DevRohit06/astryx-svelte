<!--
	Ported from upstream's `assets/templates/pages/settings/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	The one Heroicon here is upstream's own, from `@fvilers/heroicons-svelte` —
	the Heroicons set built for Svelte 5, keeping upstream's component names and
	entry points.

	`Typeahead.startIcon` is `IconName | Snippet` here where upstream's is
	`ReactNode | IconType`, so the component goes through the `Snippet` arm
	rather than being passed directly. That arm renders raw, so the snippet
	supplies the `size="sm" color="secondary"` that `Typeahead` applies for the
	`IconName` arm — the same values, and the same rendering as upstream.
-->
<script lang="ts">
	import {
		Button,
		CheckboxInput,
		Divider,
		Grid,
		HStack,
		Heading,
		Icon,
		Layout,
		LayoutContent,
		LayoutHeader,
		LayoutPanel,
		List,
		ListItem,
		StackItem,
		Tab,
		TabList,
		Text,
		TextInput,
		Typeahead,
		VStack,
		useMediaQuery,
		type SearchSource,
		type SearchableItem
	} from '@astryx-svelte/core';
	import { MagnifyingGlassIcon } from '@fvilers/heroicons-svelte/24/outline';

	const NAV_ITEMS = ['Profile', 'Account', 'Members', 'Billing', 'Invoices', 'API'];

	const SETTINGS_ITEMS: SearchableItem[] = [
		{ id: '1', label: 'Username' },
		{ id: '2', label: 'First name' },
		{ id: '3', label: 'Last name' },
		{ id: '4', label: 'Email address' },
		{ id: '5', label: 'Change password' },
		{ id: '6', label: 'Data Export Access' },
		{ id: '7', label: 'Allow Admin to Add Members' },
		{ id: '8', label: 'Two-Factor Authentication' }
	];

	const settingsSearchSource: SearchSource<SearchableItem> = {
		search: (query: string) =>
			SETTINGS_ITEMS.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
		bootstrap: () => SETTINGS_ITEMS
	};

	const isNarrow = useMediaQuery(() => '(max-width: 768px)');
	let activeNav = $state('Profile');
	let username = $state('nicol43');
	let firstName = $state('Stephanie');
	let lastName = $state('Nicol');
	let email = $state('stephanie_nicol@mail.com');
	let currentPw = $state('password123');
	let newPw = $state('password123');
	let confirmPw = $state('password123');
	let dataExport = $state(false);
	let adminMembers = $state(false);
	let twoFactor = $state(false);
	let searchValue = $state<SearchableItem | null>(null);
</script>

{#snippet searchIcon()}<Icon icon={MagnifyingGlassIcon} size="sm" color="secondary" />{/snippet}

{#snippet header()}
	<LayoutHeader hasDivider>
		<HStack vAlign="center">
			<StackItem size="fill">
				<Heading level={1}>Settings</Heading>
			</StackItem>
			<Typeahead
				label="Search"
				isLabelHidden
				placeholder="Search settings..."
				searchSource={settingsSearchSource}
				value={searchValue}
				onChange={(item) => (searchValue = item)}
				hasEntriesOnFocus
				startIcon={searchIcon}
			/>
		</HStack>
	</LayoutHeader>
{/snippet}

{#snippet start()}
	<LayoutPanel hasDivider={false} width={260} padding={2}>
		<List density="balanced">
			{#each NAV_ITEMS as item (item)}
				<ListItem
					label={item}
					isSelected={activeNav === item}
					onclick={() => (activeNav = item)}
				/>
			{/each}
		</List>
	</LayoutPanel>
{/snippet}

{#snippet content()}
	<LayoutContent padding={4}>
		<VStack gap={4}>
			<!-- Mobile: the sidebar nav collapses to a horizontal, centered
			     tab bar above the content. -->
			{#if isNarrow.matches}
				<VStack hAlign="center">
					<TabList value={activeNav} onChange={(value) => (activeNav = value)}>
						{#each NAV_ITEMS as item (item)}
							<Tab value={item} label={item} />
						{/each}
					</TabList>
				</VStack>
			{/if}
			<Grid columns={{ minWidth: 320 }} gap={10}>
				<VStack gap={1}>
					<Heading level={3}>Basic information</Heading>
					<Text type="supporting" color="secondary">
						View and update your personal details and account information.
					</Text>
				</VStack>
				<VStack gap={4}>
					<TextInput label="Username" value={username} onChange={(value) => (username = value)} />
					<TextInput
						label="First name"
						value={firstName}
						onChange={(value) => (firstName = value)}
					/>
					<TextInput label="Last name" value={lastName} onChange={(value) => (lastName = value)} />
					<TextInput label="Email address" value={email} onChange={(value) => (email = value)} />
					<HStack>
						<Button label="Save" variant="primary" />
					</HStack>
				</VStack>
			</Grid>

			<Divider />

			<Grid columns={{ minWidth: 320 }} gap={10}>
				<VStack gap={1}>
					<Heading level={3}>Change password</Heading>
					<Text type="supporting" color="secondary">
						Update your password to keep your account secure.
					</Text>
				</VStack>
				<VStack gap={4}>
					<TextInput
						label="Verify current password"
						type="password"
						value={currentPw}
						onChange={(value) => (currentPw = value)}
					/>
					<TextInput
						label="New password"
						type="password"
						value={newPw}
						onChange={(value) => (newPw = value)}
					/>
					<TextInput
						label="Confirm password"
						type="password"
						value={confirmPw}
						onChange={(value) => (confirmPw = value)}
					/>
					<HStack>
						<Button label="Save" variant="primary" />
					</HStack>
				</VStack>
			</Grid>

			<Divider />

			<Grid columns={{ minWidth: 320 }} gap={10}>
				<VStack gap={1}>
					<Heading level={3}>Advanced settings</Heading>
					<Text type="supporting" color="secondary">
						Configure detailed account preferences and security options.
					</Text>
				</VStack>
				<VStack gap={5}>
					<CheckboxInput
						label="Data Export Access"
						description="Allow export of personal data and backups."
						value={dataExport}
						onChange={(checked) => (dataExport = checked)}
					/>
					<CheckboxInput
						label="Allow Admin to Add Members"
						description="Admins can invite and manage members."
						value={adminMembers}
						onChange={(checked) => (adminMembers = checked)}
					/>
					<CheckboxInput
						label="Enable Two-Factor Authentication"
						description="Require 2FA for added account security."
						value={twoFactor}
						onChange={(checked) => (twoFactor = checked)}
					/>
					<HStack>
						<Button label="Save" variant="primary" />
					</HStack>
				</VStack>
			</Grid>
		</VStack>
	</LayoutContent>
{/snippet}

<Layout
	height="fill"
	contentWidth={1440}
	{header}
	start={isNarrow.matches ? undefined : start}
	{content}
/>
