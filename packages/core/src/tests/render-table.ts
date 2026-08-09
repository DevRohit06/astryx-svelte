import type { Component } from 'svelte';
import { render } from 'vitest-browser-svelte';
import BaseTable from '$lib/components/table/base-table.svelte';
import Table from '$lib/components/table/table.svelte';
import type { TableProps } from '$lib/components/table/table.svelte';
import type { BaseTableProps } from '$lib/components/table/table-types.js';

/**
 * `render(Table, …)` / `render(BaseTable, …)` with the row generic pinned per
 * call. Used by `table.svelte.test.ts` and `table-context-menu.svelte.test.ts`.
 *
 * ## Why these exist
 *
 * `Table` and `BaseTable` are generic in their row type `T`. In markup Svelte
 * infers it from `data`, and that works: `src/routes/table-demos.svelte` hands
 * a `TableColumn<User>[]` — `renderCell` snippets included — to
 * `<Table data={users} {columns} />` and typechecks clean.
 *
 * `render()` cannot do the same, because it takes the component as a *value*
 * and the props as a separate object. `ComponentProps<typeof Table>` has no row
 * to infer from, so `T` instantiates at its constraint,
 * `Record<string, unknown>`. `TableColumn<T>` is **invariant** in `T`
 * (`renderCell?: Snippet<[T]>` is contravariant, every other member covariant),
 * so a `TableColumn<User>[]` is then rejected outright — 89 errors across the
 * two suites.
 *
 * These wrappers put the inference site back where markup has it: `T` is
 * inferred from the props object, from `data` exactly as in markup. Nothing is
 * loosened — the argument is still checked against the real `TableProps<T>` /
 * `BaseTableProps<T>`, so a genuinely wrong column or plugin still fails here.
 *
 * ## Why the cast
 *
 * `svelte2tsx` emits a `$$IsomorphicComponent` for a generic component: a
 * legacy `new (options) => SvelteComponent` construct signature *and* the
 * Svelte 5 `(internal, props) => exports` call signature, both generic. It is
 * the conditional that picks between those two forms —
 * `ComponentType<C> = C extends LegacyComponent ? new (…) => C : C` in
 * `@testing-library/svelte-core` — that drops `T` on the floor. The cast names
 * the modern signature so the generic survives; it asserts nothing about the
 * component's props, which is the part still being checked.
 *
 * Upstream's suite never meets any of this: it renders JSX, where React infers
 * `T` from the element's own props.
 */
export function renderTable<T extends Record<string, unknown>>(props: TableProps<T>) {
	return render(Table as Component<TableProps<T>>, { props });
}

export function renderBaseTable<T extends Record<string, unknown>>(props: BaseTableProps<T>) {
	return render(BaseTable as Component<BaseTableProps<T>>, { props });
}
