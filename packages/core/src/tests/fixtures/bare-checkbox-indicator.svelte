<script lang="ts">
	import type { IndicatorProps } from '$lib/components/indicator/types.js';

	/**
	 * Upstream's `BareIndicator` from `CheckboxInput.test.tsx`'s `focus ring
	 * ownership` block: what a theme author plausibly writes — state in, picture
	 * out — destructuring `state` and dropping everything else, including any
	 * notion of a focus ring. Being bare is the point: the case asserts the ring
	 * lands on it anyway, because the owning control paints it.
	 *
	 * It renders no `class` and no `style`, so the case can prove the replacement
	 * really took effect (`className === ''`) before asserting the outline the
	 * owner wrote onto it.
	 *
	 * A component file rather than a definition inside the test module, for the
	 * reason `icon-nested-theme.svelte` records: a Svelte component can only be
	 * authored in a `.svelte` file.
	 */
	const { state }: IndicatorProps<'multiSelection'> = $props();
</script>

<span aria-hidden="true" data-testid="bare-indicator">{state === 'checked' ? 'x' : ''}</span>
