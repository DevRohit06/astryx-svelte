<script lang="ts">
	import CheckboxInput, {
		type CheckboxInputProps
	} from '$lib/components/checkbox-input/checkbox-input.svelte';

	/**
	 * Wraps a `CheckboxInput` in a `<form>` so a test can read the `FormData` a
	 * submit would carry. Upstream writes the `<form>` as JSX children of
	 * `render`; a Svelte test cannot pass markup children to the component under
	 * test, so the form lives here and the cases reach it via
	 * `container.querySelector('form')` — the same shape `switch-form.svelte`
	 * already uses.
	 */
	interface Props {
		checkbox: CheckboxInputProps;
	}

	const { checkbox }: Props = $props();
</script>

<form>
	<CheckboxInput {...checkbox} />
</form>
