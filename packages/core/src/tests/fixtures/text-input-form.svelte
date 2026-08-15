<script lang="ts">
	import TextInput, { type TextInputProps } from '$lib/components/text-input/text-input.svelte';

	/**
	 * Wraps a `TextInput` in a `<form>` so a test can read the `FormData` a submit
	 * would carry. Upstream writes the `<form>` as JSX children of `render`; a
	 * Svelte test cannot pass markup children to the component under test, so the
	 * form lives here and the cases reach it via `container.querySelector('form')`
	 * — the shape `number-input-form.svelte`, `slider-form.svelte`,
	 * `switch-form.svelte` and `checkbox-input-form.svelte` already use.
	 */
	interface Props {
		textInput: TextInputProps;
	}

	const { textInput }: Props = $props();
</script>

<form>
	<TextInput {...textInput} />
</form>
