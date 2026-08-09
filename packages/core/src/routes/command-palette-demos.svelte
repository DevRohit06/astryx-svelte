<script lang="ts">
	import {
		Button,
		CommandPalette,
		CommandPaletteFooter,
		CommandPaletteInput,
		Icon,
		createStaticSource
	} from '$lib/index.js';
	import type { IconName, SearchableItem, SearchSource } from '$lib/index.js';

	/**
	 * All 8 of upstream's `CommandPalette.stories.tsx` stories, as a sibling route
	 * component — the shape the `Theme` section's helpers already use, because
	 * eight button-plus-dialog pairs with their own sources would otherwise bury
	 * the section in `+page.svelte`.
	 *
	 * **No icon substitutions here**, unusually: `menu`, `wrench`, `info`,
	 * `search` and `check` are all built-in registry icons, so the rich-item and
	 * picker stories render upstream's exact glyphs rather than the stand-ins most
	 * other sections need.
	 */

	// ─── Default ──────────────────────────────────────────────────────────────
	let defaultOpen = $state(false);
	const defaultSource = createStaticSource([
		{ id: 'home', label: 'Home' },
		{ id: 'settings', label: 'Settings' },
		{ id: 'profile', label: 'Profile' },
		{ id: 'dashboard', label: 'Dashboard' },
		{ id: 'help', label: 'Help' }
	]);

	// ─── Auto-grouping ────────────────────────────────────────────────────────
	let groupedOpen = $state(false);
	const groupedSource = createStaticSource([
		{ id: 'home', label: 'Home', auxiliaryData: { group: 'Navigation' } },
		{ id: 'settings', label: 'Settings', auxiliaryData: { group: 'Navigation' } },
		{ id: 'profile', label: 'Profile', auxiliaryData: { group: 'Navigation' } },
		{ id: 'new-file', label: 'New File', auxiliaryData: { group: 'Actions' } },
		{ id: 'save', label: 'Save', auxiliaryData: { group: 'Actions' } },
		{ id: 'export', label: 'Export', auxiliaryData: { group: 'Actions' } }
	]);

	// ─── Custom rendering via renderItem ──────────────────────────────────────
	type RichCommand = SearchableItem<{
		icon?: IconName;
		group?: string;
		shortcut?: string;
		keywords?: string[];
	}>;

	let richOpen = $state(false);
	const richCommands: RichCommand[] = [
		{
			id: 'dashboard',
			label: 'Go to Dashboard',
			auxiliaryData: { icon: 'menu', group: 'Navigation' }
		},
		{
			id: 'settings',
			label: 'Open Settings',
			auxiliaryData: { icon: 'wrench', group: 'Navigation', shortcut: '⌘,' }
		},
		{ id: 'profile', label: 'View Profile', auxiliaryData: { icon: 'info', group: 'Navigation' } },
		{
			id: 'dark-mode',
			label: 'Toggle Dark Mode',
			auxiliaryData: { group: 'Actions', keywords: ['theme', 'appearance'] }
		},
		{
			id: 'new-file',
			label: 'Create New File',
			auxiliaryData: { group: 'Actions', shortcut: '⌘N' }
		},
		{
			id: 'search',
			label: 'Search Files',
			auxiliaryData: { icon: 'search', group: 'Actions', shortcut: '⌘P' }
		}
	];
	const richSource = createStaticSource(richCommands, {
		keywords: (item) => item.auxiliaryData?.keywords ?? []
	});

	// ─── Picker mode ──────────────────────────────────────────────────────────
	let pickerOpen = $state(false);
	let theme = $state('light');
	const pickerSource = createStaticSource([
		{ id: 'light', label: 'Light' },
		{ id: 'dark', label: 'Dark' },
		{ id: 'system', label: 'System' }
	]);

	// ─── Async search ─────────────────────────────────────────────────────────
	let asyncOpen = $state(false);
	const asyncSource: SearchSource = (() => {
		let controller: AbortController | null = null;
		return {
			cancel() {
				controller?.abort();
			},
			async search(query: string) {
				controller?.abort();
				controller = new AbortController();
				await new Promise((r) => setTimeout(r, 400));
				const all = [
					{ id: 'readme', label: 'README.md' },
					{ id: 'package', label: 'package.json' },
					{ id: 'tsconfig', label: 'tsconfig.json' },
					{ id: 'index', label: 'src/index.ts' },
					{ id: 'app', label: 'src/App.tsx' }
				];
				return all.filter((f) => f.label.toLowerCase().includes(query.toLowerCase()));
			},
			bootstrap() {
				return [];
			}
		};
	})();

	// ─── Keywords ─────────────────────────────────────────────────────────────
	let keywordsOpen = $state(false);
	const keywordCommands: SearchableItem<{ aliases?: string[] }>[] = [
		{ id: 'home', label: 'Home' },
		{
			id: 'dark-mode',
			label: 'Toggle Dark Mode',
			auxiliaryData: { aliases: ['theme', 'appearance'] }
		},
		{ id: 'font-size', label: 'Change Font Size', auxiliaryData: { aliases: ['text', 'zoom'] } }
	];
	const keywordsSource = createStaticSource(keywordCommands, {
		keywords: (item) => item.auxiliaryData?.aliases ?? []
	});

	// ─── Many items ───────────────────────────────────────────────────────────
	let manyOpen = $state(false);
	const manyGroups = ['Files', 'Actions', 'Navigation', 'Settings', 'Recent'];
	const manySource = createStaticSource(
		Array.from({ length: 50 }, (_, i) => ({
			id: `item-${i}`,
			label: `Item ${i + 1}`,
			auxiliaryData: { group: manyGroups[i % manyGroups.length] }
		}))
	);

	// ─── Custom footer ────────────────────────────────────────────────────────
	let customFooterOpen = $state(false);
	const customFooterSource = createStaticSource([
		{ id: 'home', label: 'Home' },
		{ id: 'settings', label: 'Settings' }
	]);
</script>

{#snippet richItem(item: RichCommand)}
	<span style="display: flex; align-items: center; gap: 8px; flex: 1;">
		{#if item.auxiliaryData?.icon}
			<Icon icon={item.auxiliaryData.icon} size="sm" />
		{/if}
		<span style="flex: 1;">{item.label}</span>
		{#if item.auxiliaryData?.shortcut}
			<span style="font-size: 12px; opacity: 0.5;">{item.auxiliaryData.shortcut}</span>
		{/if}
	</span>
{/snippet}

{#snippet pickerItem(item: SearchableItem, isSelected: boolean)}
	<span style="display: flex; align-items: center; gap: 8px; flex: 1;">
		<span style="flex: 1;">{item.label}</span>
		{#if isSelected}<Icon icon="check" size="sm" />{/if}
	</span>
{/snippet}

{#snippet asyncInput()}
	<CommandPaletteInput placeholder="Search files..." />
{/snippet}

{#snippet customFooterHint()}
	<span>Pro tip: use ⌘K to open anywhere</span>
{/snippet}

{#snippet customFooter()}
	<CommandPaletteFooter children={customFooterHint} />
{/snippet}

<div class="row">
	<Button label="Open Command Palette" onclick={() => (defaultOpen = true)} />
	<CommandPalette
		isOpen={defaultOpen}
		onOpenChange={(open) => (defaultOpen = open)}
		searchSource={defaultSource}
	/>

	<Button label="Open Grouped" onclick={() => (groupedOpen = true)} />
	<CommandPalette
		isOpen={groupedOpen}
		onOpenChange={(open) => (groupedOpen = open)}
		searchSource={groupedSource}
	/>

	<Button label="Open Rich Palette" onclick={() => (richOpen = true)} />
	<CommandPalette
		isOpen={richOpen}
		onOpenChange={(open) => (richOpen = open)}
		searchSource={richSource}
		renderItem={richItem}
	/>

	<Button label={`Theme: ${theme}`} onclick={() => (pickerOpen = true)} />
	<CommandPalette
		isOpen={pickerOpen}
		onOpenChange={(open) => (pickerOpen = open)}
		searchSource={pickerSource}
		value={theme}
		onValueChange={(v) => {
			theme = v;
			pickerOpen = false;
		}}
		renderItem={pickerItem}
	/>

	<Button label="Open File Search" onclick={() => (asyncOpen = true)} />
	<CommandPalette
		isOpen={asyncOpen}
		onOpenChange={(open) => (asyncOpen = open)}
		searchSource={asyncSource}
		input={asyncInput}
		emptyBootstrapText="Type a filename to search"
		emptySearchText="No files found"
	/>

	<Button label="Open (try 'theme')" onclick={() => (keywordsOpen = true)} />
	<CommandPalette
		isOpen={keywordsOpen}
		onOpenChange={(open) => (keywordsOpen = open)}
		searchSource={keywordsSource}
	/>

	<Button label="Open (50 items)" onclick={() => (manyOpen = true)} />
	<CommandPalette
		isOpen={manyOpen}
		onOpenChange={(open) => (manyOpen = open)}
		searchSource={manySource}
	/>

	<Button label="Open" onclick={() => (customFooterOpen = true)} />
	<CommandPalette
		isOpen={customFooterOpen}
		onOpenChange={(open) => (customFooterOpen = open)}
		searchSource={customFooterSource}
		footer={customFooter}
	/>
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--spacing-3);
	}
</style>
