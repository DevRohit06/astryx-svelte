<script lang="ts">
	import { Badge, Card, Table, pixel, type TableColumn } from '@astryx-svelte/core';
	import InlineMarkdown from './inline-markdown.svelte';
	import type { BestPractice } from '$lib/generated/types.js';

	/**
	 * Upstream's `BestPracticesBlock`: a `Card` wrapping a `Table` with a fixed
	 * 100px **Guidance** column carrying the Do/Don't `Badge` and a **Practices**
	 * column of prose, at `density="spacious"` with `dividers="rows"`.
	 *
	 * It used to be a hand-written `<table>`, on a note saying `Table` was
	 * unported. **`Table` has since landed** (`@astryx-svelte/core` exports it and
	 * ten sub-components), so this is now upstream's own composition. Two things
	 * come with the swap and both are measurable: the table gets
	 * `.astryx-table-scroll-wrapper`'s `overflow-x: auto`, so a long practice
	 * cannot clip the way the raw table's did, and the cell padding/dividers come
	 * from the component rather than from CSS that had to be kept in step by hand.
	 *
	 * Rendered on the component detail pages *and* — since the docs-site pass —
	 * on every `/docs/<topic>` section whose content is nothing but `do`/`dont`
	 * lists, which is what upstream's `ReferenceDocView` does with them.
	 */
	interface Props {
		items: BestPractice[];
	}

	const { items }: Props = $props();

	/**
	 * `Table`'s row generic is constrained to `Record<string, unknown>` and
	 * `BestPractice` — a generated type — does not carry an index signature, so
	 * the rows are re-shaped rather than cast. `token-table.ts` declares its own
	 * row types `extends Record<string, unknown>` for the same reason; upstream
	 * reaches it with `as Record<string, unknown>[]`.
	 */
	interface PracticeRow extends Record<string, unknown> {
		guidance: boolean;
		description: string;
	}

	const rows = $derived<PracticeRow[]>(
		items.map((item) => ({ guidance: item.guidance, description: item.description }))
	);

	// `TableColumn.renderCell` is a `Snippet<[T]>` and a template snippet does not
	// exist while the instance script runs, so the column array is deferred to
	// first read inside the render — same reason `token-table.svelte` uses
	// `$derived.by`.
	const columns = $derived.by<TableColumn<PracticeRow>[]>(() => [
		{ key: 'guidance', header: 'Guidance', width: pixel(100), renderCell: guidanceCell },
		{ key: 'description', header: 'Practices', renderCell: descriptionCell }
	]);
</script>

{#snippet guidanceCell(item: PracticeRow)}
	<Badge label={item.guidance ? 'Do' : "Don't"} variant={item.guidance ? 'success' : 'error'} />
{/snippet}

{#snippet descriptionCell(item: PracticeRow)}
	<InlineMarkdown text={item.description} />
{/snippet}

{#if items.length > 0}
	<Card variant="default">
		<Table data={rows} {columns} density="spacious" dividers="rows" />
	</Card>
{/if}
