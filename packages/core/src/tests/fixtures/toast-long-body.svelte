<script lang="ts">
	import ToastViewport from '$lib/components/toast/toast-viewport.svelte';
	import ShowToastButton from './show-toast-button.svelte';
	import Button from '$lib/components/button/button.svelte';

	/**
	 * A toast whose body wraps over several lines beside a real trailing control,
	 * for upstream's `keeps real trailing controls on the first line while long
	 * body text wraps`. Upstream passes the `<Button>` as `endContent`; here that
	 * is a snippet, so it has to be declared in a component.
	 */
	const {
		body,
		inset
	}: { body: string; inset?: { bottom?: number; start?: number; end?: number } } = $props();
</script>

{#snippet endContent()}
	<Button label="Änderungen wiederherstellen" variant="secondary" size="lg" />
{/snippet}

<ToastViewport isTopLayer={false} {inset}>
	<ShowToastButton options={{ body, isAutoHide: false, endContent }} />
</ToastViewport>
