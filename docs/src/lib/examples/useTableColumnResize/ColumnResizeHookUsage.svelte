<!--
	Ported from upstream's `templates/blocks/components/Table/ColumnResizeHookUsage.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.

	Upstream ships this block and `TableResizableTable.tsx` as the same file apart
	from the plugin variable's name — `columnResize` here, `resizePlugin` there,
	and the `plugins={{columnResize}}` shorthand that follows from it. This port
	keeps *this* source's name, so the two ported files differ exactly as the two
	upstream sources do and no more.

	Data and columns are upstream's, unchanged — including leaving `columns`
	*unannotated*, which upstream does and which matters here: the same array is
	passed to `Table` (wanting `TableColumn<User>[]`) and to the resize config
	(wanting `TableColumn<Record<string, unknown>>[]`). `TableColumn<T>` is
	contravariant in `T` through `renderCell: Snippet<[T]>`, so an annotated
	`TableColumn<User>[]` would satisfy only one of the two; the inferred literal
	type, which carries no `renderCell`, satisfies both.

	Three translations:

	- **`useState` → `$state`** for the width overrides.
	- **The updater form is gone.** Upstream writes
	  `setColumnWidths(prev => ({...prev, ...updates}))`; the ported hook takes a
	  plain assignment, `columnWidths = {...columnWidths, ...updates}`, because a
	  `$state` read is never stale.
	- **The hook takes a getter**, where upstream passes the config object.

	One type-level adjustment: the explicit **`<User>`** on `useTableColumnResize`.
	`UseTableColumnResizeConfig` never mentions the row type, so `T` has no
	inference site and falls back to its constraint `Record<string, unknown>`;
	`TablePlugin<T>` is contravariant in `T`, so the resulting
	`TablePlugin<Record<string, unknown>>` does not satisfy `Table`'s
	`Record<string, TablePlugin<User>>`. Upstream omits the argument and relies on
	TSX inference resolving `Table`'s own `T` to the wider candidate. Naming it is
	the same plugin, pinned.

	No icon substitutions: the splitter is the plugin's own chrome.
-->
<script lang="ts">
	import { Table, pixel, proportional, useTableColumnResize } from '@astryx-svelte/core';

	interface User extends Record<string, unknown> {
		id: string;
		name: string;
		email: string;
		role: string;
	}

	const users: User[] = [
		{
			id: '1',
			name: 'Alice Johnson',
			email: 'alice@example.com',
			role: 'Engineer'
		},
		{ id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Designer' },
		{ id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'PM' },
		{ id: '4', name: 'Diana Prince', email: 'diana@example.com', role: 'Engineer' },
		{ id: '5', name: 'Eve Davis', email: 'eve@example.com', role: 'Analyst' }
	];

	// Deliberately unannotated — see the header comment.
	const columns = [
		{ key: 'name', header: 'Name' },
		{ key: 'email', header: 'Email', width: proportional(2) },
		{ key: 'role', header: 'Role', width: pixel(120) }
	];

	let columnWidths = $state<Record<string, number>>({});

	const columnResize = useTableColumnResize<User>(() => ({
		columnWidths,
		columns,
		onColumnResizeEnd: (updates) => {
			columnWidths = { ...columnWidths, ...updates };
		}
	}));
</script>

<Table data={users} {columns} idKey="id" hasHover plugins={{ columnResize }} />
