<script lang="ts">
	import ToastViewport from '$lib/components/toast/toast-viewport.svelte';
	import ShowToastButton from './show-toast-button.svelte';

	/**
	 * Two viewports side by side, one per block edge, for upstream's
	 * `keeps newest toasts nearest the configured edge in wide stacks`. Two
	 * sibling viewports are component *content*, so the trigger-list data
	 * `toast-viewport-harness.svelte` takes cannot describe them.
	 */
	const { maxVisible = 3 }: { maxVisible?: number } = $props();

	const bottom = ['Bottom first', 'Bottom second', 'Bottom third'];
	const top = ['Top first', 'Top second', 'Top third'];
</script>

<ToastViewport isTopLayer={false} position="bottomEnd" {maxVisible}>
	{#each bottom as label (label)}
		<ShowToastButton options={{ body: label, isAutoHide: false }} triggerLabel={label} />
	{/each}
</ToastViewport>
<ToastViewport isTopLayer={false} position="topEnd" {maxVisible}>
	{#each top as label (label)}
		<ShowToastButton options={{ body: label, isAutoHide: false }} triggerLabel={label} />
	{/each}
</ToastViewport>
