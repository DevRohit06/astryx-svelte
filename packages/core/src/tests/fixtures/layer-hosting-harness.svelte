<script lang="ts">
	import Layer from '$lib/components/layer/layer.svelte';
	import { useLayer } from '$lib/components/layer/use-layer.svelte.js';

	/**
	 * Upstream's `ContextHostingHarness`. A `lazyMount` context layer inside a
	 * host whose safety the test chooses: `unsafe` wraps the contents in a `<p>`,
	 * which is a host the layer has to be corrected out of.
	 *
	 * The trailing "Following control" button is load-bearing — the safe-host case
	 * asserts the layer lands immediately before it, which is what "inline at the
	 * render position" means in DOM terms.
	 */
	interface Props {
		/** Wrap the contents in a `<p>`, making the layer's parent unsafe. */
		unsafe?: boolean;
		/** Value for a `--test-layer-color` custom property set on the host. */
		themeColor?: string;
		/** Writing direction set on the host. */
		direction?: 'ltr' | 'rtl';
		/** Writing mode set on the host. */
		writingMode?: 'horizontal-tb' | 'vertical-rl';
	}

	const { unsafe = false, themeColor, direction, writingMode }: Props = $props();

	const id = $props.id();
	const layer = useLayer(() => ({ mode: 'context', lazyMount: true, id }));

	const hostStyle = $derived(
		[
			themeColor ? `--test-layer-color: ${themeColor}` : '',
			direction ? `direction: ${direction}` : '',
			writingMode ? `writing-mode: ${writingMode}` : ''
		]
			.filter(Boolean)
			.join('; ')
	);
</script>

{#snippet contents()}
	<button type="button" {@attach layer.attachTrigger} onclick={() => layer.show()}>Trigger</button>
	<Layer {layer}>
		<button type="button">Layer action</button>
	</Layer>
	<button type="button">Following control</button>
{/snippet}

<div data-testid="host" style={hostStyle}>
	{#if unsafe}
		<p>{@render contents()}</p>
	{:else}
		{@render contents()}
	{/if}
</div>
