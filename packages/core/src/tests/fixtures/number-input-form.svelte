<script lang="ts">
	import NumberInput, {
		type NumberInputProps
	} from '$lib/components/number-input/number-input.svelte';

	/**
	 * Wraps a `NumberInput` in a `<form>` so a test can read the `FormData` a
	 * submit would carry. Upstream writes the `<form>` as JSX children of `render`;
	 * a Svelte test cannot pass markup children to the component under test, so the
	 * form lives here and the cases reach it via `container.querySelector('form')`
	 * — the shape `slider-form.svelte`, `switch-form.svelte` and
	 * `checkbox-input-form.svelte` already use.
	 */
	interface Props {
		numberInput: NumberInputProps;
	}

	const { numberInput }: Props = $props();
</script>

<form>
	<NumberInput {...numberInput} />
</form>
