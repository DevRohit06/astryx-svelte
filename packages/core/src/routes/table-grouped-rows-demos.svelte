<script lang="ts">
	import { Table, pixel, proportional, useTableGroupedRows } from '$lib/index.js';
	import type { TableColumn } from '$lib/index.js';

	/**
	 * Upstream's `TableGroupedRows.stories.tsx`, as a sibling route component —
	 * the `table-demos.svelte` shape, because three grouped tables each carrying
	 * their own collapse state would otherwise bury the page.
	 *
	 * **All 3 stories.** Upstream's per-story prose, kept:
	 *
	 * - *Default* — rows are grouped into collapsible sections by `groupBy`. Each
	 *   section gets a full-width header with a chevron, the group label, and a
	 *   member count. Click a header (or its chevron) to collapse/expand that
	 *   group.
	 * - *Initially collapsed* — groups can start collapsed: pass their keys in
	 *   the initial `collapsedGroups` set. Here "Infra" begins collapsed.
	 * - *Custom order and header* — `groupOrder` pins specific groups to the
	 *   front; `renderGroupHeader` customizes the header content shown to the
	 *   right of the chevron.
	 *
	 * Data, columns, the grouping key and the group order are upstream's,
	 * unchanged. Four translations:
	 *
	 * - **The hook takes a getter**, where upstream passes the config object.
	 * - **Each result is held, not destructured** — as upstream holds it, and as
	 *   this port requires: `grouped.data` is a *getter* over a `$derived`, so a
	 *   `const {data} = …` would snapshot the first flattening and the table
	 *   would never collapse. `grouped.plugin` and `grouped.idKey` are read
	 *   through the same object.
	 * - **`useState` → `$state`, and `useCallback` has nothing to become** — it
	 *   exists upstream to keep the handler's identity stable across renders, and
	 *   the component body here runs once. Upstream's `useCollapsed` factory does
	 *   not survive either, because a rune factory belongs in a `.svelte.ts`
	 *   module: each story holds its own `$state` instead, and they share only
	 *   the clone-then-mutate body, which is upstream's own. The updater form
	 *   (`setCollapsed(prev => …)`) goes with it — it guards against a batched
	 *   React setter reading stale state, and a `$state` read never is.
	 * - **`renderGroupHeader` is a `Snippet<[string, number, boolean]>`** where
	 *   upstream's is `(key, count, collapsed) => ReactNode`. It is declared in
	 *   the template and reached through the config getter, which is not called
	 *   until the first read of `grouped.data` — inside the render, by which time
	 *   the snippet exists.
	 *
	 * No icon substitutions: the group-header chevron is the plugin's own chrome.
	 */

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

	// The body of upstream's `useCollapsed` updater, as a pure function — the
	// one part of that factory the three stories can still share.
	function toggleGroupKey(collapsed: Set<string>, groupKey: string): Set<string> {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const next = new Set(collapsed);
		if (next.has(groupKey)) {
			next.delete(groupKey);
		} else {
			next.add(groupKey);
		}
		return next;
	}

	let defaultCollapsedGroups = $state(new Set<string>());

	const defaultGrouped = useTableGroupedRows<Person>(() => ({
		data: people,
		groupBy: (p) => p.team,
		collapsedGroups: defaultCollapsedGroups,
		onToggleGroup: (groupKey) => {
			defaultCollapsedGroups = toggleGroupKey(defaultCollapsedGroups, groupKey);
		},
		getRowKey: (p) => p.id
	}));

	let initiallyCollapsedGroups = $state(new Set(['Infra']));

	const initiallyCollapsedGrouped = useTableGroupedRows<Person>(() => ({
		data: people,
		groupBy: (p) => p.team,
		collapsedGroups: initiallyCollapsedGroups,
		onToggleGroup: (groupKey) => {
			initiallyCollapsedGroups = toggleGroupKey(initiallyCollapsedGroups, groupKey);
		},
		getRowKey: (p) => p.id
	}));

	let customCollapsedGroups = $state(new Set<string>());

	const customGrouped = useTableGroupedRows<Person>(() => ({
		data: people,
		groupBy: (p) => p.team,
		collapsedGroups: customCollapsedGroups,
		onToggleGroup: (groupKey) => {
			customCollapsedGroups = toggleGroupKey(customCollapsedGroups, groupKey);
		},
		getRowKey: (p) => p.id,
		groupOrder: ['Growth', 'Infra'],
		renderGroupHeader: customGroupHeader
	}));
</script>

{#snippet customGroupHeader(groupKey: string, count: number, collapsed: boolean)}
	<span
		><strong>{groupKey}</strong> — {count}
		{count === 1 ? 'person' : 'people'}{collapsed ? ' (hidden)' : ''}</span
	>
{/snippet}

<h3>Default</h3>
<Table
	data={defaultGrouped.data}
	{columns}
	idKey={defaultGrouped.idKey}
	hasHover
	plugins={{ grouped: defaultGrouped.plugin }}
/>

<h3>Initially collapsed</h3>
<Table
	data={initiallyCollapsedGrouped.data}
	{columns}
	idKey={initiallyCollapsedGrouped.idKey}
	hasHover
	plugins={{ grouped: initiallyCollapsedGrouped.plugin }}
/>

<h3>Custom order and header</h3>
<Table
	data={customGrouped.data}
	{columns}
	idKey={customGrouped.idKey}
	hasHover
	plugins={{ grouped: customGrouped.plugin }}
/>
