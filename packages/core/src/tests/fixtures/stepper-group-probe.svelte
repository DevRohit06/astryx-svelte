<script lang="ts">
	import Stepper, { type StepperProps } from '$lib/components/stepper/stepper.svelte';
	import Step from '$lib/components/stepper/step.svelte';

	/**
	 * The flat-vs-grouped pair the `fragment-grouped steps` cases compare.
	 *
	 * Svelte has no fragment, so the counterpart of upstream's
	 * `<>…</>`-wrapped steps is a **snippet** rendered into the stepper: an extra
	 * node in the component tree that emits no element of its own, so the `<li>`s
	 * stay direct children of the `<ol>` — which is the whole property under test
	 * (the on-track end segments hide from each step's own `<li>` position, never
	 * from the parent counting children).
	 *
	 * The three steps are written out literally in both arms rather than looped,
	 * because a loop would put *both* arms behind a block and there would be
	 * nothing left to compare.
	 */
	const { grouped = false, ...rest }: Omit<StepperProps, 'children'> & { grouped?: boolean } =
		$props();
</script>

{#snippet onTrackSteps()}
	<Step step={0} label="Cart" />
	<Step step={1} label="Shipping" />
	<Step step={2} label="Payment" />
{/snippet}

{#if grouped}
	<Stepper {...rest}>
		{@render onTrackSteps()}
	</Stepper>
{:else}
	<Stepper {...rest}>
		<Step step={0} label="Cart" />
		<Step step={1} label="Shipping" />
		<Step step={2} label="Payment" />
	</Stepper>
{/if}
