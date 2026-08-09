<script lang="ts">
	import { useTableRowExpansionState } from '$lib/components/table/plugins/row-expansion/use-table-row-expansion-state.svelte.js';
	import type { UseTableRowExpansionStateResult } from '$lib/components/table/plugins/row-expansion/use-table-row-expansion-state.svelte.js';
	import type { TreeItem } from './table-row-expansion-fixture.svelte';

	/**
	 * Probe for `useTableRowExpansionState` — Svelte's substitute for upstream's
	 * `renderHook(() => useTableRowExpansionState(…))` in the "cycle guard"
	 * block. Those cases render no table at all: they read `data` and
	 * `expansionConfig` straight off the hook.
	 *
	 * The result is exported from the instance script and the test reads it
	 * through `render(...).component`, the shape this port already uses for
	 * hooks with no markup (`chat-stream-scroll-probe.svelte`). It is exported
	 * whole rather than destructured, because its members are getters over one
	 * object — pulling `data` out here would freeze the first flattening.
	 *
	 * The component renders nothing: `renderHook` renders nothing either, and
	 * the cases assert only on the returned values.
	 */
	interface Props {
		baseData: TreeItem[];
		expandedKeys: Set<string>;
		setExpandedKeys: (next: Set<string>) => void;
	}

	const { baseData, expandedKeys, setExpandedKeys }: Props = $props();

	export const state: UseTableRowExpansionStateResult<TreeItem> =
		useTableRowExpansionState<TreeItem>(() => ({
			baseData,
			getChildren: (item) => item.children,
			getRowKey: (item) => item.id,
			expandedKeys,
			setExpandedKeys
		}));
</script>
