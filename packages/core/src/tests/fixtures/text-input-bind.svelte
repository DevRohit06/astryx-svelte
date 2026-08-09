<script lang="ts">
	import TextInput from '$lib/components/text-input/text-input.svelte';

	/**
	 * A parent that binds `TextInput`'s value two-way and mirrors it, so a test
	 * can assert the write-back a `bind:value` consumer depends on. A case cannot
	 * use `bind:` on the component under test directly, so it lives here. Sibling
	 * of `text-area-bind.svelte`.
	 */
	interface Props {
		initial: string;
	}

	const { initial }: Props = $props();
	// svelte-ignore state_referenced_locally
	let value = $state(initial);
</script>

<TextInput label="Bound" bind:value />
<span data-testid="mirror">{value}</span>
