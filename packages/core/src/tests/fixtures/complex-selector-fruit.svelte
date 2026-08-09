<script lang="ts" module>
	export type FruitValue = {
		fruit: 'Apple' | 'Banana';
		ripeness: 'Crisp' | 'Ripe' | 'Juicy';
	};

	const FRUITS = ['Apple', 'Banana'] as const;
	const RIPENESS = ['Crisp', 'Ripe', 'Juicy'] as const;
</script>

<script lang="ts">
	import ComplexSelector from '$lib/components/complex-selector/complex-selector.svelte';

	/**
	 * Upstream's `FruitComplexSelector` + `FruitGrid` from
	 * `ComplexSelector.test.tsx`, which a Svelte case cannot author inline: the
	 * content is a parameterised snippet, and a snippet has to be declared in
	 * markup.
	 *
	 * `FruitGrid` is a separate component upstream and a snippet here — it holds
	 * no state of its own and only renders from what it is handed, which is
	 * exactly the case the snippet form covers.
	 */
	interface Props {
		value: FruitValue;
		onChange?: (value: FruitValue) => void;
		changeAction?: (value: FruitValue) => void | Promise<void>;
	}

	const { value, onChange, changeAction }: Props = $props();
</script>

<ComplexSelector
	label="Fruit blend"
	{value}
	{onChange}
	{changeAction}
	triggerLabel={`${value.fruit} ${value.ripeness}`}
>
	{#snippet children(current, commit, close)}
		<div role="grid" aria-label="Fruit blend choices">
			{#each FRUITS as fruit (fruit)}
				{#each RIPENESS as ripeness (ripeness)}
					{@const isSelected = current.fruit === fruit && current.ripeness === ripeness}
					<button
						type="button"
						role="gridcell"
						aria-label={`${fruit} ${ripeness}`}
						aria-selected={isSelected || undefined}
						onclick={() => {
							commit({ fruit, ripeness });
							close();
						}}
					>
						{fruit}
						{ripeness}
					</button>
				{/each}
			{/each}
		</div>
	{/snippet}
</ComplexSelector>
