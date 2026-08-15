<script lang="ts" module>
	import type { TableColumn } from '$lib/components/table/table-types.js';

	export interface Row extends Record<string, unknown> {
		id: string;
		name: string;
		bio: string;
	}

	/** Upstream's `rows`. */
	export const rows: Row[] = [
		{ id: 'a', name: 'Ada', bio: 'Ada bio' },
		{ id: 'b', name: 'Bo', bio: 'Bo bio' },
		{ id: 'c', name: 'Cy', bio: 'Cy bio' }
	];

	/** Upstream's `columns`. */
	export const expansionColumns: TableColumn<Row>[] = [{ key: 'name', header: 'Name' }];

	/** Upstream's `multiCol`, used by the colSpan case. */
	export const multiColumns: TableColumn<Row>[] = [
		{ key: 'name', header: 'Name' },
		{ key: 'bio', header: 'Bio' }
	];

	const EMPTY_KEYS = new Set<string>();
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import Table from '$lib/components/table/table.svelte';
	import { useTableRowExpansion } from '$lib/components/table/plugins/row-expansion/use-table-row-expansion.js';

	/**
	 * Upstream's `Harness`.
	 *
	 * Four translations:
	 *
	 * - **`useState` → `$state`.** The `Set` is a plain one; reassignment is the
	 *   reactive boundary, so `onToggle` copies-and-reassigns exactly as
	 *   upstream's updater does.
	 * - **The hook takes a getter**, where upstream passes the config object.
	 * - **`renderExpanded` is a `Snippet<[Row]>`**, not `(item) => ReactNode`, and
	 *   both variants are declared in the template below rather than in
	 *   `<script>` — a snippet does not exist yet while `<script>` runs, and the
	 *   config getter reads it at render time, which is when it does.
	 * - **`panelVariant` stands in for passing a snippet.** Upstream's one case
	 *   that overrides `renderExpanded` writes the JSX inline in the test; a
	 *   `.ts` test file cannot author a snippet, so the two panels live here and
	 *   the test selects one by name. Upstream's `renderExpanded` prop is kept
	 *   alongside it for a caller that *can* pass one (`.svelte` fixtures can).
	 */
	interface Props {
		initialExpanded?: Set<string>;
		isItemExpandable?: (item: Row) => boolean;
		renderExpanded?: Snippet<[Row]>;
		panelVariant?: 'default' | 'bio';
		columns?: TableColumn<Row>[];
	}

	const {
		initialExpanded = EMPTY_KEYS,
		isItemExpandable,
		renderExpanded,
		panelVariant = 'default',
		columns = expansionColumns
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let expandedKeys = $state(new Set(initialExpanded));

	const expansion = useTableRowExpansion<Row>(() => ({
		expandedKeys,
		onToggle: (key) => {
			// Scratch space, built fresh and reassigned — the reassignment is the
			// reactive boundary, so a `SvelteSet` would buy nothing here.
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const next = new Set(expandedKeys);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			expandedKeys = next;
		},
		getRowKey: (item) => item.id,
		renderExpanded:
			renderExpanded ?? (panelVariant === 'bio' ? bioRenderExpanded : defaultRenderExpanded),
		getIsItemExpandable: isItemExpandable
	}));
</script>

{#snippet defaultRenderExpanded(item: Row)}
	<div data-testid="panel">{`${item.name}: ${item.bio}`}</div>
{/snippet}

{#snippet bioRenderExpanded(item: Row)}
	<span data-testid="panel">bio={item.bio}</span>
{/snippet}

<Table data={rows} {columns} idKey="id" plugins={{ expansion }} />
