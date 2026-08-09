<script lang="ts">
	import ComplexSelector from '$lib/components/complex-selector/complex-selector.svelte';

	/**
	 * The inline JSX of upstream's third case — content whose only affordance is
	 * a `Done` button wired to the `close` helper. A fixture rather than an
	 * inline snippet for the same reason `complex-selector-fruit.svelte` is one.
	 */
</script>

<ComplexSelector label="Fruit blend" value="Apple" triggerLabel="Apple">
	{#snippet children(_value, _commit, close)}
		<button type="button" onclick={close}>Done</button>
	{/snippet}
</ComplexSelector>
