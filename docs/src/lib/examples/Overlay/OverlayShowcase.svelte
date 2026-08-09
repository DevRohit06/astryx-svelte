<!--
	Ported from upstream's `templates/blocks/components/Overlay/OverlayShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { AspectRatio, Button, Overlay, Text, VStack } from '@astryx-svelte/core';
</script>

<Overlay align="center">
	{#snippet content()}
		<VStack gap={2} style="text-align: center">
			<Text type="supporting" weight="bold" color="inherit">Design system foundations</Text>
			<Button label="Open gallery" variant="secondary" size="sm" />
		</VStack>
	{/snippet}
	<AspectRatio
		ratio={16 / 9}
		style="width: 520px; max-width: 100%; border-radius: 16px; overflow: clip"
	>
		<img
			src="https://lookaside.facebook.com/assets/astryx/light-scene-horizontal-1.png"
			alt="Abstract landscape"
			style="width: 100%; height: 100%; object-fit: cover"
		/>
	</AspectRatio>
</Overlay>
