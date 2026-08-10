<!--
	Ported from upstream's `assets/templates/pages/shell-nav/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Icons are Heroicons, upstream's own set: `@fvilers/heroicons-svelte` is that
	set built for Svelte 5, and it keeps upstream's component names and its
	`24/outline` / `20/solid` / `24/solid` entry points. The imports below are
	upstream's with the package name changed, so each glyph is the one upstream
	draws rather than a stand-in from core's 28-name `Icon` registry — that
	registry names theme-swappable UI affordances and was never meant to carry
	arbitrary artwork.

	`TreeListItemData.label` is `string | Snippet` here, and the `Snippet` arm
	takes no arguments — so upstream's `label={<Text maxLines={1}>{id}</Text>}`
	would need one snippet per node. The string arm is used instead; the visible
	difference is that a name too long for the sidebar wraps rather than
	clamping to one line.
-->
<script lang="ts">
	import {
		AppShell,
		Button,
		Card,
		CommandPalette,
		Divider,
		DropdownMenu,
		DropdownMenuItem,
		HStack,
		Icon,
		IconButton,
		Kbd,
		Layout,
		LayoutContent,
		LayoutHeader,
		SideNav,
		Stack,
		TextInput,
		TopNav,
		TreeList,
		VStack,
		createStaticSource,
		type TreeListItemData
	} from '@astryx-svelte/core';
	import {
		DocumentTextIcon,
		FolderIcon,
		MagnifyingGlassIcon,
		PlayIcon
	} from '@fvilers/heroicons-svelte/24/outline';

	const noop = () => {};

	const folder = (
		id: string,
		children: TreeListItemData[],
		isExpanded = true
	): TreeListItemData => ({
		id,
		label: id,
		startContent: folderIcon,
		isExpanded,
		children
	});

	const file = (id: string, isSelected = false): TreeListItemData => ({
		id,
		label: id,
		startContent: documentIcon,
		isSelected
	});

	const FILE_TREE: TreeListItemData[] = [
		folder('src', [
			folder('components', [
				file('AppShell.tsx', true),
				file('TopNav.tsx'),
				file('SideNav.tsx')
			]),
			folder('hooks', [file('useTheme.ts'), file('useResizable.ts')]),
			file('index.tsx'),
			file('App.tsx')
		]),
		folder('public', [file('favicon.ico'), file('robots.txt')], false),
		file('package.json'),
		file('tsconfig.json'),
		file('README.md')
	];

	// Each menu is split into groups; groups are separated by a divider.
	// `[label, shortcut]` — the shortcut renders as a single combined Kbd
	// (e.g. ⌘N); an empty shortcut renders no Kbd.
	type MenuEntry = [label: string, shortcut: string];

	const MENU_WIDTH = 280;

	const MENUS: { label: string; groups: MenuEntry[][] }[] = [
		{
			label: 'File',
			groups: [
				[
					['New File', '⌘N'],
					['New Window', '⇧⌘N']
				],
				[
					['Open...', '⌘O'],
					['Save', '⌘S'],
					['Save As...', '⇧⌘S']
				],
				[['Close Editor', '⌘W']]
			]
		},
		{
			label: 'Edit',
			groups: [
				[
					['Undo', '⌘Z'],
					['Redo', '⇧⌘Z']
				],
				[
					['Cut', '⌘X'],
					['Copy', '⌘C'],
					['Paste', '⌘V']
				],
				[['Find', '⌘F']]
			]
		},
		{
			label: 'View',
			groups: [
				[['Command Palette', '⇧⌘P']],
				[
					['Explorer', '⇧⌘E'],
					['Search', '⇧⌘F']
				],
				[
					['Toggle Terminal', '⌃`'],
					['Zen Mode', '⌘K']
				]
			]
		},
		{
			label: 'Window',
			groups: [
				[
					['Minimize', '⌘M'],
					['Zoom', '']
				],
				[
					['Next Tab', '⌃⇥'],
					['Previous Tab', '⌃⇧⇥']
				],
				[['Bring All to Front', '']]
			]
		},
		{
			label: 'Help',
			groups: [
				[
					['Documentation', ''],
					['Release Notes', ''],
					['Report Issue', ''],
					['About', '']
				]
			]
		}
	];

	const CODE_LINES = [
		'38%',
		'62%',
		'54%',
		'0%',
		'46%',
		'70%',
		'58%',
		'34%',
		'0%',
		'50%',
		'66%',
		'42%',
		'60%',
		'28%'
	];

	const EDITOR_TABS = ['AppShell.tsx', 'TopNav.tsx', 'theme.ts'];

	const COMMANDS = [
		{ id: 'new-file', label: 'New File' },
		{ id: 'open-file', label: 'Open File…' },
		{ id: 'save-all', label: 'Save All' },
		{ id: 'find-in-files', label: 'Find in Files' },
		{ id: 'toggle-terminal', label: 'Toggle Terminal' },
		{ id: 'go-to-symbol', label: 'Go to Symbol…' },
		{ id: 'appshell', label: 'AppShell.tsx' },
		{ id: 'topnav', label: 'TopNav.tsx' },
		{ id: 'sidenav', label: 'SideNav.tsx' },
		{ id: 'use-theme', label: 'useTheme.ts' },
		{ id: 'theme', label: 'theme.ts' }
	];

	let isPaletteOpen = $state(false);
	const searchSource = createStaticSource(COMMANDS);

	$effect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				isPaletteOpen = true;
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});
</script>

{#snippet folderIcon()}<Icon icon={FolderIcon} size="xsm" />{/snippet}
{#snippet documentIcon()}<Icon icon={DocumentTextIcon} size="xsm" />{/snippet}

{#snippet startContent()}
	{#each MENUS as menu (menu.label)}
		<DropdownMenu
			button={{ label: menu.label, variant: 'ghost', size: 'sm' }}
			hasChevron={false}
			menuWidth={MENU_WIDTH}
		>
			{#each menu.groups as group, gi (gi)}
				{#if gi > 0}<Divider />{/if}
				{#each group as [label, shortcut] (label)}
					{#snippet shortcutKbd()}<Kbd keys={shortcut} />{/snippet}
					<DropdownMenuItem
						{label}
						onClick={noop}
						endContent={shortcut ? shortcutKbd : undefined}
					/>
				{/each}
			{/each}
		</DropdownMenu>
	{/each}
{/snippet}

{#snippet playIcon()}<Icon icon={PlayIcon} size="sm" />{/snippet}
<!-- `TextInput.startIcon` is a `Snippet` here where upstream's is an `IconType`. -->
{#snippet magnifyingGlassIcon()}<Icon icon={MagnifyingGlassIcon} size="sm" />{/snippet}

{#snippet endContent()}
	<Stack onclick={() => (isPaletteOpen = true)}>
		<TextInput
			label="Search files and commands"
			isLabelHidden
			size="sm"
			width={240}
			startIcon={magnifyingGlassIcon}
			placeholder="Search files and commands…"
			value=""
			onChange={() => {}}
		/>
	</Stack>
	<IconButton label="Run project" tooltip="Run" variant="ghost" icon={playIcon} />
	<Button label="Share" variant="secondary" />
{/snippet}

{#snippet topNav()}
	<TopNav label="Astryx Studio menu bar" {startContent} {endContent} />
{/snippet}

{#snippet sideNav()}
	<SideNav resizable={{ defaultWidth: 240, minWidth: 180, maxWidth: 400 }}>
		<TreeList items={FILE_TREE} density="compact" />
	</SideNav>
{/snippet}

{#snippet header()}
	<LayoutHeader hasDivider padding={6}>
		<HStack gap={2}>
			{#each EDITOR_TABS as tab (tab)}
				<Card variant="muted" padding={0} width={132} height={36} />
			{/each}
		</HStack>
	</LayoutHeader>
{/snippet}

{#snippet content()}
	<LayoutContent padding={6}>
		<VStack gap={2}>
			{#each CODE_LINES as width, i (i)}
				{#if width === '0%'}
					<Card variant="muted" padding={0} width={1} height={14} />
				{:else}
					<HStack gap={3} vAlign="center">
						<Card variant="muted" padding={0} width={20} height={14} />
						<Card variant="muted" padding={0} {width} height={14} />
					</HStack>
				{/if}
			{/each}
		</VStack>
	</LayoutContent>
{/snippet}

<AppShell contentPadding={0} {topNav} {sideNav}>
	<Layout height="fill" {header} {content} />
</AppShell>
<CommandPalette
	isOpen={isPaletteOpen}
	onOpenChange={(isOpen) => (isPaletteOpen = isOpen)}
	{searchSource}
	label="Search files and commands"
	onValueChange={() => (isPaletteOpen = false)}
/>
