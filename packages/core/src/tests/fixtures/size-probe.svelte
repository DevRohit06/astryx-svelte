<script lang="ts">
	import { useSize, type ElementSize } from '$lib/internal/contexts.svelte.js';

	/**
	 * Stands in for upstream's `renderHook(() => useSize(size, defaultSize))`.
	 * A hook has to run inside a component's init, so the substitute is a
	 * component that runs it and renders what it resolved.
	 *
	 * `size` / `fallback` are typed `string`, not `ElementSize`, because upstream's
	 * `useSize` is generic (`<T extends string = ElementSize>`) and three of its
	 * cases pass values outside the union — 'compact', 'comfortable' and ''. Ours
	 * is fixed to `ElementSize`, so the widening happens once here instead of at
	 * every call site in the suite.
	 *
	 * The resolver is called *in the template*, not through a `$derived`, so the
	 * read of the inherited getter happens inside the render effect. That is what
	 * makes the "provider value changes" case a real test of the getter rather
	 * than of a cache.
	 */
	type Size = ElementSize | undefined;

	interface Props {
		size?: string;
		fallback?: string;
		testid?: string;
	}

	const { size, fallback, testid = 'probe' }: Props = $props();

	const resolveSize = useSize();
</script>

<span data-testid={testid}>{resolveSize(size as Size, fallback as Size)}</span>
