<!--
	Ported from upstream's `templates/blocks/components/Thumbnail/ThumbnailStates.tsx`.
	Transcribed, not re-authored: the parity rule covers example content too.
-->
<script lang="ts">
	import { Stack, Text, Thumbnail } from '@astryx-svelte/core';
	import { MISTY_VALLEY } from './thumbnail-images.js';
</script>

<Stack direction="vertical" gap={4}>
	<Stack direction="vertical" gap={1}>
		<Text type="supporting" color="secondary">
			Lifecycle: empty → uploading → processing → loaded
		</Text>
		<Stack direction="horizontal" gap={3} vAlign="end">
			<Stack direction="vertical" gap={1} hAlign="center">
				<Thumbnail label="report.pdf" />
				<Text type="supporting" color="secondary">Placeholder</Text>
			</Stack>
			<Stack direction="vertical" gap={1} hAlign="center">
				<Thumbnail isLoading label="uploading.jpg" />
				<Text type="supporting" color="secondary">Skeleton</Text>
			</Stack>
			<Stack direction="vertical" gap={1} hAlign="center">
				<Thumbnail
					src={MISTY_VALLEY}
					alt="Misty mountain valley"
					isLoading
					label="misty-valley.jpg"
				/>
				<Text type="supporting" color="secondary">Uploading</Text>
			</Stack>
			<Stack direction="vertical" gap={1} hAlign="center">
				<Thumbnail src={MISTY_VALLEY} alt="Misty mountain valley" label="misty-valley.jpg" />
				<Text type="supporting" color="secondary">Loaded</Text>
			</Stack>
		</Stack>
	</Stack>
</Stack>
