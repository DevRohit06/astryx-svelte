<script lang="ts">
	import Table from '$lib/components/table/table.svelte';
	import { useTableFiltering } from '$lib/components/table/plugins/filtering/use-table-filtering.js';
	import type { TablePlugin } from '$lib/components/table/table-types.js';
	import type {
		TableFilterState,
		TableFilterVariant
	} from '$lib/components/table/plugins/filtering/use-table-filtering.js';
	import {
		defaultColumns,
		searchConfig,
		testData,
		type TestRow
	} from './table-filtering-fixture.svelte';

	/**
	 * Upstream's `Capture` component, which renders `null` and pushes the plugin
	 * into an array so a second render can be compared against the first.
	 *
	 * There is no second render here — a Svelte hook runs once per component
	 * instance — so the counterpart pushes from an `$effect` that reads
	 * `variant`. That is the input upstream lists in its `useMemo` dependency
	 * array, and the one whose change would hand back a *new* plugin object
	 * upstream; the port instead reads it at call time so the object survives.
	 * The effect re-run is the "render" being counted.
	 *
	 * Unlike upstream's, this `Capture` **renders the table**. It has to: the
	 * plugin-identity comparison is unfalsifiable on its own here (`plugin` is a
	 * `const` and `screen.component` is captured once, so both reads resolve to
	 * the same binding whatever the hook does), and the property that can actually
	 * fail is what the stable plugin produces into the DOM — the keyed `after`
	 * slot keeping its element across a transform re-run. `filters` is a prop
	 * rather than internal state so a test can force that re-run without opening a
	 * popover.
	 */
	interface Props {
		variant?: TableFilterVariant;
		filters?: TableFilterState;
	}

	const { variant = 'popover', filters = {} }: Props = $props();

	const plugin = useTableFiltering<TestRow>(() => ({
		filters,
		onFilterChange: () => {},
		variant,
		searchConfig
	}));

	const plugins: TablePlugin<TestRow>[] = [];

	$effect(() => {
		// Read the variant so the effect re-runs when the consumer changes it.
		void variant;
		plugins.push(plugin);
	});

	/** Read by the assertions — one entry per effect run. */
	export const captured = plugins;
</script>

<Table data={testData} columns={defaultColumns} idKey="id" plugins={{ filter: plugin }} />
