<script lang="ts" module>
	import {
		useLinkify,
		type LinkifySegment,
		type UseLinkifyOptions
	} from '$lib/components/link/use-linkify.js';
</script>

<script lang="ts">
	import Link from '$lib/components/link/link.svelte';

	/**
	 * The `renderHook` stand-in for `useLinkify`. `useLinkify` is pure, so the
	 * probe exposes its return through an instance `export const` (read via
	 * `render(...).component.result`, upstream's `result.current`) and *also*
	 * renders the segments — text runs as text, link segments through `<Link>` —
	 * so the cases that upstream asserts on `container.querySelector('a')` have a
	 * real `<a>` to find. One fixture serves both halves of the suite.
	 */
	const { text, options }: { text: string; options?: UseLinkifyOptions } = $props();

	// A one-shot snapshot of fixed inputs, exactly as upstream's `result.current`
	// is — the probe never re-runs the pure function, so capturing the initial
	// `text`/`options` is the intended semantics, not a missed closure.
	// svelte-ignore state_referenced_locally
	export const result: LinkifySegment[] = useLinkify(text, options);
</script>

<p>
	{#each result as segment, i (i)}
		{#if segment.type === 'link'}
			<Link href={segment.href} isExternalLink={segment.isExternal}>{segment.label}</Link>
		{:else}
			{segment.text}
		{/if}
	{/each}
</p>
