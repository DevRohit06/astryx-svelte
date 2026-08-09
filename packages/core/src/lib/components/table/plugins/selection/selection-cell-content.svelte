<script lang="ts" module>
	export interface SelectionCellContentProps {
		/** The row item this checkbox selects. */
		item: Record<string, unknown>;
	}
</script>

<script lang="ts">
	import CheckboxInput from '../../../checkbox-input/checkbox-input.svelte';
	import { useTranslator } from '../../../../i18n/index.js';
	import { useSelectionConfig } from './selection-context.svelte.js';

	/**
	 * Ported from Astryx's `SelectionCellContent` + `SelectionCellContentInner`,
	 * merged for the same reason `SelectAllCheckbox` is — the split is a React
	 * hooks-rules artifact.
	 *
	 * `renderCell` for the synthetic selection column. Reads its own row's
	 * selection state, so toggling one row does not disturb the others.
	 */
	let { item }: SelectionCellContentProps = $props();

	const config = useSelectionConfig();
	const t = useTranslator();

	const selectable = $derived(config?.().getIsItemSelectable?.(item) ?? true);
	const enabled = $derived(config?.().getIsItemEnabled?.(item) ?? true);
	const isSelected = $derived(config?.().getIsItemSelected(item) ?? false);
	const rowLabel = $derived(config?.().getRowLabel?.(item));
</script>

{#if config && selectable}
	<CheckboxInput
		label={rowLabel != null
			? t('@astryx.table.selection.selectRowNamed', { label: rowLabel })
			: t('@astryx.table.selection.selectRow')}
		isLabelHidden
		value={isSelected}
		onChange={() => config().onSelectItem({ item, isSelected: !isSelected })}
		isDisabled={!enabled}
		size="sm"
	/>
{/if}
