<script lang="ts">
	import Citation, { type CitationSource } from '$lib/components/citation/citation.svelte';

	/**
	 * Hands `Citation` a **node** icon inside `source.icon`.
	 *
	 * Upstream 0.2.0 writes `icon: <svg data-testid="custom-icon" />` inline in the
	 * source object; a Svelte snippet can only be authored in a template, so a
	 * component is the smallest thing that can build the object around one.
	 *
	 * The cast is deliberate. This port's `CitationSource` still types `icon` as
	 * `string` and declares no `src` at all, so without it the fixture would not
	 * compile and the two node-icon cases could not even be *asked*. It is the
	 * counterpart of upstream's `ReactNode` widening and comes out when the
	 * component catches up — see the suite header.
	 */
	interface Props {
		title?: string;
		url?: string;
		/** Upstream 0.2.0's `source.src` — a favicon/logo URL the node icon must beat. */
		src?: string;
		number: number;
	}

	const { title, url, src, number }: Props = $props();
</script>

{#snippet iconNode()}
	<svg data-testid="custom-icon"></svg>
{/snippet}

<Citation
	source={{ title, url, src, icon: iconNode } as unknown as CitationSource}
	{number}
	data-testid="citation"
/>
