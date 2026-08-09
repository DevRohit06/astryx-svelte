<!--
	Ported from upstream's `templates/blocks/components/Table/TableGroupedRowsTable.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Data, columns and the grouping key are upstream's, unchanged. Four
	translations:

	- **`useState` → `$state`.** `const [collapsedGroups, setCollapsed] =
	  useState<Set<string>>(new Set())` becomes
	  `let collapsedGroups = $state(new Set<string>())`. The `Set` is a plain one
	  and reassignment is the reactive boundary, as in
	  `Table/TableSelectableTable.svelte`.
	- **`useCallback` has nothing to become.** It exists upstream to keep the
	  handler's identity stable across renders; here the component body runs once,
	  so the arrow is already stable.
	- **The updater form is gone.** Upstream writes `setCollapsed(prev => …)`
	  because a batched React setter may read stale state; a `$state` read never
	  is, so the next set is derived from `collapsedGroups` directly and assigned.
	  The clone-then-mutate body inside is upstream's own, kept verbatim.
	- **The hook takes a getter**, where upstream passes the config object.

	The result is **held, not destructured** — as upstream holds it, and as this
	port requires: `grouped.data` is a *getter* over a `$derived`, so a
	`const {data} = …` would snapshot the first flattening and the table would
	never collapse. `grouped.plugin` and `grouped.idKey` are read through the same
	object.

	No icon substitutions: the group-header chevron is the plugin's own chrome.
-->
<script lang="ts">
	import {
		Table,
		pixel,
		proportional,
		useTableGroupedRows,
		type TableColumn
	} from '@astryx-svelte/core';

	interface Person extends Record<string, unknown> {
		id: string;
		name: string;
		team: string;
		role: string;
	}

	const people: Person[] = [
		{ id: '1', name: 'Ava Chen', team: 'Design Systems', role: 'Staff Eng' },
		{ id: '2', name: 'Liam Park', team: 'Design Systems', role: 'Engineer' },
		{ id: '3', name: 'Zoe Vega', team: 'Design Systems', role: 'Manager' },
		{ id: '4', name: 'Max Ross', team: 'Infra', role: 'Senior Eng' },
		{ id: '5', name: 'Mia Cole', team: 'Infra', role: 'Engineer' },
		{ id: '6', name: 'Leo Nash', team: 'Growth', role: 'PM' }
	];

	const columns: TableColumn<Person>[] = [
		{ key: 'name', header: 'Name', width: proportional(2) },
		{ key: 'role', header: 'Role', width: pixel(140) }
	];

	let collapsedGroups = $state(new Set<string>());

	const onToggleGroup = (key: string) => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const next = new Set(collapsedGroups);
		if (next.has(key)) {
			next.delete(key);
		} else {
			next.add(key);
		}
		collapsedGroups = next;
	};

	// Held, not destructured — see the header comment.
	const grouped = useTableGroupedRows<Person>(() => ({
		data: people,
		groupBy: (p) => p.team,
		collapsedGroups,
		onToggleGroup,
		getRowKey: (p) => p.id
	}));
</script>

<Table
	data={grouped.data}
	{columns}
	idKey={grouped.idKey}
	hasHover
	plugins={{ grouped: grouped.plugin }}
/>
