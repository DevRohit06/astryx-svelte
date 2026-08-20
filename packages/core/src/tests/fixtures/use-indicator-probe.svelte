<script lang="ts">
	import { useIndicator } from '$lib/components/indicator/use-indicator.svelte.js';
	import type { IndicatorComponent, IndicatorName } from '$lib/components/indicator/types.js';

	/**
	 * `renderHook`'s stand-in for `useIndicator`: runs the hook where a
	 * context-reading hook must run — component init — and hands the resolved
	 * component back through an instance export, which is what
	 * `render(...).component` returns.
	 *
	 * It renders nothing, deliberately. `useIndicator` resolves a component
	 * *identity*, and upstream's assertion is `toBe(CheckboxIndicator)`; rendering
	 * the result and matching its markup would prove something weaker.
	 *
	 * The export is a function rather than an `export const` because the hook's
	 * return is a live getter — calling it re-reads the theme rather than pinning
	 * whatever was resolved at init.
	 */
	interface Props {
		/** Indicator name to resolve. */
		name: IndicatorName;
	}

	const { name }: Props = $props();

	// `useIndicator` takes a plain name, not a getter — upstream's
	// `renderHook(() => useIndicator('checkbox'))` reads it once too, and no case
	// swaps the name on a mounted probe.
	// svelte-ignore state_referenced_locally
	const indicator = useIndicator(name);

	/** `result.current`, read live. */
	export function current(): IndicatorComponent | undefined {
		return indicator.current;
	}
</script>
