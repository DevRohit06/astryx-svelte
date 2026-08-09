<!--
	Ported from upstream's `templates/blocks/components/Thumbnail/ThumbnailDisabled.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, Text, Thumbnail } from '@astryx-svelte/core';
	import { GOLDEN_SUNSET } from './thumbnail-images.js';
</script>

<Stack direction="vertical" gap={4}>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Enabled</Text>
		<Stack direction="horizontal" gap={3} vAlign="center">
			<Thumbnail
				src={GOLDEN_SUNSET}
				alt="Golden sunset over mountains"
				label="golden-sunset.jpg"
				onRemove={() => {}}
			/>
			<Thumbnail label="document.pdf" onRemove={() => {}} />
		</Stack>
	</Stack>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">Disabled</Text>
		<Stack direction="horizontal" gap={3} vAlign="center">
			<Thumbnail
				src={GOLDEN_SUNSET}
				alt="Golden sunset over mountains"
				label="golden-sunset.jpg"
				onRemove={() => {}}
				isDisabled
			/>
			<Thumbnail label="document.pdf" onRemove={() => {}} isDisabled />
		</Stack>
	</Stack>
</Stack>
