<script lang="ts" module>
	import type { TableColumn } from '$lib/components/table/table-types.js';

	export interface Person extends Record<string, unknown> {
		id: string;
		name: string;
		team: string;
	}

	/** Upstream's `people`. */
	export const people: Person[] = [
		{ id: 'a', name: 'Alice', team: 'Core' },
		{ id: 'b', name: 'Bob', team: 'Core' },
		{ id: 'c', name: 'Carol', team: 'Infra' }
	];
</script>

<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import Table from '$lib/components/table/table.svelte';
	import { useTableGroupedRows } from '$lib/components/table/plugins/grouped-rows/use-table-grouped-rows.svelte.js';

	/**
	 * Upstream's `GroupedRenderCountTable` from
	 * `useTableGroupedRows-perf.test.tsx`.
	 *
	 * The `renderCounts` record is threaded in and incremented from inside the
	 * column's cell renderer, exactly as upstream does. A `renderCell` is a
	 * `Snippet` here rather than a function returning a node, so the increment
	 * rides an `{@const}` — a `$derived` scoped to the snippet body, evaluated
	 * once per instantiation and again only when the `item` it reads changes.
	 * That makes the counter mean, precisely, "how many times did this row's cell
	 * expression evaluate", which is the closest addressable thing to upstream's
	 * "how many times did React call this renderer".
	 *
	 * `columns` is a plain array behind a `$derived` rather than upstream's
	 * `useMemo`: the memo exists so React hands `BaseTable` the same array on
	 * every render, and a Svelte `$derived` with no reactive reads is evaluated
	 * once and cached, which is the same guarantee obtained for free. (Deferring
	 * to a `$derived` rather than a bare `const` is only so the snippet reference
	 * resolves after the template's declarations, not for reactivity.)
	 *
	 * `collapsedGroups` is a `SvelteSet` for the reason
	 * `table-grouped-rows-fixture.svelte` gives: mutating in place is what makes
	 * the hook's `$derived` re-run. The hook still sees a plain `Set<string>`.
	 */
	interface Props {
		renderCounts: Record<string, number>;
	}

	const { renderCounts }: Props = $props();

	let tick = $state(0);
	const collapsedGroups = new SvelteSet<string>();

	/** Upstream's `renderCell` body: record the render, return the name. */
	function countRender(item: Person): string {
		renderCounts[item.id] = (renderCounts[item.id] ?? 0) + 1;
		return item.name;
	}

	const grouped = useTableGroupedRows<Person>(() => ({
		data: people,
		groupBy: (p: Person) => p.team,
		collapsedGroups,
		onToggleGroup: (key: string) => {
			if (!collapsedGroups.delete(key)) {
				collapsedGroups.add(key);
			}
		},
		getRowKey: (p: Person) => p.id
	}));

	// The snippet is referenced from inside a function body, which is what
	// `table-fixture.svelte` does and what keeps TypeScript from reading it as a
	// use-before-declaration: a top-level snippet is declared in the template,
	// below this line.
	function resolveColumns(): TableColumn<Person>[] {
		return [{ key: 'name', header: 'Name', renderCell: nameCell }];
	}

	const columns = $derived(resolveColumns());
</script>

{#snippet nameCell(item: Person)}{@const label = countRender(item)}{label}{/snippet}

<button type="button" onclick={() => (tick += 1)}>bump {tick}</button>
<Table data={grouped.data} {columns} idKey={grouped.idKey} plugins={{ grouped: grouped.plugin }} />
