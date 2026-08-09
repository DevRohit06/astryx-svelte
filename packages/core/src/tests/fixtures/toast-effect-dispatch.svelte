<script lang="ts">
	import ToastViewport from '$lib/components/toast/toast-viewport.svelte';
	import ToastEffectTrigger from './toast-effect-trigger.svelte';
	import type { ToastOptions } from '$lib/components/toast/types.js';

	/**
	 * `renderViewport` around a child that dispatches from a `$effect` rather than
	 * a click handler. Separate from `toast-viewport-harness.svelte` so the shared
	 * harness keeps upstream's `ShowToastButton`-only shape.
	 */
	const { options }: { options: ToastOptions } = $props();
</script>

<ToastViewport isTopLayer={false}>
	<ToastEffectTrigger {options} />
</ToastViewport>
