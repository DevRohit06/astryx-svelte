<script lang="ts">
	import Slider, { type SliderProps } from '$lib/components/slider/slider.svelte';

	/**
	 * Wraps a `Slider` in a `<form>` so a test can read the `FormData` a submit
	 * would carry. Upstream writes the `<form>` as JSX children of `render`; a
	 * Svelte test cannot pass markup children to the component under test, so the
	 * form lives here and the cases reach it via
	 * `container.querySelector('form')` — the shape `switch-form.svelte` and
	 * `checkbox-input-form.svelte` already use.
	 */
	interface Props {
		slider: SliderProps;
	}

	const { slider }: Props = $props();
</script>

<form>
	<Slider {...slider} />
</form>
