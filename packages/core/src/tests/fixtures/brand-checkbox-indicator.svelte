<script lang="ts">
	import type { IndicatorProps } from '$lib/components/indicator/types.js';

	/**
	 * Upstream's `BrandCheckbox` from `Indicator.test.tsx`'s `useIndicator` block:
	 * a theme's replacement for the `checkbox` indicator, state in and picture
	 * out.
	 *
	 * A component file rather than a definition inside the test module, for the
	 * reason `icon-nested-theme.svelte` records: a Svelte component can only be
	 * authored in a `.svelte` file.
	 */
	const { state }: IndicatorProps<'multiSelection'> = $props();
</script>

<span data-testid="brand">{state}</span>
