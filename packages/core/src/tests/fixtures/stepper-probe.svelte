<script lang="ts" module>
	import type { StepStatus } from '$lib/components/stepper/step-status.js';

	export interface StepConfig {
		step: number;
		label: string;
		description?: string;
		status?: StepStatus;
		isDisabled?: boolean;
		isOptional?: boolean;
		/**
		 * A preset string, or one of the two custom-indicator markers. Upstream
		 * passes a `ReactNode` inline; a Svelte test cannot author a snippet, so the
		 * two nodes its cases use are named here and rendered by the fixture.
		 */
		indicator?: 'auto' | 'number' | 'none' | 'custom-star' | 'custom-pay';
		'data-testid'?: string;
		/** Label of a `<button>` rendered in the step's content slot. */
		content?: string;
	}
</script>

<script lang="ts">
	import Stepper, { type StepperProps } from '$lib/components/stepper/stepper.svelte';
	import Step from '$lib/components/stepper/step.svelte';

	/**
	 * A `Stepper` around `Step` children, which upstream writes inline as JSX.
	 * A Svelte test cannot author a snippet, so the steps are described by the
	 * `steps` array and every stepper prop is forwarded through `...rest`
	 * (`activeStep`, `orientation`, `indicatorPosition`, `label`, `density`,
	 * `onStepClick`).
	 *
	 * `activeStep` is a plain prop, exactly as upstream's is — the cases that
	 * advance the flow drive it with `rerender`, upstream's `rerender`.
	 */
	interface Props extends Omit<StepperProps, 'children'> {
		steps: StepConfig[];
	}

	const { steps, ...rest }: Props = $props();
</script>

{#snippet star()}<span data-testid="custom-icon">★</span>{/snippet}
{#snippet pay()}<span data-testid="pay-icon">$</span>{/snippet}

<Stepper {...rest}>
	{#each steps as config (config.step)}
		{@const indicator =
			config.indicator === 'custom-star'
				? star
				: config.indicator === 'custom-pay'
					? pay
					: config.indicator}
		{#if config.content != null}
			<Step
				step={config.step}
				label={config.label}
				description={config.description}
				status={config.status}
				isDisabled={config.isDisabled}
				isOptional={config.isOptional}
				{indicator}
				data-testid={config['data-testid']}
			>
				<button type="button">{config.content}</button>
			</Step>
		{:else}
			<Step
				step={config.step}
				label={config.label}
				description={config.description}
				status={config.status}
				isDisabled={config.isDisabled}
				isOptional={config.isOptional}
				{indicator}
				data-testid={config['data-testid']}
			/>
		{/if}
	{/each}
</Stepper>
