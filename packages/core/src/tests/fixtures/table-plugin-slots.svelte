<script lang="ts" module>
	/**
	 * Snippets the Table plugin suites pass as props, where upstream passes JSX.
	 *
	 * A snippet can only be authored in a template, so a `.svelte` module that
	 * declares them in markup and re-exports them is the smallest thing that can
	 * hand one to a `.ts` test — the shape `grouped-rows-slots.svelte` already
	 * uses inside `src/lib`. Neither snippet reads instance state, so both hoist
	 * to module scope and the export is a plain function reference.
	 */
	export { customSortHeader, customGroupHeader };
</script>

<!-- `useTableSortable.test.tsx` → "works with ReactNode header content". -->
{#snippet customSortHeader()}
	<span data-testid="custom-header">Custom Name</span>
{/snippet}

<!-- `useTableGroupedRows.test.tsx` → "renders custom group header content". -->
{#snippet customGroupHeader(groupKey: string, count: number, collapsed: boolean)}
	<span>{`${groupKey}::${count}::${collapsed ? 'closed' : 'open'}`}</span>
{/snippet}
