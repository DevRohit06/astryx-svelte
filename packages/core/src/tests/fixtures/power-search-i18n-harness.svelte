<script lang="ts">
	import PowerSearch from '$lib/components/power-search/power-search.svelte';
	import {
		usePowerSearchConfig,
		type FieldDefinition
	} from '$lib/components/power-search/use-power-search-config.svelte.js';
	import type { PowerSearchFilter } from '$lib/components/power-search/types.js';

	/**
	 * Upstream's `Harness` from `i18n/__tests__/e2e-powersearch.test.tsx`,
	 * verbatim: `usePowerSearchConfig` is a hook, so the suite has to render it
	 * through a component before it can hand the built config to `PowerSearch`.
	 *
	 * `filters` passes straight through. Upstream wraps it in
	 * `useMemo(() => filters, [filters])`, which returns the same array it was
	 * given and exists only to keep React's identity stable across re-renders —
	 * there is no re-render to stabilise here, and no state either: upstream's
	 * `onChange` is `() => {}`, so this harness is deliberately *not* the
	 * stateful `power-search-harness.svelte`.
	 *
	 * `resultCount={2}` is upstream's literal, and two of its five cases assert
	 * on the plural it produces.
	 */
	const {
		fieldDefs,
		filters
	}: {
		fieldDefs: ReadonlyArray<FieldDefinition>;
		filters: ReadonlyArray<PowerSearchFilter>;
	} = $props();

	const search = usePowerSearchConfig(() => fieldDefs);
</script>

<PowerSearch config={search.config} {filters} onChange={() => {}} resultCount={2} />
