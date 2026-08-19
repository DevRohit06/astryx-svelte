<script lang="ts">
	import Layer from '$lib/components/layer/layer.svelte';
	import { useLayer } from '$lib/components/layer/use-layer.svelte.js';

	/**
	 * Upstream's `RelocatingContextHostingHarness` and
	 * `RelocatingOpenContextHostingHarness` in one fixture — they differ only in
	 * `lazyMount`, whether a trigger is rendered, and the safe branch's testid.
	 *
	 * The point of both is that the *render call itself* moves between an unsafe
	 * and a safe position while the hook stays mounted, so the marker's parent —
	 * and therefore the resolved portal target — has to be recomputed rather than
	 * reused from the previous position.
	 */
	interface Props {
		/** Render the layer inside a `<p>` (unsafe) rather than a `<section>`. */
		unsafe: boolean;
		/** Defer mounting until `show()`, and render a trigger to drive it. */
		lazyMount?: boolean;
		/** Forwarded to the hook so a test can count opens. */
		onShow?: () => void;
	}

	const { unsafe, lazyMount = false, onShow }: Props = $props();

	const id = $props.id();
	const layer = useLayer(() => ({ mode: 'context', lazyMount, id, onShow }));

	/** Exposed so a case can assert the hook's logical state, not just the DOM. */
	export const hook = layer;
</script>

{#snippet renderedLayer()}
	<Layer {layer}>
		{#if lazyMount}
			<button type="button">Layer action</button>
		{:else}
			<span>Layer content</span>
		{/if}
	</Layer>
{/snippet}

{#if lazyMount}
	<button type="button" {@attach layer.attachTrigger} onclick={() => layer.show()}>Trigger</button>
{/if}

{#if unsafe}
	<div data-testid="unsafe-host">
		<p>{@render renderedLayer()}</p>
	</div>
{:else}
	<section data-testid={lazyMount ? 'safe-host' : 'render-position'}>
		{@render renderedLayer()}
	</section>
{/if}
