<!--
	Ported from upstream's `assets/templates/pages/ide/page.tsx`.
	Transcribed, not re-authored: the parity rule covers template content too.

	Upstream imports Heroicons here, so the icons are registry substitutions:
	`FolderIcon` → `menu`, `DocumentTextIcon` → `copy`, `MagnifyingGlassIcon` →
	`search`. Only `search` is a true match; the folder/document pair takes the
	same two stand-ins `shell-nav` uses, because the registry has neither glyph.
	Retires with the icon registry (TODO.md).

	`TreeListItemData.label` is `string | Snippet` here, and the `Snippet` arm
	takes no arguments — so upstream's `label={<Text maxLines={1}>{id}</Text>}`
	would need one snippet per node. The string arm is used instead, as
	`shell-nav` does; the visible difference is that a name too long for the
	panel wraps rather than clamping to one line. Upstream's `label` helper
	disappears with it.

	`useResizable` and `useMediaQuery` take their config as a **getter** here,
	against upstream's plain value, and hand back an object of getters. The three
	panels are therefore held whole and read through — `startPanel.size`,
	`startPanel.props`, `startPanel.isCollapsed` — never destructured, which
	would snapshot the numbers at init and freeze the frame.

	`useMemo(() => buildFileTree(setActiveFile), [])` has an empty dependency
	list, so the tree is built exactly once: a plain `const`, not a `$derived`.

	Upstream's `styles` is a `Record<string, CSSProperties>` applied through the
	`style` prop; here it is a `Record<string, string>` of the same declarations,
	because Svelte's `style` prop is a string. A scoped `<style>` block would not
	do — Svelte scopes the selector, not a class handed to a component — and
	these land on `Stack`/`StackItem`/`TabList` as often as on a `<span>`.

	`TextInput.startIcon` is a `Snippet` rather than upstream's icon component,
	so the bare `MagnifyingGlassIcon` becomes a snippet wrapping `<Icon>`.
-->
<script lang="ts">
	import {
		Button,
		CodeBlock,
		Heading,
		Icon,
		Layout,
		LayoutContent,
		LayoutPanel,
		List,
		ListItem,
		MetadataList,
		MetadataListItem,
		ResizeHandle,
		SegmentedControl,
		SegmentedControlItem,
		Stack,
		StackItem,
		Tab,
		TabList,
		Text,
		TextInput,
		TreeList,
		useMediaQuery,
		useResizable,
		type TreeListItemData
	} from '@astryx-svelte/core';

	const styles: Record<string, string> = {
		contentFill: 'height: 100%;',
		terminalWrapper: 'min-height: 0; overflow: hidden; display: grid;',
		tabListPadding: 'padding-top: var(--spacing-2);',
		metadataCompact: 'gap: var(--spacing-1) var(--spacing-3);',
		historyTimelineDot:
			'width: 8px; height: 8px; border-radius: 50%; background-color: var(--color-border-emphasized); margin-top: 6px; flex-shrink: 0;',
		editorArea: 'overflow: auto; min-height: 0;',
		fileExplorer: 'padding: 16px; min-width: 0;',
		propertiesPanel: 'height: 100%;',
		propertiesContent: 'flex: 1; min-height: 0;',
		propertyActions: 'margin-top: auto;',
		terminalPanel: 'flex-shrink: 0; overflow: hidden;'
	};

	// The two CodeBlocks are sized inline upstream, as an object; the same
	// declarations, as the string Svelte's `style` prop takes.
	const codeBlockFill = 'width: 100%; height: 100%; border-width: 0; border-radius: 0;';

	const EDITOR_CODE = `import {useState, useCallback} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Text} from '@astryxdesign/core/Text';

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 16,
};
const counterStyle = {
  fontSize: 48,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
};

export default function Counter() {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  const reset = useCallback(() => {
    setCount(0);
  }, []);

  return (
    <div style={containerStyle}>
      <Text type="label">Counter</Text>
      <span style={counterStyle}>
        {count}
      </span>
      <Button label="Increment" onClick={increment} />
      <Button label="Reset" variant="secondary" onClick={reset} />
    </div>
  );
}`;

	const TERMINAL_OUTPUT = `$ yarn dev
yarn run v1.22.22
$ next dev
   \u25B2 Next.js 15.5.15
   - Local:   http://localhost:3000

 \u2713 Ready in 2.4s
 \u25CB Compiling /counter ...
 \u2713 Compiled /counter in 1.2s (847 modules)
 GET /counter 200 in 1340ms

$ `;

	function buildFileTree(onFileClick: (name: string) => void): TreeListItemData[] {
		const file = (id: string): TreeListItemData => ({
			id,
			label: id,
			startContent: documentTextIcon,
			onClick: () => onFileClick(id)
		});
		return [
			{
				id: 'src',
				label: 'src',
				startContent: folderIcon,
				isExpanded: true,
				children: [
					{
						id: 'components',
						label: 'components',
						startContent: folderIcon,
						isExpanded: true,
						children: [file('Counter.tsx'), file('Header.tsx'), file('Layout.tsx')]
					},
					{
						id: 'pages',
						label: 'pages',
						startContent: folderIcon,
						isExpanded: true,
						children: [file('index.tsx'), file('about.tsx')]
					},
					{
						id: 'styles',
						label: 'styles',
						startContent: folderIcon,
						isExpanded: true,
						children: [file('tokens.ts'), file('theme.ts')]
					}
				]
			},
			file('package.json'),
			file('tsconfig.json'),
			file('next.config.mjs')
		];
	}

	const PROPERTIES = [
		{ label: 'Type', value: 'React Component' },
		{ label: 'Language', value: 'TypeScript' },
		{ label: 'Lines', value: '42' },
		{ label: 'Size', value: '1.2 KB' },
		{ label: 'Last modified', value: '2 hours ago' },
		{ label: 'Imports', value: '4 modules' },
		{ label: 'Exports', value: '1 default' },
		{ label: 'Hooks', value: 'useState, useCallback' }
	];

	const HISTORY_ITEMS = [
		{ label: 'Opened Counter.tsx', time: '2 min ago' },
		{ label: 'Opened Layout.tsx', time: '6 min ago' },
		{ label: 'Viewed tokens.ts', time: '11 min ago' }
	];

	let activeFile = $state('Counter.tsx');
	let activeTermTab = $state('terminal');
	let activePropertiesTab = $state('properties');
	const fileTree = buildFileTree((name) => (activeFile = name));

	const startPanel = useResizable(() => ({
		defaultSize: 256,
		minSizePx: 160,
		maxSizePx: 400,
		collapsible: true,
		collapsedSize: 50
	}));

	const endPanel = useResizable(() => ({
		defaultSize: 320,
		minSizePx: 180,
		maxSizePx: 500,
		collapsible: true,
		collapsedSize: 50
	}));

	const bottomPanel = useResizable(() => ({
		defaultSize: 300,
		minSizePx: 80,
		maxSizePx: Infinity,
		collapsible: true,
		collapsedSize: 40
	}));

	const isMobile = useMediaQuery(() => '(max-width: 768px)');
</script>

{#snippet folderIcon()}<Icon icon="menu" size="xsm" />{/snippet}
{#snippet documentTextIcon()}<Icon icon="copy" size="xsm" />{/snippet}
{#snippet magnifyingGlassIcon()}<Icon icon="search" size="sm" />{/snippet}

{#snippet start()}
	{#if !startPanel.isCollapsed}
		<LayoutPanel width={startPanel.size} hasDivider={false} padding={0}>
			<Stack direction="vertical" style={styles.fileExplorer} gap={2}>
				<TextInput
					label="Search files"
					isLabelHidden
					value=""
					placeholder="Search"
					size="md"
					startIcon={magnifyingGlassIcon}
				/>
				<TreeList items={fileTree} density="compact" />
			</Stack>
		</LayoutPanel>
	{/if}
	<ResizeHandle
		direction="horizontal"
		hasDivider
		isAlwaysVisible={false}
		resizable={startPanel.props}
		label="Resize file explorer"
	/>
{/snippet}

{#snippet editorContent()}
	<LayoutContent padding={0}>
		<Stack direction="vertical" style={styles.contentFill}>
			<StackItem size="fill" style={styles.editorArea}>
				<CodeBlock
					code={EDITOR_CODE}
					language="typescript"
					container="section"
					hasLanguageLabel={false}
					hasLineNumbers
					highlightLines={[21]}
					hasCopyButton={false}
					size="sm"
					style={codeBlockFill}
				/>
			</StackItem>
			<ResizeHandle
				direction="vertical"
				hasDivider
				isReversed
				isAlwaysVisible={false}
				resizable={bottomPanel.props}
				label="Resize terminal"
			/>
			{#if !bottomPanel.isCollapsed}
				<Stack direction="vertical" height={bottomPanel.size} style={styles.terminalPanel}>
					<TabList
						value={activeTermTab}
						onChange={(val) => (activeTermTab = val)}
						size="sm"
						hasDivider={false}
						style={styles.tabListPadding}
					>
						<Tab label="Terminal" value="terminal" />
						<Tab label="Problems" value="problems" />
						<Tab label="Output" value="output" />
						<Tab label="Debug" value="debug" />
					</TabList>
					<StackItem size="fill" style={styles.terminalWrapper}>
						<CodeBlock
							code={TERMINAL_OUTPUT}
							language="bash"
							container="section"
							hasLanguageLabel={false}
							hasCopyButton={false}
							size="sm"
							style={codeBlockFill}
						/>
					</StackItem>
				</Stack>
			{/if}
		</Stack>
	</LayoutContent>
{/snippet}

{#snippet end()}
	<ResizeHandle
		direction="horizontal"
		hasDivider
		isReversed
		isAlwaysVisible={false}
		resizable={endPanel.props}
		label="Resize properties panel"
	/>
	{#if !endPanel.isCollapsed}
		<LayoutPanel width={endPanel.size} hasDivider={false} padding={4}>
			<Stack direction="vertical" gap={3} style={styles.propertiesPanel}>
				<SegmentedControl
					label="Properties panel sections"
					value={activePropertiesTab}
					onChange={(value) => (activePropertiesTab = value)}
					size="sm"
					layout="fill"
				>
					<SegmentedControlItem label="Properties" value="properties" />
					<SegmentedControlItem label="History" value="history" />
				</SegmentedControl>
				{#if activePropertiesTab === 'properties'}
					<Stack direction="vertical" gap={3} style={styles.propertiesContent}>
						<Stack direction="vertical" gap={1}>
							<Heading level={3} maxLines={1}>{activeFile}</Heading>
							<Text color="secondary" type="supporting" maxLines={1}>
								src/components/{activeFile}
							</Text>
						</Stack>
						<MetadataList style={styles.metadataCompact}>
							{#each PROPERTIES as prop (prop.label)}
								<MetadataListItem label={prop.label}>{prop.value}</MetadataListItem>
							{/each}
						</MetadataList>
						<Stack direction="vertical" gap={2} style={styles.propertyActions}>
							<Button label="Format Document" size="sm" variant="secondary" />
							<Button label="Go to Definition" size="sm" variant="secondary" />
							<Button label="Find References" size="sm" variant="secondary" />
						</Stack>
					</Stack>
				{:else}
					<Stack direction="vertical" gap={1}>
						<List>
							{#each HISTORY_ITEMS as item (item.label)}
								{#snippet historyTime()}
									<Text type="supporting" color="secondary" maxLines={1}>{item.time}</Text>
								{/snippet}
								{#snippet historyDot()}<span style={styles.historyTimelineDot}></span>{/snippet}
								<ListItem label={item.label} endContent={historyTime} startContent={historyDot} />
							{/each}
						</List>
					</Stack>
				{/if}
			</Stack>
		</LayoutPanel>
	{/if}
{/snippet}

{#snippet workspaceContent()}
	<LayoutContent padding={0}>
		<Layout height="fill" content={editorContent} end={isMobile.matches ? undefined : end} />
	</LayoutContent>
{/snippet}

{#snippet content()}
	<LayoutContent padding={0}>
		<Layout height="fill" start={isMobile.matches ? undefined : start} content={workspaceContent} />
	</LayoutContent>
{/snippet}

<Layout height="fill" {content} />
