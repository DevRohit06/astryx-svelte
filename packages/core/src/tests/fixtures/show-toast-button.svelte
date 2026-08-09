<script lang="ts">
	import { useToast } from '$lib/components/toast/use-toast.svelte.js';
	import type { ToastOptions } from '$lib/components/toast/types.js';

	/**
	 * Upstream's `ShowToastButton` from `ToastViewport.test.tsx`, unchanged in
	 * shape: `useToast()` runs at init (it reads context) and the show function it
	 * returns is called from the click handler.
	 *
	 * Upstream's module-level `EMPTY_OPTIONS` default lives here rather than in the
	 * suite, because a Svelte prop default has to be written at the destructure.
	 */
	const EMPTY_OPTIONS: ToastOptions = { body: 'placeholder' };

	const {
		options = EMPTY_OPTIONS,
		triggerLabel = 'Trigger'
	}: { options?: ToastOptions; triggerLabel?: string } = $props();

	const toast = useToast();
</script>

<button type="button" onclick={() => toast(options)}>{triggerLabel}</button>
