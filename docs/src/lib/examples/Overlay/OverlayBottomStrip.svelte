<!--
	Ported from upstream's `templates/blocks/components/Overlay/OverlayBottomStrip.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { AspectRatio, Badge, Overlay, Text, VStack } from '@astryx-svelte/core';
</script>

<Overlay position="bottom" align="start">
	{#snippet content()}
		<VStack gap={1}>
			<Badge label="New" variant="green" />
			<Text type="body" weight="bold" color="inherit">Weekly product highlights</Text>
			<Text type="supporting" color="inherit">12 updates across templates and tokens</Text>
		</VStack>
	{/snippet}
	<AspectRatio
		ratio={16 / 9}
		style="width: 420px; max-width: 100%; border-radius: 12px; overflow: clip"
	>
		<img
			src="https://lookaside.facebook.com/assets/astryx/illustrative-horizontal-1.png"
			alt="Product highlight preview"
			style="width: 100%; height: 100%; object-fit: cover"
		/>
	</AspectRatio>
</Overlay>
