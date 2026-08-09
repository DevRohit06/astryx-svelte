<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { TableColumn } from '../../table-types.js';
	import type { UseTableSortableConfig } from './use-table-sortable.js';

	export interface SortHeaderButtonProps {
		/** The column this header belongs to. */
		column: TableColumn<Record<string, unknown>>;
		/** The content this button wraps — whatever the slot held before. */
		inner?: string | Snippet;
		/** Getter for the live sort config. */
		config: () => UseTableSortableConfig;
	}
</script>

<script lang="ts">
	import Icon from '../../../icon/icon.svelte';
	import { useTranslator } from '../../../../i18n/use-translator.svelte.js';
	import { buildAriaLabel, getNextDirection, resolveSortKey } from './sort-utils.js';
	import { sortButtonAttrs, sortIconWrapperAttrs, sortRankAttrs } from './sortable.stylex.js';

	/**
	 * Ported from Astryx's `SortHeaderButton`.
	 *
	 * Upstream threads a `configRef` prop so the click handler reads the current
	 * config rather than the one captured at render; the getter is that, and the
	 * component is otherwise a transcription.
	 */
	let { column, inner, config }: SortHeaderButtonProps = $props();

	const sortKey = $derived(resolveSortKey(column) ?? '');
	const entryIndex = $derived(config().sort.findIndex((e) => e.sortKey === sortKey));
	const entry = $derived(entryIndex >= 0 ? config().sort[entryIndex] : null);
	const direction = $derived(entry?.direction ?? null);

	const isMultiSort = $derived(config().isMultiSortEnabled === true && config().sort.length > 1);
	const rank = $derived(isMultiSort && entryIndex >= 0 ? entryIndex + 1 : null);

	const iconName = $derived(
		direction === 'ascending'
			? 'arrowUp'
			: direction === 'descending'
				? 'arrowDown'
				: 'arrowsUpDown'
	);

	const t = useTranslator();
	const ariaLabel = $derived(buildAriaLabel(t, column, direction, rank, config().sort.length));

	const buttonAttrs = sortButtonAttrs();
	const rankAttrs = sortRankAttrs();
	const iconAttrs = $derived(sortIconWrapperAttrs(direction != null));

	function handleClick(e: MouseEvent): void {
		const cfg = config();
		const isShift = e.shiftKey && cfg.isMultiSortEnabled;
		const allowUnsorted = cfg.allowUnsortedState ?? true;

		if (isShift) {
			// Multi-sort: toggle in place or append
			const idx = cfg.sort.findIndex((s) => s.sortKey === sortKey);
			if (idx >= 0) {
				const nextDir = getNextDirection(cfg.sort[idx].direction, allowUnsorted);
				if (nextDir == null) {
					// Remove from array
					const newSort = [...cfg.sort];
					newSort.splice(idx, 1);
					cfg.onSortChange(newSort);
				} else {
					const newSort = [...cfg.sort];
					newSort[idx] = { ...newSort[idx], direction: nextDir };
					cfg.onSortChange(newSort);
				}
			} else {
				// Append new entry
				cfg.onSortChange([...cfg.sort, { sortKey, direction: 'ascending' }]);
			}
		} else {
			// Single-sort: replace entire array
			const currentEntry = cfg.sort.find((s) => s.sortKey === sortKey);
			const nextDir = getNextDirection(currentEntry?.direction ?? null, allowUnsorted);
			if (nextDir == null) {
				cfg.onSortChange([]);
			} else {
				cfg.onSortChange([{ sortKey, direction: nextDir }]);
			}
		}
	}
</script>

<button
	type="button"
	class={buttonAttrs.class}
	style={buttonAttrs.style}
	aria-label={ariaLabel}
	onclick={handleClick}
>
	<span
		>{#if typeof inner === 'function'}{@render inner()}{:else}{inner ?? ''}{/if}</span
	>
	<span class={iconAttrs.class} style={iconAttrs.style}>
		<Icon icon={iconName} size="xsm" color={direction != null ? 'accent' : 'secondary'} />
	</span>
	{#if rank != null}
		<span class={rankAttrs.class} style={rankAttrs.style} aria-hidden="true">{rank}</span>
	{/if}
</button>
