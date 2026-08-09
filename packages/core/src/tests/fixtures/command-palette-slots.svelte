<script lang="ts" module>
	export interface CommandPaletteSlotsProps {
		/** Renders text children into a `CommandPaletteGroup`. */
		heading?: string;
		/** One `<div>` per entry, so `getByText` can find each independently. */
		items?: string[];
		/** `CommandPaletteList`'s optional accessible label. */
		label?: string;
		/** Footer children — when set, replaces the default key hints. */
		footerText?: string;
		/** Which component to render. */
		render: 'group' | 'list' | 'footer' | 'footer-default' | 'item' | 'empty';
		/** `CommandPaletteItem` props. */
		value?: string;
		onSelect?: (value: string) => void;
		isDisabled?: boolean;
		isSelected?: boolean;
		isHighlighted?: boolean;
		/** `CommandPaletteEmpty` children. */
		emptyText?: string;
	}
</script>

<script lang="ts">
	import CommandPaletteGroup from '$lib/components/command-palette/command-palette-group.svelte';
	import CommandPaletteList from '$lib/components/command-palette/command-palette-list.svelte';
	import CommandPaletteFooter from '$lib/components/command-palette/command-palette-footer.svelte';
	import CommandPaletteItem from '$lib/components/command-palette/command-palette-item.svelte';
	import CommandPaletteEmpty from '$lib/components/command-palette/command-palette-empty.svelte';

	/**
	 * Children are JSX in upstream's suites and a snippet here, so every case that
	 * passes children goes through this one fixture rather than four near-identical
	 * ones.
	 */
	const {
		heading = 'Group',
		items = ['Item'],
		label,
		footerText,
		render,
		value = 'test',
		onSelect,
		isDisabled,
		isSelected,
		isHighlighted,
		emptyText = 'Empty'
	}: CommandPaletteSlotsProps = $props();
</script>

{#snippet children()}
	{#each items as item (item)}
		<div>{item}</div>
	{/each}
{/snippet}

{#if render === 'group'}
	<CommandPaletteGroup {heading}>
		{@render children()}
	</CommandPaletteGroup>
{:else if render === 'list'}
	<CommandPaletteList {label}>
		{@render children()}
	</CommandPaletteList>
{:else if render === 'footer'}
	{#snippet footerChildren()}
		<span>{footerText}</span>
	{/snippet}
	<CommandPaletteFooter children={footerChildren} />
{:else if render === 'footer-default'}
	<CommandPaletteFooter />
{:else if render === 'empty'}
	<CommandPaletteEmpty>{emptyText}</CommandPaletteEmpty>
{:else}
	<CommandPaletteItem {value} {onSelect} {isDisabled} {isSelected} {isHighlighted}>
		{@render children()}
	</CommandPaletteItem>
{/if}
