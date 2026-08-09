<script lang="ts" module>
	import type { OperatorValue } from '../../../power-search/types.js';

	export interface PopoverFilterTriggerProps {
		columnKey: string;
		header: string;
		operatorValue: OperatorValue;
	}
</script>

<script lang="ts">
	import Button from '../../../button/button.svelte';
	import Icon from '../../../icon/icon.svelte';
	import Popover from '../../../popover/popover.svelte';
	import FilterControl from './filter-control.svelte';
	import FilterDraftScope from './filter-draft-scope.svelte';
	import { useTranslator } from '../../../../i18n/index.js';
	import { useFilterConfig } from './filter-context.svelte.js';
	import type { TableFilterValue, UseTableFilteringConfig } from './use-table-filtering.js';
	import {
		filterPopoverActionsAttrs,
		filterPopoverActionsSpacerAttrs,
		filterPopoverContentAttrs,
		filterTriggerAttrs
	} from './filtering.stylex.js';

	/**
	 * Internal — upstream's `PopoverFilterTrigger`: the funnel button, and the
	 * popover holding one column's control plus Reset/Apply.
	 *
	 * The draft-buffering behaviour is upstream's exactly — edits go to local
	 * state and only reach the consumer on "Apply" — and so is the mechanism:
	 * a *shadowing* config, published to the popover's subtree so `FilterControl`
	 * writes to the draft without knowing it. Upstream builds it as a `useMemo`'d
	 * `FilterStore` and wraps the content in `<FilterStoreContext value={…}>`;
	 * here it is a function rebuilt per read and `FilterDraftScope`, because
	 * Svelte sets context at component init.
	 *
	 * The three `useCallback`s and the `useMemo` all go: a closure over `$state`
	 * is stable *and* current, so there is no identity to preserve and no
	 * dependency array that could go stale. `useState` → `$state`.
	 *
	 * `aria-haspopup` is written on the button as upstream writes it. `Popover`
	 * also sets it, to the same value, when it wires the trigger it finds.
	 */
	let { columnKey, header, operatorValue }: PopoverFilterTriggerProps = $props();

	const t = useTranslator();
	const config = useFilterConfig();

	const value = $derived(config().filters[columnKey]);
	const hasValue = $derived(value != null);

	let isOpen = $state(false);

	// Buffer the filter value locally while the popover is open.
	// Only commit to the consumer's state on explicit "Apply".
	let draft = $state<TableFilterValue | null>(null);

	function handleOpen(open: boolean): void {
		if (open) {
			// Seed draft from current value when opening
			draft = value ?? null;
		}
		isOpen = open;
	}

	function handleApply(): void {
		config().onFilterChange(columnKey, draft);
		isOpen = false;
	}

	function handleClear(): void {
		config().onFilterChange(columnKey, null);
		isOpen = false;
	}

	// Build a local config override so FilterControl writes to the draft
	// instead of the consumer's state.
	function draftConfig(): UseTableFilteringConfig {
		const current = config();
		return {
			...current,
			filters: {
				...current.filters,
				[columnKey]: draft ?? undefined
			},
			onFilterChange: (_key: string, val: TableFilterValue | null) => {
				draft = val;
			}
		};
	}

	const trigger = $derived(filterTriggerAttrs(hasValue));
	const popoverContent = filterPopoverContentAttrs();
	const popoverActions = filterPopoverActionsAttrs();
	const popoverActionsSpacer = filterPopoverActionsSpacerAttrs();
</script>

{#snippet content()}
	<FilterDraftScope config={draftConfig}>
		<div class={popoverContent.class} style={popoverContent.style}>
			<FilterControl {columnKey} {header} {operatorValue} size="md" />
			<div class={popoverActions.class} style={popoverActions.style}>
				<Button
					label={t('@astryx.table.filter.reset')}
					variant="ghost"
					size="sm"
					onclick={handleClear}
				/>
				<div class={popoverActionsSpacer.class} style={popoverActionsSpacer.style}></div>
				<Button
					label={t('@astryx.table.filter.apply')}
					variant="primary"
					size="sm"
					onclick={handleApply}
				/>
			</div>
		</div>
	</FilterDraftScope>
{/snippet}

<Popover
	{isOpen}
	onOpenChange={handleOpen}
	label={t('@astryx.tableFiltering.filterByColumn', { header })}
	placement="below"
	alignment="start"
	{content}
>
	<button
		type="button"
		aria-label={t('@astryx.tableFiltering.filterByColumn', { header })}
		aria-haspopup="dialog"
		class={trigger.class}
		style={trigger.style}
	>
		<Icon icon="funnel" size="xsm" color={hasValue ? 'accent' : 'secondary'} />
	</button>
</Popover>
