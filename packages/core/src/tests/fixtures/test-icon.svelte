<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';

	/**
	 * Astryx's `__tests__/TestIcon.tsx`: a trivial SVG component for the cases
	 * that pass a custom icon to `Icon`'s component mode.
	 *
	 * It forwards every SVG attribute, so the prop-forwarding cases behave as they
	 * would with a real third-party icon component. Upstream also forwards a
	 * `ref`; here an attachment arrives through the same rest spread and reaches
	 * the `<svg>` identically.
	 */
	const props: SVGAttributes<SVGSVGElement> = $props();
</script>

<svg viewBox="0 0 24 24" {...props}>
	<path d="M4 4h16v16H4z" />
</svg>
