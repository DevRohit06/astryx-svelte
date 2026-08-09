<script lang="ts">
	import Switch from '$lib/components/switch/switch.svelte';

	/**
	 * A parent that binds `Switch`'s `value` two-way and mirrors it, so a test can
	 * assert the write-back a `bind:value` consumer depends on. A case cannot use
	 * `bind:` on the component under test directly, so it lives here.
	 */
	interface Props {
		initial: boolean;
	}

	const { initial }: Props = $props();
	// svelte-ignore state_referenced_locally
	let value = $state(initial);
</script>

<Switch label="Bound" bind:value />
<span data-testid="mirror">{value ? 'on' : 'off'}</span>
