<script lang="ts" module>
	import type {
		BodyRowRenderProps,
		TableColumn,
		TablePlugin
	} from '$lib/components/table/table-types.js';

	interface Row extends Record<string, unknown> {
		id: string;
		name: string;
	}

	const data: Row[] = [
		{ id: 'a', name: 'Ada' },
		{ id: 'b', name: 'Bo' }
	];

	const columns: TableColumn<Row>[] = [{ key: 'name', header: 'Name' }];

	/**
	 * The smallest possible `afterRow` plugin — no styles, no state, just the
	 * pipeline member under test. `panelRow` is a module snippet because a
	 * plugin object is plain data and cannot author markup.
	 */
	const plugin: TablePlugin<Row> = {
		transformBodyRow(props: BodyRowRenderProps): BodyRowRenderProps {
			return { ...props, afterRow: panelRow };
		}
	};
</script>

<script lang="ts">
	import Table from '$lib/components/table/table.svelte';

	/**
	 * Fixture for `table-after-row.test.ts` — see that file for what the
	 * assertion is and why it is server-side.
	 */
</script>

{#snippet panelRow()}
	<tr data-testid="after-row"><td colspan="2">panel</td></tr>
{/snippet}

<Table {data} {columns} idKey="id" plugins={{ after: plugin }} />
