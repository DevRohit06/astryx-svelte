<script lang="ts">
	import ToastViewport from './toast-viewport.svelte';
	import ToastFallbackCapture from './toast-fallback-capture.svelte';

	/**
	 * The root mounted into the detached fallback container when `useToast()` is
	 * called with no `ToastViewport` ancestor. Mirrors upstream's
	 *
	 * ```jsx
	 * <ToastViewport><FallbackCapture /></ToastViewport>
	 * ```
	 */
</script>

<ToastViewport>
	<ToastFallbackCapture />
</ToastViewport>
