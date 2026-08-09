<!--
	Ported from upstream's `assets/templates/pages/file-explorer/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Upstream imports Heroicons here, so every icon is a registry substitution:
	`ChevronLeftIcon` → `chevronLeft`, `ChevronRightIcon` → `chevronRight`,
	`MagnifyingGlassIcon` → `search`, `EllipsisHorizontalIcon` →
	`moreHorizontal` and `ViewColumnsIcon` → `viewColumns` are true matches. The
	rest are stand-ins: `ShareIcon` → `externalLink`, `TagIcon` → `funnel`,
	`Squares2X2Icon` → `stop`, `Bars4Icon` → `menu`, `TableCellsIcon` →
	`calendar`, `AdjustmentsHorizontalIcon` → `wrench`, `DocumentIcon` → `copy`,
	and the solid `FolderIcon` → `menu` — the same folder/document pair
	`shell-nav` takes, because the registry has neither glyph. `Bars4Icon` and
	`FolderIcon` therefore collide on `menu`; they never appear side by side (one
	is a view-mode toggle, the other a row icon). Retires with the icon registry
	(TODO.md).

	Upstream's five `CSSProperties` objects become strings, because Svelte's
	`style` prop is a string; the const names and declaration order are
	upstream's. The two spread merges (`{...scrollable, ...fixedColumn}`) become
	string concatenation, which is the same last-writer-wins.

	`MetadataList.title` is a `Snippet` here rather than upstream's `ReactNode`,
	so `title="Information"` becomes a snippet.

	The three `useMemo`s are pure functions of `selectedPath` — exactly what
	upstream's dependency arrays say — so each is a `$derived.by`.
-->
<script lang="ts">
	import {
		Avatar,
		HStack,
		Icon,
		IconButton,
		Layout,
		LayoutContent,
		List,
		ListItem,
		MetadataList,
		MetadataListItem,
		Section,
		SegmentedControl,
		SegmentedControlItem,
		Text,
		Toolbar,
		VStack
	} from '@astryx-svelte/core';

	interface FileSystemItem {
		id: string;
		name: string;
		type: 'file' | 'folder';
		children?: FileSystemItem[];
	}

	const FILESYSTEM: FileSystemItem[] = [
		{
			id: 'applications',
			name: 'Applications',
			type: 'folder',
			children: [
				{
					id: 'chrome-apps',
					name: 'Chrome Apps',
					type: 'folder',
					children: [
						{ id: 'component-lab', name: 'Component Lab.app', type: 'file' },
						{ id: 'google-chat', name: 'Google Chat.app', type: 'file' },
						{ id: 'workchat', name: 'Workchat.app', type: 'file' }
					]
				},
				{ id: 'figma', name: 'Figma.app', type: 'file' },
				{ id: 'safari', name: 'Safari.app', type: 'file' },
				{ id: 'slack', name: 'Slack.app', type: 'file' },
				{ id: 'terminal', name: 'Terminal.app', type: 'file' },
				{ id: 'vscode', name: 'Visual Studio Code.app', type: 'file' },
				{ id: 'xcode', name: 'Xcode.app', type: 'file' }
			]
		},
		{ id: 'debug-log', name: 'debug-storybook.log', type: 'file' },
		{
			id: 'desktop',
			name: 'Desktop',
			type: 'folder',
			children: [
				{ id: 'screenshot1', name: 'Screenshot 2026-03-28.png', type: 'file' },
				{ id: 'notes-txt', name: 'meeting-notes.txt', type: 'file' },
				{
					id: 'projects',
					name: 'Projects',
					type: 'folder',
					children: [
						{ id: 'readme-proj', name: 'README.md', type: 'file' },
						{
							id: 'src-folder',
							name: 'src',
							type: 'folder',
							children: [
								{ id: 'index-ts', name: 'index.ts', type: 'file' },
								{ id: 'app-tsx', name: 'App.tsx', type: 'file' }
							]
						}
					]
				}
			]
		},
		{
			id: 'documents',
			name: 'Documents',
			type: 'folder',
			children: [
				{ id: 'design-spec', name: 'design-spec.pdf', type: 'file' },
				{ id: 'resume', name: 'resume.docx', type: 'file' },
				{
					id: 'work',
					name: 'Work',
					type: 'folder',
					children: [
						{ id: 'q1-report', name: 'Q1-report.xlsx', type: 'file' },
						{ id: 'presentation', name: 'team-presentation.pptx', type: 'file' }
					]
				}
			]
		},
		{
			id: 'downloads',
			name: 'Downloads',
			type: 'folder',
			children: [
				{ id: 'archive', name: 'archive.zip', type: 'file' },
				{ id: 'installer', name: 'installer.dmg', type: 'file' },
				{ id: 'photo', name: 'photo-2026.jpg', type: 'file' }
			]
		},
		{ id: 'login-screenshot', name: 'login-02-screenshot.png', type: 'file' },
		{
			id: 'movies',
			name: 'Movies',
			type: 'folder',
			children: [{ id: 'recording', name: 'screen-recording.mov', type: 'file' }]
		},
		{
			id: 'music',
			name: 'Music',
			type: 'folder',
			children: [{ id: 'playlist', name: 'favorites.m3u', type: 'file' }]
		},
		{
			id: 'node-modules',
			name: 'node_modules',
			type: 'folder',
			children: [
				{
					id: 'react',
					name: 'react',
					type: 'folder',
					children: [{ id: 'react-index', name: 'index.js', type: 'file' }]
				},
				{
					id: 'react-dom',
					name: 'react-dom',
					type: 'folder',
					children: [{ id: 'react-dom-index', name: 'index.js', type: 'file' }]
				}
			]
		},
		{
			id: 'pictures',
			name: 'Pictures',
			type: 'folder',
			children: [
				{
					id: 'vacation',
					name: 'vacation-2026',
					type: 'folder',
					children: [
						{ id: 'img1', name: 'IMG_0001.jpg', type: 'file' },
						{ id: 'img2', name: 'IMG_0002.jpg', type: 'file' },
						{ id: 'img3', name: 'IMG_0003.jpg', type: 'file' }
					]
				},
				{
					id: 'screenshots-folder',
					name: 'Screenshots',
					type: 'folder',
					children: [
						{ id: 'ss1', name: 'Screen Shot 1.png', type: 'file' },
						{ id: 'ss2', name: 'Screen Shot 2.png', type: 'file' }
					]
				}
			]
		},
		{
			id: 'public',
			name: 'Public',
			type: 'folder',
			children: [{ id: 'drop-box', name: 'Drop Box', type: 'folder', children: [] }]
		},
		{
			id: 'astryx',
			name: 'astryx',
			type: 'folder',
			children: [
				{ id: 'astryx-readme', name: 'README.md', type: 'file' },
				{ id: 'astryx-pkg', name: 'package.json', type: 'file' },
				{
					id: 'astryx-packages',
					name: 'packages',
					type: 'folder',
					children: [
						{
							id: 'astryx-core',
							name: 'core',
							type: 'folder',
							children: [
								{
									id: 'core-src',
									name: 'src',
									type: 'folder',
									children: [
										{ id: 'button-tsx', name: 'Button.tsx', type: 'file' },
										{ id: 'card-tsx', name: 'Card.tsx', type: 'file' },
										{ id: 'text-tsx', name: 'Text.tsx', type: 'file' }
									]
								}
							]
						},
						{
							id: 'astryx-cli',
							name: 'cli',
							type: 'folder',
							children: [{ id: 'cli-index', name: 'index.ts', type: 'file' }]
						}
					]
				},
				{
					id: 'astryx-apps',
					name: 'apps',
					type: 'folder',
					children: [
						{
							id: 'storybook',
							name: 'storybook',
							type: 'folder',
							children: [{ id: 'sb-config', name: '.storybook', type: 'folder', children: [] }]
						},
						{
							id: 'sandbox-app',
							name: 'sandbox',
							type: 'folder',
							children: [{ id: 'sandbox-src', name: 'src', type: 'folder', children: [] }]
						}
					]
				}
			]
		}
	];

	const page = 'height: 100dvh;';
	const columnRow = 'overflow-x: auto; overflow-y: hidden;';
	const scrollable = 'overflow-y: auto;';
	const fixedColumn = 'flex-shrink: 0;';
	const detailColumn = 'flex-grow: 1; flex-shrink: 0; flex-basis: 320px;';

	function findItem(items: FileSystemItem[], id: string): FileSystemItem | null {
		for (const item of items) {
			if (item.id === id) {
				return item;
			}
			if (item.children) {
				const found = findItem(item.children, id);
				if (found) {
					return found;
				}
			}
		}
		return null;
	}

	function getFileExtension(name: string): string {
		const dot = name.lastIndexOf('.');
		return dot > 0 ? name.substring(dot + 1).toUpperCase() : 'File';
	}

	let selectedPath = $state<string[]>(['applications', 'chrome-apps', 'component-lab']);

	const columns = $derived.by(() => {
		const cols: { items: FileSystemItem[]; selectedId: string | null }[] = [];
		cols.push({ items: FILESYSTEM, selectedId: selectedPath[0] ?? null });
		let currentItems: FileSystemItem[] = FILESYSTEM;
		for (let i = 0; i < selectedPath.length; i++) {
			const selected = currentItems.find((item) => item.id === selectedPath[i]);
			if (selected?.children && selected.children.length > 0) {
				cols.push({
					items: selected.children,
					selectedId: selectedPath[i + 1] ?? null
				});
				currentItems = selected.children;
			} else {
				break;
			}
		}
		return cols;
	});

	const currentFolderName = $derived.by(() => {
		if (selectedPath.length === 0) {
			return 'Home';
		}
		const lastId = selectedPath[selectedPath.length - 1];
		const item = findItem(FILESYSTEM, lastId);
		if (item?.type === 'folder') {
			return item.name;
		}
		if (selectedPath.length >= 2) {
			const parent = findItem(FILESYSTEM, selectedPath[selectedPath.length - 2]);
			return parent?.name ?? 'Home';
		}
		return 'Home';
	});

	const selectedFile = $derived.by(() => {
		if (selectedPath.length === 0) {
			return null;
		}
		const lastId = selectedPath[selectedPath.length - 1];
		const item = findItem(FILESYSTEM, lastId);
		return item?.type === 'file' ? item : null;
	});

	const handleSelect = (columnIndex: number, itemId: string) => {
		selectedPath = [...selectedPath.slice(0, columnIndex), itemId];
	};
</script>

{#snippet chevronLeftIcon()}<Icon icon="chevronLeft" size="sm" />{/snippet}
{#snippet chevronRightIcon()}<Icon icon="chevronRight" size="sm" />{/snippet}
{#snippet squares2X2Icon()}<Icon icon="stop" size="sm" />{/snippet}
{#snippet bars4Icon()}<Icon icon="menu" size="sm" />{/snippet}
{#snippet viewColumnsIcon()}<Icon icon="viewColumns" size="sm" />{/snippet}
{#snippet tableCellsIcon()}<Icon icon="calendar" size="sm" />{/snippet}
{#snippet adjustmentsHorizontalIcon()}<Icon icon="wrench" size="sm" />{/snippet}
{#snippet shareIcon()}<Icon icon="externalLink" size="sm" />{/snippet}
{#snippet tagIcon()}<Icon icon="funnel" size="sm" />{/snippet}
{#snippet ellipsisHorizontalIcon()}<Icon icon="moreHorizontal" size="sm" />{/snippet}
{#snippet magnifyingGlassIcon()}<Icon icon="search" size="sm" />{/snippet}
{#snippet informationTitle()}Information{/snippet}

{#snippet toolbarStart()}
	<IconButton
		variant="ghost"
		size="sm"
		icon={chevronLeftIcon}
		onclick={() => {
			if (selectedPath.length > 0) {
				selectedPath = selectedPath.slice(0, -1);
			}
		}}
		isDisabled={selectedPath.length === 0}
		label="Go back"
	/>
	<IconButton variant="ghost" size="sm" icon={chevronRightIcon} isDisabled label="Go forward" />
	<Text type="label">{currentFolderName}</Text>
{/snippet}

{#snippet toolbarCenter()}
	<SegmentedControl value="column" onChange={() => {}} label="View mode">
		<SegmentedControlItem value="grid" label="Grid" icon={squares2X2Icon} isLabelHidden />
		<SegmentedControlItem value="list" label="List" icon={bars4Icon} isLabelHidden />
		<SegmentedControlItem value="column" label="Column" icon={viewColumnsIcon} isLabelHidden />
		<SegmentedControlItem value="gallery" label="Gallery" icon={tableCellsIcon} isLabelHidden />
	</SegmentedControl>
{/snippet}

{#snippet toolbarEnd()}
	<IconButton variant="ghost" size="sm" icon={adjustmentsHorizontalIcon} label="Group" />
	<IconButton variant="ghost" size="sm" icon={shareIcon} label="Share" />
	<IconButton variant="ghost" size="sm" icon={tagIcon} label="Tags" />
	<IconButton variant="ghost" size="sm" icon={ellipsisHorizontalIcon} label="More" />
	<IconButton variant="ghost" size="sm" icon={magnifyingGlassIcon} label="Search" />
{/snippet}

{#snippet header()}
	<Toolbar
		label="File Explorer"
		size="sm"
		dividers={['bottom']}
		startContent={toolbarStart}
		centerContent={toolbarCenter}
		endContent={toolbarEnd}
	/>
{/snippet}

{#snippet content()}
	<LayoutContent padding={0} isScrollable={false}>
		<HStack height="100%" style={columnRow}>
			{#each columns as col, colIndex (colIndex)}
				{@const showDivider = colIndex < columns.length - 1 || selectedFile != null}
				<Section
					width={240}
					padding={2}
					variant="transparent"
					dividers={showDivider ? ['end'] : undefined}
					style={`${scrollable} ${fixedColumn}`}
				>
					<List density="compact" hasDividers={false}>
						{#each col.items as item (item.id)}
							{@const isSelected = col.selectedId === item.id}
							{@const hasChildren =
								item.type === 'folder' && item.children != null && item.children.length > 0}
							{#snippet itemIcon()}
								<Icon
									icon={item.type === 'folder' ? 'menu' : 'copy'}
									color={item.type === 'folder' ? 'accent' : 'secondary'}
									size="sm"
								/>
							{/snippet}
							{#snippet itemChevron()}
								<Icon icon="chevronRight" size="xsm" color="secondary" />
							{/snippet}
							<ListItem
								label={item.name}
								startContent={itemIcon}
								endContent={hasChildren ? itemChevron : undefined}
								onclick={() => handleSelect(colIndex, item.id)}
								{isSelected}
							/>
						{/each}
					</List>
				</Section>
			{/each}
			{#if selectedFile}
				<Section padding={6} variant="transparent" style={`${scrollable} ${detailColumn}`}>
					<VStack gap={4} hAlign="center">
						<Avatar name={selectedFile.name} size={96} />
						<VStack gap={1} hAlign="center">
							<Text type="label">{selectedFile.name}</Text>
							<Text type="supporting">
								{getFileExtension(selectedFile.name)} Document
							</Text>
						</VStack>
						<MetadataList title={informationTitle}>
							<MetadataListItem label="Created">March 28, 2026 at 2:15 PM</MetadataListItem>
							<MetadataListItem label="Modified">Yesterday, 10:27 PM</MetadataListItem>
							<MetadataListItem label="Kind">
								{getFileExtension(selectedFile.name)} Document
							</MetadataListItem>
						</MetadataList>
					</VStack>
				</Section>
			{/if}
		</HStack>
	</LayoutContent>
{/snippet}

<Layout style={page} height="fill" {header} {content} />
