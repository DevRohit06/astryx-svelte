<script lang="ts">
	import Grid from '$lib/components/grid/grid.svelte';
	import GridSpan from '$lib/components/grid/grid-span.svelte';

	/**
	 * `<Grid>` with either plain `<div>` children or a single `<GridSpan>`.
	 *
	 * Upstream writes its children as inline JSX (`<div>Item 1</div>`,
	 * `<GridSpan columns={2}>Wide item</GridSpan>`); `children` is a `Snippet`
	 * here, which can only be authored in a template, so a fixture is the
	 * smallest thing that can hand one to `Grid`. Both shapes live in one
	 * fixture because every upstream case uses exactly one of them.
	 */
	interface Props {
		/** Props for the `<Grid>` itself. */
		grid?: Record<string | symbol, unknown>;
		/** One plain `<div>{label}</div>` child per entry. */
		items?: string[];
		/** When set, renders a single `<GridSpan>` child carrying these props. */
		span?: Record<string | symbol, unknown>;
		/** Text inside the `<GridSpan>`. */
		spanText?: string;
		/**
		 * Wraps `spanText` in `<span data-testid={…}>` rather than emitting it as
		 * bare text — upstream's last `GridSpan` case nests an element child.
		 */
		spanChildTestid?: string;
	}

	const { grid = {}, items = [], span, spanText = '', spanChildTestid }: Props = $props();
</script>

<Grid {...grid}>
	{#each items as item (item)}
		<div>{item}</div>
	{/each}
	{#if span}
		<GridSpan {...span}>
			{#if spanChildTestid != null}
				<span data-testid={spanChildTestid}>{spanText}</span>
			{:else}
				{spanText}
			{/if}
		</GridSpan>
	{/if}
</Grid>
