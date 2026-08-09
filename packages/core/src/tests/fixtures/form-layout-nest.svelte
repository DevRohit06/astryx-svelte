<script lang="ts">
	import FormLayout from '$lib/components/form-layout/form-layout.svelte';
	import type { FormLayoutDirection } from '$lib/components/form-layout/form-layout-context.svelte.js';
	import DirectionReader from './form-layout-direction.svelte';

	/**
	 * Upstream's two nesting cases: an inner layout must override the outer
	 * context, and both must render their own children.
	 */
	interface Props {
		outer?: FormLayoutDirection;
		inner?: FormLayoutDirection;
		/** Renders the inputs the second nesting case looks for. */
		hasInputs?: boolean;
		/**
		 * Off for the cases about one layout — including the default-direction
		 * one, where the point is that `direction` was never passed at all.
		 */
		isNested?: boolean;
	}

	const {
		outer = 'vertical',
		inner = 'horizontal',
		hasInputs = false,
		isNested = true
	}: Props = $props();
</script>

{#if isNested}
	<FormLayout direction={outer} data-testid="outer">
		{#if hasInputs}<input data-testid="outer-child" />{/if}
		<FormLayout direction={inner} data-testid="inner">
			{#if hasInputs}
				<input data-testid="inner-child-1" />
				<input data-testid="inner-child-2" />
			{:else}
				<DirectionReader />
			{/if}
		</FormLayout>
	</FormLayout>
{:else}
	<FormLayout data-testid="outer">
		<DirectionReader />
	</FormLayout>
{/if}
