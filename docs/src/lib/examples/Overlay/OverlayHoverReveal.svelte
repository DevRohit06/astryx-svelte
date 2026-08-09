<!--
	Ported from upstream's `templates/blocks/components/Overlay/OverlayHoverReveal.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { AspectRatio, Button, Overlay } from '@astryx-svelte/core';

	/** Upstream's `frame` and `image` `CSSProperties` objects, as style strings. */
	const frame = 'width: 420px; max-width: 100%; border-radius: 12px; overflow: clip';
	const image = 'width: 100%; height: 100%; object-fit: cover';
</script>

<Overlay showOn="hover" align="center">
	{#snippet content()}
		<Button label="Quick view" variant="secondary" size="sm" />
	{/snippet}
	<AspectRatio ratio={16 / 9} style={frame}>
		<img
			src="https://lookaside.facebook.com/assets/astryx/light-working-horizontal-1.png"
			alt="Workspace preview"
			style={image}
		/>
	</AspectRatio>
</Overlay>
