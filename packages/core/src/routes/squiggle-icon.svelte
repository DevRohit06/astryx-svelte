<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';

	// A stand-in for an icon from a library such as @lucide/svelte: any component
	// taking SVG attributes works, since Icon hands it the size and colour
	// classes rather than sizing it itself.
	const { ...rest }: SVGAttributes<SVGSVGElement> = $props();
</script>

<svg
	{...rest}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.5"
	stroke-linecap="round"
>
	<path d="M3 12c3-6 6 6 9 0s6-6 9 0" />
</svg>
