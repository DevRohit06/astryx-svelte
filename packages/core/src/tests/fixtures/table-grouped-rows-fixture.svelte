<script lang="ts" module>
	import type { TableColumn } from '$lib/components/table/table-types.js';

	export interface Person extends Record<string, unknown> {
		id: string;
		name: string;
		team: string;
	}

	export const PEOPLE: Person[] = [
		{ id: 'a', name: 'Alice', team: 'Core' },
		{ id: 'b', name: 'Bob', team: 'Core' },
		{ id: 'c', name: 'Carol', team: 'Infra' }
	];

	export const PERSON_COLUMNS: TableColumn<Person>[] = [{ key: 'name', header: 'Name' }];
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import Table from '$lib/components/table/table.svelte';
	import { useTableGroupedRows } from '$lib/components/table/plugins/grouped-rows/use-table-grouped-rows.svelte.js';

	/**
	 * Upstream's `Harness` from `useTableGroupedRows.test.tsx`, plus the two
	 * one-off harnesses it declares inline — `OrderedHarness` (`groupOrder`) and
	 * `ChangingHarness` (`canAddRow`), which differ from `Harness` only in a prop
	 * and a button.
	 *
	 * The collapsed set is a `SvelteSet` rather than upstream's replace-the-Set
	 * `useState`: mutating it in place is what makes the hook's `$derived` re-run,
	 * and it keeps the fixture from having to reassign a fresh Set on every
	 * toggle. The hook still sees a plain `Set<string>`.
	 */
	interface Props {
		rows?: Person[];
		initialCollapsed?: Set<string>;
		renderGroupHeader?: Snippet<[string, number, boolean]>;
		groupOrder?: string[];
		/** Renders `ChangingHarness`'s "add" button, which appends a Core member. */
		canAddRow?: boolean;
	}

	const {
		rows = PEOPLE,
		initialCollapsed,
		renderGroupHeader,
		groupOrder,
		canAddRow = false
	}: Props = $props();

	// Both are seeded once from a prop, as upstream's two `useState` calls are:
	// `ChangingHarness` owns the rows after mount and no case re-renders the
	// harness with new ones.
	// svelte-ignore state_referenced_locally
	const collapsedGroups = new SvelteSet<string>(initialCollapsed);
	// svelte-ignore state_referenced_locally
	let data = $state<Person[]>(rows);

	function onToggleGroup(key: string): void {
		if (collapsedGroups.has(key)) {
			collapsedGroups.delete(key);
		} else {
			collapsedGroups.add(key);
		}
	}

	const grouped = useTableGroupedRows<Person>(() => ({
		data,
		groupBy: (p) => p.team,
		collapsedGroups,
		onToggleGroup,
		getRowKey: (p) => p.id,
		renderGroupHeader,
		groupOrder
	}));

	/**
	 * `OrderedHarness` asserts `grouped.data.length > 0` from inside its render.
	 * A Svelte fixture has no render body to assert in, so the flattened rows are
	 * exposed here and the case asserts on them.
	 */
	export const api = {
		get data(): Person[] {
			return grouped.data;
		}
	};
</script>

{#if canAddRow}
	<button
		type="button"
		onclick={() => (data = [...PEOPLE, { id: 'd', name: 'Dave', team: 'Core' }])}
	>
		add
	</button>
{/if}
<Table
	data={grouped.data}
	columns={PERSON_COLUMNS}
	idKey={grouped.idKey}
	plugins={{ grouped: grouped.plugin }}
/>
