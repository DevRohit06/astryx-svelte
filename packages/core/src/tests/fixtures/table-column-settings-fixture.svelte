<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableColumnSettings } from '$lib/components/table/plugins/column-settings/use-table-column-settings.js';
	import type { ColumnSettingsOption } from '$lib/components/table/plugins/column-settings/use-table-column-settings.js';
	import { useTableColumnSettingsState } from '$lib/components/table/plugins/column-settings/use-table-column-settings-state.svelte.js';
	import type { TableColumn } from '$lib/components/table/table-types.js';

	/**
	 * Upstream's `ColumnSettingsTable` from `useTableColumnSettings.test.tsx`:
	 * state hook → plugin hook → `Table`.
	 *
	 * `state.columnSettingsConfig` is a **getter** on the port's return value, so
	 * it is read inside the config getter rather than destructured — destructuring
	 * would snapshot the first value, which is the hazard the hook's docstring
	 * names.
	 *
	 * The row type is `Record<string, unknown>` rather than the suite's `User`
	 * because `render()` takes the component as a value and cannot infer a
	 * component generic from props; `render-table.ts` documents that at length.
	 * Nothing about the plugin depends on the row shape.
	 */
	interface Props {
		data: Record<string, unknown>[];
		columns: TableColumn<Record<string, unknown>>[];
		columnOptions: ColumnSettingsOption[];
		initialActiveKeys: string[];
	}

	const { data, columns, columnOptions, initialActiveKeys }: Props = $props();

	// Initial value only, as upstream's `useState(initialActiveKeys)` is.
	// svelte-ignore state_referenced_locally
	let activeKeys = $state(initialActiveKeys);

	// Named `settingsState`, not upstream's `state`: a local binding called
	// `state` shadows the `$state` rune and puts `$state(initialActiveKeys)` above
	// in its own temporal dead zone.
	const settingsState = useTableColumnSettingsState(() => ({
		columns: columnOptions,
		activeColumnKeys: activeKeys,
		onChangeActiveColumnKeys: (keys: ReadonlyArray<string>) => (activeKeys = [...keys])
	}));

	const columnSettings = useTableColumnSettings<Record<string, unknown>>(
		() => settingsState.columnSettingsConfig
	);
</script>

<Table {data} {columns} plugins={{ columnSettings }} idKey="id" />
