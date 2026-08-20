<script lang="ts">
	import type { IndicatorProps } from '$lib/components/indicator/types.js';

	/**
	 * Upstream's `BrandStar` from `indicatorRegistry.test.tsx`: the indicator a
	 * *downstream package* contributes by augmenting `IndicatorMap`. Core ships no
	 * default for its name, so the package that added the name owns the component
	 * — which is the whole point the registry suite pins.
	 *
	 * A component file rather than a definition inside the test module, for the
	 * reason `icon-nested-theme.svelte` records: a Svelte component can only be
	 * authored in a `.svelte` file.
	 */
	const { state }: IndicatorProps<'singleSelection'> = $props();
</script>

<span aria-hidden="true" data-testid="star" data-state={state}></span>
