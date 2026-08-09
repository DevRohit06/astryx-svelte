<script lang="ts">
	import InputGroup, { type InputGroupProps } from '$lib/components/input-group/input-group.svelte';
	import TextInput, { type TextInputProps } from '$lib/components/text-input/text-input.svelte';

	/**
	 * Upstream's `has no dangling aria-describedby ids inside InputGroup` case,
	 * whose JSX child a Svelte case cannot author: an `<InputGroup label="Contact">`
	 * holding a single `<TextInput>`. Group props arrive through `group`, the text
	 * input's own through `textInput` — each under its own key rather than a rest
	 * spread, as `time-input-group-probe.svelte` does.
	 *
	 * Deliberately *not* the shared `input-group-probe.svelte`: that one selects a
	 * fixed child arrangement by `variant` and passes no props through to the
	 * child, which is exactly what this case needs to vary.
	 */
	interface Props {
		group: Omit<InputGroupProps, 'children'>;
		textInput: TextInputProps;
	}

	const { group, textInput }: Props = $props();
</script>

<InputGroup {...group}>
	<TextInput {...textInput} />
</InputGroup>
