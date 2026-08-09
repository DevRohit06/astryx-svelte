<script lang="ts">
	import CheckboxInput from '../../../checkbox-input/checkbox-input.svelte';
	import { useTranslator } from '../../../../i18n/index.js';
	import { useSelectionConfig } from './selection-context.svelte.js';

	/**
	 * Ported from Astryx's `SelectAllCheckbox` + `SelectAllCheckboxInner`.
	 *
	 * The split into two components is a React hooks-rules artifact — upstream
	 * says so in its own comment ("Separated so the useCallback/
	 * useSyncExternalStore hooks are not called conditionally (after the null
	 * guard)"). Svelte has no such rule, so the pair is one component and the
	 * guard is an `{#if}`.
	 *
	 * The `SELECT_NONE`/`SELECT_INDETERMINATE`/`SELECT_ALL` numeric encoding goes
	 * with it: upstream states it is there so `useSyncExternalStore`'s snapshot
	 * comparison stays a cheap numeric equality. A `$derived` needs no snapshot.
	 * The **short-circuit it encoded is kept** — `getIsIndeterminate` is not
	 * called when everything is already selected.
	 */
	const config = useSelectionConfig();
	const t = useTranslator();

	const state = $derived.by(() => {
		const c = config?.();
		if (!c) {
			return { allSelected: false, indeterminate: false };
		}
		if (c.getIsAllSelected()) {
			return { allSelected: true, indeterminate: false };
		}
		return { allSelected: false, indeterminate: c.getIsIndeterminate?.() ?? false };
	});
</script>

{#if config}
	<CheckboxInput
		label={t('@astryx.table.selection.selectAllRows')}
		isLabelHidden
		value={state.allSelected ? true : state.indeterminate ? 'indeterminate' : false}
		onChange={() => config().onSelectAll({ isAllSelected: !state.allSelected })}
		size="sm"
	/>
{/if}
