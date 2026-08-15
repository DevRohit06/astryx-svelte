<script lang="ts">
	import TextArea, { type TextAreaProps } from '$lib/components/text-area/text-area.svelte';

	/**
	 * Wraps a `TextArea` in a `<form>` so a test can read the `FormData` a submit
	 * would carry. Upstream writes the `<form>` as JSX children of `render`; a
	 * Svelte test cannot pass markup children to the component under test, so the
	 * form lives here and the cases reach it via `container.querySelector('form')`
	 * — the shape `number-input-form.svelte`, `slider-form.svelte`,
	 * `switch-form.svelte` and `checkbox-input-form.svelte` already use.
	 */
	interface Props {
		textArea: TextAreaProps;
	}

	const { textArea }: Props = $props();
</script>

<form>
	<TextArea {...textArea} />
</form>
