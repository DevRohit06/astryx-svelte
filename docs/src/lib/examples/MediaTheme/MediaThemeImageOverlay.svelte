<!--
	Ported from upstream's `templates/blocks/components/MediaTheme/MediaThemeImageOverlay.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { AspectRatio, Button, MediaTheme, Section, Stack, Text } from '@astryx-svelte/core';

	const LANDSCAPE_IMAGE_URL =
		'https://lookaside.facebook.com/assets/astryx/light-scene-horizontal-1.png';
</script>

<AspectRatio
	ratio={16 / 9}
	style="width: 360px; max-width: 100%; border-radius: var(--radius-container)"
>
	<img
		src={LANDSCAPE_IMAGE_URL}
		alt="Landscape"
		style="width: 100%; height: 100%; object-fit: cover"
	/>
	<Section
		variant="transparent"
		padding={4}
		style="position: absolute; inset-inline: 0; inset-block-end: 0; background: linear-gradient(180deg, transparent, rgba(10,19,23,0.78))"
	>
		<MediaTheme mode="dark">
			<Stack direction="vertical" gap={2}>
				<Text type="body" weight="bold">Product launch livestream</Text>
				<Text type="supporting" color="secondary">
					MediaTheme keeps overlay text and controls readable without hard-coded color overrides.
				</Text>
				<Stack direction="horizontal" gap={2} wrap="wrap">
					<Button label="Watch" size="sm" />
					<Button label="Details" variant="secondary" size="sm" />
				</Stack>
			</Stack>
		</MediaTheme>
	</Section>
</AspectRatio>
