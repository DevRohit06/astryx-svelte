<script lang="ts">
	import ToastViewport from '$lib/components/toast/toast-viewport.svelte';
	import ShowToastButton from './show-toast-button.svelte';
	import Button from '$lib/components/button/button.svelte';
	import type { ToastDismissReason } from '$lib/components/toast/types.js';

	/**
	 * The one swipe case whose toast carries interactive trailing content:
	 * upstream's `does not start a swipe from interactive descendants`, which
	 * passes `endContent={<><Button label="Undo" …/><span role="switch" …/></>}`.
	 *
	 * `endContent` is a `Snippet` here rather than a `ReactNode` (recorded in
	 * `port/debts.md`), and a snippet that closes over `onAction` cannot be
	 * exported from `<script module>` — so the whole viewport is the fixture and
	 * the snippet is declared beside it.
	 */
	const {
		onAction,
		onHide
	}: { onAction: () => void; onHide: (reason: ToastDismissReason) => void } = $props();
</script>

{#snippet endContent()}
	<Button label="Undo" size="sm" onclick={onAction} />
	<span role="switch" aria-checked="false" tabindex={-1}>Mode</span>
{/snippet}

<ToastViewport isTopLayer={false}>
	<ShowToastButton options={{ body: 'Swipe toast', isAutoHide: false, endContent, onHide }} />
</ToastViewport>
