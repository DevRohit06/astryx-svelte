<script lang="ts">
	import { useTableColumnSettingsState } from '$lib/components/table/plugins/column-settings/use-table-column-settings-state.svelte.js';
	import type {
		UseTableColumnSettingsStateConfig,
		UseTableColumnSettingsStateReturn
	} from '$lib/components/table/plugins/column-settings/use-table-column-settings-state.svelte.js';

	/**
	 * `renderHook(() => useTableColumnSettingsState(config))`'s stand-in.
	 *
	 * The hook returns operations rather than markup, so the probe renders nothing
	 * and exposes the whole return value as an instance export — the object, not a
	 * destructuring of it, so `columnSettingsConfig` and `activeColumnKeys` stay
	 * getters and `result.current.activeColumnKeys` re-reads on every access the
	 * way React's fresh-object-per-render does.
	 *
	 * The config arrives as **one prop object** so that upstream's
	 * `expect(result.current.columnSettingsConfig).toBe(config)` can stay an
	 * identity assertion.
	 */
	interface Props {
		config: UseTableColumnSettingsStateConfig;
	}

	const { config }: Props = $props();

	// Named `result`, after `renderHook`'s `result.current`, and *not* `state` —
	// a local binding called `state` shadows the `$state` rune.
	export const result: UseTableColumnSettingsStateReturn = useTableColumnSettingsState(
		() => config
	);
</script>
