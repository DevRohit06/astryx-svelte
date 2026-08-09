<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { BaseProps } from '../../base-props.js';
	import type { SearchSource, SearchableItem } from '../typeahead/types.js';
	import type { SelectorOptionData } from '../selector/types.js';

	export interface CommandPaletteProps<T extends SearchableItem = SearchableItem> extends Omit<
		BaseProps<HTMLDialogElement>,
		'onchange'
	> {
		/** Whether the command palette is open. */
		isOpen: boolean;

		/**
		 * Renders command palette content inline without modal behavior.
		 * Suppresses input auto-focus and initial highlighted-item auto-scroll.
		 * For documentation previews and showcases only.
		 * @default false
		 */
		isInline?: boolean;

		/** Called when the command palette visibility changes. */
		onOpenChange: (isOpen: boolean) => void;

		/**
		 * Search source providing items. Implements `search(query)` and `bootstrap()`.
		 * Same interface as Typeahead's searchSource.
		 * Use `createStaticSource` for simple static lists.
		 */
		searchSource: SearchSource<T>;

		/**
		 * The search input slot.
		 * @default <CommandPaletteInput />
		 */
		input?: Snippet;

		/**
		 * The footer slot.
		 * @default <CommandPaletteFooter />
		 */
		footer?: Snippet;

		/**
		 * Per-item render snippet. Receives the item and whether it is currently
		 * selected. Auto-grouping by `auxiliaryData.group` is preserved.
		 * When omitted, renders each item's `label` text.
		 */
		renderItem?: Snippet<[T, boolean]>;

		/**
		 * Content shown when a search query returns no results.
		 * @default 'No results'
		 */
		emptySearchText?: string | Snippet;

		/**
		 * Content shown when there is no search query and bootstrap() returns nothing.
		 * @default 'Type to search'
		 */
		emptyBootstrapText?: string | Snippet;

		/** Controlled selected value (for picker mode). */
		value?: string;

		/** Called when the selected value changes. */
		onValueChange?: (value: string) => void;

		/**
		 * Accessible label for the command palette dialog.
		 * @default 'Command palette'
		 */
		label?: string;

		/**
		 * Width of the command palette dialog.
		 * @default 640
		 */
		width?: number | string;

		/**
		 * Maximum height of the command palette dialog.
		 * @default 480
		 */
		maxHeight?: number | string;
	}

	function getGroup(item: SearchableItem): string | undefined {
		const aux = item.auxiliaryData as Record<string, unknown> | undefined;
		return typeof aux?.group === 'string' ? aux.group : undefined;
	}

	/**
	 * Split items into ordered groups plus the ungrouped tail, preserving each
	 * group's insertion order.
	 *
	 * Upstream writes this walk out twice — once in `buildSelectableItems` and
	 * once inside `ItemRenderer` — because one produces data and the other
	 * produces JSX. Here the render half is a snippet driven by data, so both
	 * callers share one function and the two orders **cannot** drift. That
	 * matters: `buildSelectableItems` is documented as having to match
	 * `ItemRenderer`'s layout exactly, since `useCombobox` navigates by index.
	 */
	function partitionByGroup<T extends SearchableItem>(
		items: T[]
	): { groupOrder: string[]; groups: Map<string, T[]>; ungrouped: T[]; hasGroups: boolean } {
		const groupOrder: string[] = [];
		// A plain `Map`, deliberately: this is a local inside a pure function that
		// returns a fresh result each call, never reactive state, so `SvelteMap`
		// would buy a proxy nothing reads through.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const groups = new Map<string, T[]>();
		const ungrouped: T[] = [];
		let hasGroups = false;

		for (const item of items) {
			const group = getGroup(item);
			if (group != null) {
				hasGroups = true;
				if (!groups.has(group)) {
					groupOrder.push(group);
					groups.set(group, []);
				}
				groups.get(group)?.push(item);
			} else {
				ungrouped.push(item);
			}
		}

		return { groupOrder, groups, ungrouped, hasGroups };
	}

	/**
	 * Build a flat list of selectable items in DOM order from search results.
	 * When groups are present, items are ordered by group (preserving insertion
	 * order), with ungrouped items at the end — matching the render layout.
	 */
	function buildSelectableItems(items: SearchableItem[]): SelectorOptionData[] {
		const { groupOrder, groups, ungrouped, hasGroups } = partitionByGroup(items);

		if (!hasGroups) {
			return items.map((item) => ({ value: item.id, label: item.label }));
		}

		const result: SelectorOptionData[] = [];
		for (const heading of groupOrder) {
			for (const item of groups.get(heading) ?? []) {
				result.push({ value: item.id, label: item.label });
			}
		}
		for (const item of ungrouped) {
			result.push({ value: item.id, label: item.label });
		}
		return result;
	}
</script>

<script lang="ts" generics="T extends SearchableItem = SearchableItem">
	import { untrack } from 'svelte';
	import Dialog from '../dialog/dialog.svelte';
	import Layout from '../layout/layout.svelte';
	import LayoutHeader from '../layout/layout-header.svelte';
	import LayoutContent from '../layout/layout-content.svelte';
	import LayoutFooter from '../layout/layout-footer.svelte';
	import { useCombobox } from '../selector/use-combobox.svelte.js';
	import { createOptimistic } from '../../internal/optimistic.svelte.js';
	import { useTranslator } from '../../i18n/use-translator.svelte.js';
	import { useAnnounce } from '../../hooks/use-announce.js';
	import { setCommandPaletteContext } from './command-palette-context.svelte.js';
	import CommandPaletteList from './command-palette-list.svelte';
	import CommandPaletteItem from './command-palette-item.svelte';
	import CommandPaletteGroup from './command-palette-group.svelte';
	import CommandPaletteInput from './command-palette-input.svelte';
	import CommandPaletteFooter from './command-palette-footer.svelte';
	import CommandPaletteEmpty from './command-palette-empty.svelte';

	/**
	 * Command palette root component, ported from Astryx's
	 * `CommandPalette/CommandPalette.tsx`.
	 *
	 * Uses `searchSource` for all search logic — the same interface as
	 * `Typeahead`. For static lists, use `createStaticSource`. Keyboard navigation
	 * is `useCombobox` from `Selector`, so arrow keys, Home/End, Enter and Escape
	 * behave as they do in every other combobox-pattern component. Input and
	 * footer render by default; pass them only to replace the defaults.
	 *
	 * **Upstream's `useTransition` + two `useOptimistic`s become two
	 * `createOptimistic`s.** `optimisticSearch` is what the input shows (it
	 * advances on every keystroke); `search` is the committed query the on-screen
	 * results actually correspond to, and only advances when results arrive. That
	 * split is what makes the empty-state flags exhaustive, so the empty state is
	 * never unmounted and re-added mid-search.
	 *
	 * @example
	 * ```svelte
	 * <CommandPalette
	 *   {isOpen}
	 *   onOpenChange={(open) => (isOpen = open)}
	 *   searchSource={createStaticSource(commands)}
	 * />
	 * ```
	 */
	const {
		isOpen,
		isInline,
		onOpenChange,
		searchSource,
		input,
		footer,
		renderItem,
		emptySearchText: emptySearchTextFromProps,
		emptyBootstrapText: emptyBootstrapTextFromProps,
		value: controlledValue,
		onValueChange,
		label: labelFromProps,
		width = 640,
		maxHeight = 480,
		...rest
	}: CommandPaletteProps<T> = $props();

	const t = useTranslator();

	// Announce search status to screen readers through the shared polite live
	// region (the same announce path `Selector`/`BaseTypeahead` use). The busy
	// spinner and the empty states are otherwise purely visual, so a screen-reader
	// user typing a query would hear nothing when loading starts or results
	// disappear (WCAG 4.1.3).
	const announce = useAnnounce();

	const label = $derived(labelFromProps ?? t('@astryx.commandPalette.label'));
	const emptySearchText = $derived(
		emptySearchTextFromProps ?? t('@astryx.commandPalette.emptySearch')
	);
	const emptyBootstrapText = $derived(
		emptyBootstrapTextFromProps ?? t('@astryx.commandPalette.emptyBootstrap')
	);

	const listId = $props.id();

	// `search` is the committed query — it only advances when async results
	// arrive. `optimisticSearch.current` updates immediately on keystroke and
	// drives the input + empty state.
	let search = $state('');
	let internalValue = $state('');
	// `$state.raw`: every mutation is a whole-array reassignment and an item is
	// opaque to us, the same call `Toast` makes for its entries.
	let searchResults = $state.raw<T[]>([]);

	const optimisticSearch = createOptimistic(() => search);
	const optimisticResults = createOptimistic<T[]>(() => searchResults);

	// Upstream's `isPending` from `useTransition`, which wraps both the optimistic
	// search write and the async search itself.
	const isBusy = $derived(optimisticSearch.isPending || optimisticResults.isPending);

	// Upstream's `searchVersionRef`. A plain `let` — it is a ref, and nothing
	// renders from it.
	let searchVersion = 0;

	const value = $derived(controlledValue ?? internalValue);

	function setValue(newValue: string): void {
		if (controlledValue === undefined) {
			internalValue = newValue;
		}
		onValueChange?.(newValue);
	}

	// Build flat selectable items in DOM order from search results.
	// Must match the render order below — `useCombobox` navigates by index.
	const selectableItems = $derived(buildSelectableItems(optimisticResults.current));

	function handleClose(): void {
		// Reset both committed and optimistic search on close
		search = '';
		searchResults = [];
		if (controlledValue === undefined) {
			internalValue = '';
		}
		searchSource.cancel?.();
		// Clear any lingering result / loading announcement when the palette closes
		// so stale status text does not linger in the a11y tree (matching
		// `Selector`'s onHide).
		announce('');
		onOpenChange(false);
	}

	function selectItem(itemValue: string): void {
		setValue(itemValue);
	}

	// useCombobox handles all keyboard navigation and highlight state. The palette
	// is always "open" from the combobox's perspective — the dialog owns
	// visibility — and its onOpen/onClose are no-ops, because `handleClose` is the
	// palette's own close path.
	const combobox = useCombobox(() => ({
		selectableItems,
		value,
		isOpen: true,
		onOpen: () => {},
		onClose: () => {},
		onSelect: (itemValue: string) => {
			selectItem(itemValue);
			handleClose();
		},
		listboxId: listId
	}));

	/**
	 * Run a search for the given query and commit results. Called directly when
	 * the user types — no effect indirection, as upstream has none.
	 */
	async function runSearch(query: string): Promise<void> {
		searchSource.cancel?.();
		const version = ++searchVersion;
		const isBootstrap = query === '';

		// Client-filter previous results for instant narrowing while the fetch is
		// in flight. Read untracked: this is a snapshot for the override, not a
		// dependency — and `optimistic.run` writes before it awaits, so a tracked
		// re-read would see the value it had just installed (the `ToggleButton`
		// race).
		// Loading started for a user query: tell screen-reader users the spinner
		// appeared. The polite region coalesces rapid updates, so for fast sources
		// the result-count announcement below simply replaces this instead of
		// stacking one "Loading" per keystroke.
		if (!isBootstrap) {
			announce(t('@astryx.commandPalette.loading'));
		}

		const prior = untrack(() => searchResults);
		const shouldFilter = !isBootstrap && prior.length > 0;
		const lower = query.toLowerCase().trim();
		const optimisticNext = shouldFilter
			? prior.filter((item) => item.label.toLowerCase().includes(lower))
			: untrack(() => optimisticResults.current);

		await optimisticResults.run(optimisticNext, async () => {
			const result = isBootstrap ? searchSource.bootstrap() : searchSource.search(query);
			const items = (await Promise.resolve(result)) as T[];

			if (searchVersion !== version) {
				return;
			}
			// Commit query and results together
			search = query;
			searchResults = items;

			// Announce the outcome from the search commit (not a reactive effect),
			// matching `Selector`/`BaseTypeahead`: exactly one announcement per
			// committed query, and the version check above already discards stale
			// keystrokes. Bootstrap stays silent — the same role `PowerSearch`'s
			// mount guard plays — so opening the palette announces nothing; clearing
			// the query only clears any lingering status text.
			if (isBootstrap) {
				announce('');
			} else if (items.length === 0) {
				announce(t('@astryx.commandPalette.noResultsFor', { query }));
			} else {
				announce(t('@astryx.commandPalette.resultCount', { count: items.length }));
			}

			// When opening with a preselected value, highlight it once bootstrap
			// results arrive. No value → highlight stays at -1 and ArrowDown
			// naturally moves to the first item.
			const currentValue = untrack(() => value);
			if (isBootstrap && currentValue != null && currentValue !== '') {
				const selectedIdx = items.findIndex((item) => item.id === currentValue);
				if (selectedIdx >= 0) {
					combobox.setHighlightedIndex(selectedIdx);
				}
			}
		});
	}

	// Bootstrap on open. Upstream keys this on `[isOpen]` alone and reaches
	// `runSearch` through a ref so a changed identity cannot re-trigger it; here
	// `untrack` does the same job — the effect must depend on `isOpen` and
	// nothing else.
	$effect(() => {
		if (isOpen) {
			untrack(() => {
				void runSearch('');
			});
		}
	});

	// Wrap combobox's onKeyDown to intercept Escape (close palette) and Enter on
	// highlight (select + close), since we're not using combobox's built-in
	// open/close lifecycle.
	function handleKeyDown(e: KeyboardEvent): void {
		if (e.key === 'Escape') {
			e.preventDefault();
			handleClose();
			return;
		}
		if (e.key === 'Enter') {
			e.preventDefault();
			if (combobox.highlightedIndex >= 0 && combobox.highlightedIndex < selectableItems.length) {
				const item = selectableItems[combobox.highlightedIndex];
				if (item && !item.disabled) {
					selectItem(item.value);
					handleClose();
				}
			}
			return;
		}
		// Space should type in the input, not trigger selection
		if (e.key === ' ') {
			return;
		}
		combobox.onKeyDown(e);
	}

	setCommandPaletteContext(() => ({
		// The input reads `optimisticSearch.current`, so a keystroke shows
		// immediately; `setSearch` installs the override and runs the async search
		// under it, which is upstream's `startTransition` + `runSearch` pair.
		search: optimisticSearch.current,
		setSearch: (query: string) => {
			void optimisticSearch.run(query, () => runSearch(query));
		},
		value,
		setValue,
		listId,
		highlightedIndex: combobox.highlightedIndex,
		setHighlightedIndex: combobox.setHighlightedIndex,
		getItemId: combobox.getItemId,
		selectableItems,
		searchResults: optimisticResults.current,
		selectItem,
		onKeyDown: handleKeyDown,
		onClose: handleClose,
		isOpen,
		isBusy
	}));

	// `search` is the committed query the on-screen results correspond to (it
	// still holds the previous query while a search is pending). Keeping both
	// flags ungated by `isBusy` makes them exhaustive over the empty case, so the
	// empty state is never unmounted and re-added mid-search (which flashed).
	const showEmptyBootstrap = $derived(search === '' && optimisticResults.current.length === 0);
	const showEmptySearch = $derived(search !== '' && optimisticResults.current.length === 0);

	const partition = $derived(partitionByGroup(optimisticResults.current));
</script>

{#snippet oneItem(item: T)}
	<CommandPaletteItem value={item.id}>
		{#if renderItem}{@render renderItem(item, item.id === value)}{:else}{item.label}{/if}
	</CommandPaletteItem>
{/snippet}

<!--
	Upstream's `ItemRenderer`. Auto-groups by `auxiliaryData.group` when present,
	and the flat/grouped split walks the *same* partition `buildSelectableItems`
	does, so the rendered order and the keyboard index cannot disagree.
-->
{#snippet listContent()}
	{#if showEmptyBootstrap}
		<!--
			Passed as the `children` *prop*, not as component content. Written as
			`<CommandPaletteEmpty>{emptyBootstrapText}</CommandPaletteEmpty>` Svelte
			builds a snippet that renders the expression, and when the value is
			itself a `Snippet` that throws `snippet_without_render_tag` at runtime.
			`CommandPaletteEmpty.children` is `string | Snippet` and discriminates
			internally, so handing it the value directly is correct for both arms.
		-->
		<CommandPaletteEmpty children={emptyBootstrapText} />
	{:else if showEmptySearch}
		<CommandPaletteEmpty children={emptySearchText} />
	{:else if !partition.hasGroups}
		{#each optimisticResults.current as item (item.id)}
			{@render oneItem(item)}
		{/each}
	{:else}
		{#each partition.groupOrder as heading (heading)}
			<CommandPaletteGroup {heading}>
				{#each partition.groups.get(heading) ?? [] as item (item.id)}
					{@render oneItem(item)}
				{/each}
			</CommandPaletteGroup>
		{/each}
		{#each partition.ungrouped as item (item.id)}
			{@render oneItem(item)}
		{/each}
	{/if}
{/snippet}

{#snippet header()}
	<LayoutHeader hasDivider padding={0}>
		{#if input}{@render input()}{:else}<CommandPaletteInput />{/if}
	</LayoutHeader>
{/snippet}

{#snippet content()}
	<LayoutContent padding={0}>
		<CommandPaletteList>
			{@render listContent()}
		</CommandPaletteList>
	</LayoutContent>
{/snippet}

{#snippet footerSlot()}
	<LayoutFooter hasDivider padding={0}>
		{#if footer}{@render footer()}{:else}<CommandPaletteFooter />{/if}
	</LayoutFooter>
{/snippet}

<!--
	`rest` is spread **last**, which is upstream's position for it as of 0.1.9 —
	so a consumer's `aria-label` overrides the default label rather than losing to
	it. This port spread it first while upstream dropped rest here entirely; that
	divergence is over.
-->
<Dialog
	{isOpen}
	{isInline}
	onOpenChange={(open) => {
		if (!open) {
			handleClose();
		} else {
			onOpenChange(true);
		}
	}}
	{width}
	{maxHeight}
	purpose="info"
	aria-label={label}
	{...rest}
>
	<Layout defaultHasDividers {header} {content} footer={footerSlot} />
</Dialog>
