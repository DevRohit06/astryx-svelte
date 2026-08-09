<script lang="ts">
	import ToastViewport from '$lib/components/toast/toast-viewport.svelte';
	import ShowToastButton from './show-toast-button.svelte';
	import type { ToastOptions } from '$lib/components/toast/types.js';

	/**
	 * Upstream's `renderViewport(children)` helper: a `<ToastViewport
	 * isTopLayer={false}>` wrapping one or two `ShowToastButton`s. React can pass
	 * arbitrary children to a helper; here the children are described by data, so
	 * the one shape every case needs — a list of triggers — is the prop.
	 */
	const { triggers }: { triggers: { options?: ToastOptions; triggerLabel?: string }[] } = $props();
</script>

<ToastViewport isTopLayer={false}>
	{#each triggers as trigger (trigger.triggerLabel)}
		<ShowToastButton options={trigger.options} triggerLabel={trigger.triggerLabel} />
	{/each}
</ToastViewport>
