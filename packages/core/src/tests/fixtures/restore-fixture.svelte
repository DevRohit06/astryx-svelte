<script lang="ts">
	import RestoreTrap from './restore-trap.svelte';

	interface Props {
		isActive: boolean;
		showPrev?: boolean;
		showTrap?: boolean;
	}

	const { isActive, showPrev = true, showTrap = true }: Props = $props();
</script>

<div>
	{#if showPrev}
		<button type="button" data-testid="prev">Previously focused</button>
	{/if}
	<button type="button" data-testid="other">Other outside</button>
	{#if showTrap}
		<RestoreTrap {isActive} />
	{/if}
</div>
