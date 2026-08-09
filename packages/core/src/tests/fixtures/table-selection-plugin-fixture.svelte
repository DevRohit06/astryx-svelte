<script lang="ts" module>
	export interface SelectableUser extends Record<string, unknown> {
		id: string;
		name: string;
		role: string;
		isLocked: boolean;
	}
</script>

<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableSelection } from '$lib/components/table/plugins/selection/use-table-selection.js';
	import type { TableColumn } from '$lib/components/table/table-types.js';

	/**
	 * Upstream's `SelectionTable` from `useTableSelection.test.tsx`, transcribed.
	 *
	 * Selection state is local and wired straight into `useTableSelection` — no
	 * state helper in between, which is what makes this suite a test of the
	 * *plugin* rather than of `useTableSelectionState`. `useState` becomes
	 * `$state`, `nonAdminUsers` becomes a `$derived` (upstream recomputes it every
	 * render), and the config object becomes the getter the port's hook takes.
	 */
	interface Props {
		data: SelectableUser[];
		getIsItemSelectable?: (item: SelectableUser) => boolean;
		getIsItemEnabled?: (item: SelectableUser) => boolean;
		getRowLabel?: (item: SelectableUser) => string;
	}

	const { data, getIsItemSelectable, getIsItemEnabled, getRowLabel }: Props = $props();

	let selectedKeys = $state(new Set<string>());

	const nonAdminUsers = $derived(getIsItemSelectable ? data.filter(getIsItemSelectable) : data);

	const selection = useTableSelection<SelectableUser>(() => ({
		getIsItemSelected: (item) => selectedKeys.has(item.id),
		onSelectItem: ({ item, isSelected }) => {
			// Scratch space, handed straight to the setter and never mutated after.
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const next = new Set(selectedKeys);
			if (isSelected) {
				next.add(item.id);
			} else {
				next.delete(item.id);
			}
			selectedKeys = next;
		},
		onSelectAll: ({ isAllSelected }) => {
			selectedKeys = isAllSelected ? new Set(nonAdminUsers.map((u) => u.id)) : new Set();
		},
		getIsAllSelected: () =>
			nonAdminUsers.length > 0 && nonAdminUsers.every((u) => selectedKeys.has(u.id)),
		getIsIndeterminate: () => {
			const count = nonAdminUsers.filter((u) => selectedKeys.has(u.id)).length;
			return count > 0 && count < nonAdminUsers.length;
		},
		getIsItemSelectable,
		getIsItemEnabled,
		getRowLabel
	}));

	const columns: TableColumn<SelectableUser>[] = [
		{ key: 'name', header: 'Name' },
		{ key: 'role', header: 'Role' }
	];
</script>

<Table {data} {columns} idKey="id" plugins={{ selection }} />
