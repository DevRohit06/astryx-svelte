<script lang="ts">
	import Switch from '$lib/components/switch/switch.svelte';
	import type { SwitchProps } from '$lib/components/switch/switch.svelte';

	/**
	 * Wraps one or more `Switch`es in a `<form>` so a test can read the
	 * `FormData` a submit would carry. Upstream writes the `<form>` as JSX
	 * children of `render`; a Svelte test cannot pass markup children to the
	 * component under test, so the form lives here and the cases reach it via
	 * `container.querySelector('form')`.
	 */
	interface Props {
		switches: SwitchProps[];
	}

	const { switches }: Props = $props();
</script>

<form>
	{#each switches as props, i (i)}
		<Switch {...props} />
	{/each}
</form>
