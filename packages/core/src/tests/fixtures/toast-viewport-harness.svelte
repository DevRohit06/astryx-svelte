<script lang="ts">
	import ToastViewport from '$lib/components/toast/toast-viewport.svelte';
	import ShowToastButton from './show-toast-button.svelte';
	import type { ToastOptions, ToastPosition } from '$lib/components/toast/types.js';

	/**
	 * Upstream's `renderViewport(children)` helper: a `<ToastViewport
	 * isTopLayer={false}>` wrapping one or two `ShowToastButton`s. React can pass
	 * arbitrary children to a helper; here the children are described by data, so
	 * the one shape every case needs — a list of triggers — is the prop.
	 *
	 * `position`, `maxVisible` and `dir` are the viewport's own surface, added for
	 * the swipe and placement blocks: upstream writes each of those as a bespoke
	 * `render(<div dir="rtl"><ToastViewport position=… >…)` inside the case, which
	 * is not expressible from a `.test.ts`. The defaults are the component's, so a
	 * case that passes none of them renders exactly what it did before.
	 */
	const {
		triggers,
		position,
		maxVisible,
		dir
	}: {
		triggers: { options?: ToastOptions; triggerLabel?: string }[];
		position?: ToastPosition;
		maxVisible?: number;
		dir?: 'ltr' | 'rtl';
	} = $props();
</script>

{#snippet viewport()}
	<ToastViewport isTopLayer={false} {position} {maxVisible}>
		{#each triggers as trigger (trigger.triggerLabel)}
			<ShowToastButton options={trigger.options} triggerLabel={trigger.triggerLabel} />
		{/each}
	</ToastViewport>
{/snippet}

{#if dir}
	<div {dir}>{@render viewport()}</div>
{:else}
	{@render viewport()}
{/if}
