<script lang="ts">
	import TextArea from '$lib/components/text-area/text-area.svelte';

	/**
	 * A parent that binds `TextArea`'s value two-way and mirrors it, so a test can
	 * assert the write-back a `bind:value` consumer depends on. A case cannot use
	 * `bind:` on the component under test directly, so it lives here.
	 */
	interface Props {
		initial: string;
	}

	const { initial }: Props = $props();
	// svelte-ignore state_referenced_locally
	let value = $state(initial);
</script>

<TextArea label="Bound" bind:value />
<span data-testid="mirror">{value}</span>
