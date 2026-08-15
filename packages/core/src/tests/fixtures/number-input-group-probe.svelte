<script lang="ts">
	import InputGroup, { type InputGroupProps } from '$lib/components/input-group/input-group.svelte';
	import NumberInput, {
		type NumberInputProps
	} from '$lib/components/number-input/number-input.svelte';

	/**
	 * Upstream's `has no dangling aria-describedby ids inside InputGroup` case,
	 * whose JSX child a Svelte case cannot author: an `<InputGroup label="Price">`
	 * holding a single `<NumberInput>`. Group props arrive through `group`, the
	 * number input's own through `numberInput` — each under its own key rather than
	 * a rest spread, as `text-input-group-probe.svelte` does.
	 *
	 * Deliberately *not* the shared `input-group-probe.svelte`: that one selects a
	 * fixed child arrangement by `variant` and passes no props through to the
	 * child, which is exactly what this case needs to vary (it turns on a `status`
	 * with a message).
	 */
	interface Props {
		group: Omit<InputGroupProps, 'children'>;
		numberInput: NumberInputProps;
	}

	const { group, numberInput }: Props = $props();
</script>

<InputGroup {...group}>
	<NumberInput {...numberInput} />
</InputGroup>
