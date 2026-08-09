<script lang="ts" module>
	import type { SearchSource, SearchableItem } from '$lib/components/typeahead/types.js';

	export interface CommandPaletteProbeProps {
		isOpen: boolean;
		onOpenChange?: (open: boolean) => void;
		searchSource: SearchSource<SearchableItem>;
		label?: string;
		value?: string;
		emptyBootstrapText?: string;
		emptySearchText?: string;
		/** Render the two custom slots instead of the defaults. */
		hasCustomSlots?: boolean;
		/**
		 * Pass the empty-state text as a **snippet** rather than a string — the
		 * other arm of `string | Snippet`, which upstream's `ReactNode` has no
		 * counterpart for and its suite therefore never exercises.
		 */
		hasSnippetEmptyText?: boolean;
		/** Render each item's label uppercased — upstream's `renderItem` case. */
		renderMode?: 'none' | 'uppercase' | 'selected';
	}
</script>

<script lang="ts">
	import CommandPalette from '$lib/components/command-palette/command-palette.svelte';

	/**
	 * `input`, `footer` and `renderItem` are JSX / a render function upstream and
	 * snippets here, so every case that supplies one goes through this fixture.
	 */
	const {
		isOpen,
		onOpenChange = () => {},
		searchSource,
		label,
		value,
		emptyBootstrapText,
		emptySearchText,
		hasCustomSlots = false,
		hasSnippetEmptyText = false,
		renderMode = 'none'
	}: CommandPaletteProbeProps = $props();
</script>

{#snippet bootstrapSnippet()}
	<span data-testid="empty-bootstrap-snippet">Nothing here yet</span>
{/snippet}

{#snippet searchSnippet()}
	<span data-testid="empty-search-snippet">Nothing matched</span>
{/snippet}

{#snippet inputSlot()}
	<div data-testid="input-slot">Custom Input</div>
{/snippet}

{#snippet footerSlot()}
	<div data-testid="footer-slot">Custom Footer</div>
{/snippet}

{#snippet uppercase(item: SearchableItem)}
	<span>{item.label.toUpperCase()}</span>
{/snippet}

{#snippet selectedAware(item: SearchableItem, isSelected: boolean)}
	<span>{isSelected ? `checked-${item.label}` : item.label}</span>
{/snippet}

<CommandPalette
	{isOpen}
	{onOpenChange}
	{searchSource}
	{label}
	{value}
	emptyBootstrapText={hasSnippetEmptyText ? bootstrapSnippet : emptyBootstrapText}
	emptySearchText={hasSnippetEmptyText ? searchSnippet : emptySearchText}
	input={hasCustomSlots ? inputSlot : undefined}
	footer={hasCustomSlots ? footerSlot : undefined}
	renderItem={renderMode === 'uppercase'
		? uppercase
		: renderMode === 'selected'
			? selectedAware
			: undefined}
/>
