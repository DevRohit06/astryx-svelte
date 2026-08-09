<script lang="ts">
	import { useTableColumnSettings } from '$lib/components/table/plugins/column-settings/use-table-column-settings.js';
	import type { UseTableColumnSettingsConfig } from '$lib/components/table/plugins/column-settings/use-table-column-settings.js';
	import type { TablePlugin } from '$lib/components/table/table-types.js';

	/**
	 * `renderHook(() => useTableColumnSettings(config))`'s stand-in.
	 *
	 * The hook returns a plugin object rather than markup, so the probe renders
	 * nothing and exposes the result as an instance export — `render(...).component`
	 * hands it back, which is the closest thing Svelte has to `result.current`.
	 *
	 * The whole config arrives as **one prop object**, deliberately: the hook takes
	 * a getter, and a getter returning a fresh literal would make every identity
	 * assertion in the suite meaningless.
	 */
	interface Props {
		config: UseTableColumnSettingsConfig;
	}

	const { config }: Props = $props();

	export const plugin: TablePlugin<Record<string, unknown>> = useTableColumnSettings(() => config);
</script>
