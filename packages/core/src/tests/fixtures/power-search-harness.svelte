<script lang="ts">
	import PowerSearch, {
		type PowerSearchProps
	} from '$lib/components/power-search/power-search.svelte';
	import type {
		PowerSearchChangeType,
		PowerSearchFilter
	} from '$lib/components/power-search/types.js';

	/**
	 * Upstream's `PowerSearchWrapper` (`PowerSearch.test.tsx`) and `Harness`
	 * (`PowerSearchEditPopover.test.tsx`) are the same component under two names:
	 * a `useState` around `filters` so `onChange` actually lands and the tokens
	 * re-render. `PowerSearch` is controlled on both sides, so without this every
	 * case that adds or removes a filter would assert against an unchanged prop.
	 *
	 * A Svelte case cannot author a stateful wrapper inline, so the two upstream
	 * wrappers become one fixture. `initialFilters` is upstream's `useState`
	 * seed; everything else is forwarded to `PowerSearch` untouched, so a case
	 * can still set `resultCount`, `isDisabled`, and the rest.
	 */
	interface Props extends Omit<PowerSearchProps, 'filters' | 'onChange'> {
		/** Seed for the internal `filters` state — upstream's `useState(filters)`. */
		initialFilters?: ReadonlyArray<PowerSearchFilter>;
		/** Observed alongside the state update, for cases that spy on it. */
		onChange?: PowerSearchProps['onChange'];
	}

	const { initialFilters = [], onChange, ...rest }: Props = $props();

	// Seeded once, exactly as upstream's `useState(filters)` is: the harness
	// models a controlled parent that owns the array, not one that re-syncs from
	// its own prop.
	// svelte-ignore state_referenced_locally
	let filters = $state<PowerSearchFilter[]>([...initialFilters]);
</script>

<PowerSearch
	{...rest}
	{filters}
	onChange={(
		next: ReadonlyArray<PowerSearchFilter>,
		changeType: PowerSearchChangeType,
		index: number
	) => {
		filters = [...next];
		onChange?.(next, changeType, index);
	}}
/>
