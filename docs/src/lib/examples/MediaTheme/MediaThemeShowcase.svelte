<!--
	Ported from upstream's `templates/blocks/components/MediaTheme/MediaThemeShowcase.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Badge, Button, Icon, MediaTheme, Section, Stack, Text } from '@astryx-svelte/core';

	const SHOWCASE_IMAGE_URL =
		'https://lookaside.facebook.com/assets/astryx/light-scene-horizontal-1.png';
</script>

<Section
	variant="transparent"
	padding={4}
	style="width: 360px; max-width: 100%; min-height: 230px; display: flex; align-items: flex-end; background-image: linear-gradient(180deg, rgba(10,19,23,0.05) 0%, rgba(10,19,23,0.82) 100%), url({SHOWCASE_IMAGE_URL}); background-size: cover; background-position: center; border-radius: var(--radius-container); box-shadow: var(--shadow-med)"
>
	<MediaTheme mode="dark">
		<Stack direction="vertical" gap={3}>
			<Stack direction="horizontal" gap={2} vAlign="center">
				<Icon icon="info" size="md" />
				<Text type="body" weight="bold">Media overlay</Text>
				<Badge label="Live" />
			</Stack>
			<Text type="supporting" color="secondary">
				Text, icons, badges, and button variants inherit legible colors on top of the dark image
				treatment.
			</Text>
			<Stack direction="horizontal" gap={2} wrap="wrap">
				<Button label="Primary" variant="primary" size="sm" />
				<Button label="Secondary" variant="secondary" size="sm" />
				<Button label="Ghost" variant="ghost" size="sm" />
			</Stack>
		</Stack>
	</MediaTheme>
</Section>
