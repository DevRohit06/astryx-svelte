<!--
	Ported from upstream's `templates/blocks/components/MediaTheme/MediaThemeLightScrim.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { AspectRatio, Button, MediaTheme, Section, Stack, Text } from '@astryx-svelte/core';

	const BRIGHT_ROOM_IMAGE_URL =
		'https://lookaside.facebook.com/assets/astryx/light-home-square-1.png';
</script>

<AspectRatio
	ratio={16 / 9}
	style="width: 360px; max-width: 100%; border-radius: var(--radius-container)"
>
	<img
		src={BRIGHT_ROOM_IMAGE_URL}
		alt="Bright room"
		style="width: 100%; height: 100%; object-fit: cover"
	/>
	<Section
		variant="transparent"
		padding={4}
		style="position: absolute; inset-block-start: 16px; inset-inline-start: 16px; max-width: 250px; background: rgba(255,255,255,0.82); border-radius: var(--radius-container); box-shadow: var(--shadow-med)"
	>
		<MediaTheme mode="light">
			<Stack direction="vertical" gap={2}>
				<Text type="body" weight="bold">Bright media surface</Text>
				<Text type="supporting" color="secondary">
					Use mode="light" when content sits on a light card or scrim.
				</Text>
				<Button label="Open" variant="ghost" size="sm" />
			</Stack>
		</MediaTheme>
	</Section>
</AspectRatio>
