<script lang="ts">
	import ToastViewport from '$lib/components/toast/toast-viewport.svelte';
	import ShowToastButton from './show-toast-button.svelte';
	import type { ToastOptions } from '$lib/components/toast/types.js';

	/**
	 * A `ToastViewport` inside a `ToastViewport`, for upstream's
	 * `does not duplicate the landmark for nested viewports`. Nesting is component
	 * *content*, so it cannot be described by the trigger-list data
	 * `toast-viewport-harness.svelte` takes.
	 */
	const { options }: { options: ToastOptions } = $props();
</script>

<ToastViewport isTopLayer={false}>
	<ToastViewport isTopLayer={false}>
		<ShowToastButton {options} />
	</ToastViewport>
</ToastViewport>
